// Importação dos registros da agenda antiga (campos: Cliente, Vendedor, WhatsApp de quem recebe, Nº do pedido ou nota,
// Endereço de entrega, Materiais a entregar, Data da entrega, Período, Entregador ou motorista, Material separado?,
// Situação, Urgência, Observações). O registro original é guardado intacto em legacy_data.
import crypto from 'node:crypto';
import type { DB, Row } from './db.ts';
import { now, transaction } from './db.ts';
import { addEvent, refreshStatus } from './deliveries.ts';
import { isISODate, normalizeWhatsApp } from '../shared/domain.ts';
import type { ExecStatus, Period, Urgency } from '../shared/domain.ts';

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

// Chave normalizada do campo antigo -> campo novo. A primeira correspondência por prefixo vence.
const KEY_MAP: [string, string][] = [
  ['cliente', 'customer'],
  ['customer', 'customer'],
  ['nome', 'customer'],
  ['vendedor', 'salesperson'],
  ['whatsapp', 'phone'],
  ['telefone', 'phone'],
  ['fone', 'phone'],
  ['celular', 'phone'],
  ['numerodopedido', 'order'],
  ['nodopedido', 'order'],
  ['pedido', 'order'],
  ['nota', 'order'],
  ['endereco', 'address'],
  ['materiais', 'materials'],
  ['material', 'materials_or_flag'],
  ['datadaentrega', 'date'],
  ['data', 'date'],
  ['periodo', 'period'],
  ['entregador', 'driver'],
  ['motorista', 'driver'],
  ['separado', 'separated'],
  ['situacao', 'situation'],
  ['status', 'situation'],
  ['urgencia', 'urgency'],
  ['cor', 'urgency'],
  ['observacoes', 'notes'],
  ['observacao', 'notes'],
  ['obs', 'notes'],
];

function pick(rec: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [rawKey, value] of Object.entries(rec)) {
    const k = norm(rawKey);
    if (k.includes('separad')) {
      out.separated ??= value;
      continue;
    }
    const hit = KEY_MAP.find(([prefix]) => k.startsWith(prefix));
    if (!hit) continue;
    let field = hit[1];
    if (field === 'materials_or_flag') field = typeof value === 'boolean' ? 'separated' : 'materials';
    if (out[field] == null || out[field] === '') out[field] = value;
  }
  return out;
}

const s = (v: unknown) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)).trim();

export function parseDate(v: unknown): string | null {
  const t = s(v);
  if (!t) return null;
  if (isISODate(t.slice(0, 10))) return t.slice(0, 10);
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(t);
  if (m) {
    const y = m[3]!.length === 2 ? `20${m[3]}` : m[3]!;
    const iso = `${y}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
    return isISODate(iso) ? iso : null;
  }
  return null;
}

export function parsePeriod(v: unknown): Period | null {
  const t = norm(s(v));
  if (!t) return null;
  if (t.startsWith('manh')) return 'manha';
  if (t.startsWith('tard')) return 'tarde';
  if (t.startsWith('noit')) return 'noite';
  if (t.includes('combin') || t.includes('horario')) return 'combinado';
  return 'a_definir';
}

export function parseUrgency(v: unknown): Urgency | null {
  const t = norm(s(v));
  if (!t || t === 'false' || t === 'nao' || t === 'nenhuma') return null;
  if (/(vermelh|red|alta|urgent|true|sim|danger)/.test(t)) return 'alta';
  if (/(amarel|laranj|yellow|orange|media|atenc|warn)/.test(t)) return 'media';
  if (/(verde|green|baixa|azul|blue|tranq|pressa)/.test(t)) return 'baixa';
  return 'media';
}

export function parseBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  const t = norm(s(v));
  return ['sim', 's', 'true', '1', 'x', 'yes', 'separado', 'ok'].includes(t);
}

export function parseSituation(v: unknown): ExecStatus {
  const t = norm(s(v));
  if (t.includes('cancel')) return 'cancelada';
  if (t.includes('entregue') || t.includes('concluid') || t === 'feito' || t === 'ok') return 'entregue';
  if (t.includes('rota') || t.includes('saiu') || t.includes('caminho')) return 'em_rota';
  if (t.includes('problem')) return 'problema';
  return 'pendente';
}

/** Aceita uma lista, {entregas: [...]}, {deliveries: [...]} ou um objeto de registros. */
export function extractRecords(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data.filter((r) => r && typeof r === 'object') as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    for (const key of ['entregas', 'deliveries', 'agenda', 'items', 'data', 'registros']) {
      const v = (data as Record<string, unknown>)[key];
      if (Array.isArray(v)) return extractRecords(v);
    }
    const values = Object.values(data);
    if (values.length && values.every((v) => v && typeof v === 'object' && !Array.isArray(v))) return values as Record<string, unknown>[];
  }
  return [];
}

export interface ImportResult {
  imported: number;
  skipped_duplicates: number;
  failed: { index: number; reason: string }[];
  warnings: string[];
}

export function importLegacy(db: DB, data: unknown, userId: number | null): ImportResult {
  const records = extractRecords(data);
  const result: ImportResult = { imported: 0, skipped_duplicates: 0, failed: [], warnings: [] };
  if (!records.length) {
    result.failed.push({ index: -1, reason: 'Nenhum registro encontrado no arquivo.' });
    return result;
  }
  transaction(db, () => {
    records.forEach((rec, index) => {
      const raw = JSON.stringify(rec);
      const key = 'legado:' + crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
      if (db.prepare('SELECT id FROM deliveries WHERE client_request_id = ?').get(key)) {
        result.skipped_duplicates++;
        return;
      }
      const f = pick(rec);
      const customer = s(f.customer);
      if (!customer) {
        result.failed.push({ index, reason: 'Registro sem nome de cliente.' });
        return;
      }
      const phoneRaw = s(f.phone);
      const phone = normalizeWhatsApp(phoneRaw);
      if (phoneRaw && !phone) result.warnings.push(`${customer}: WhatsApp "${phoneRaw}" inválido; mantido no registro original.`);
      const dateRaw = s(f.date);
      const date = parseDate(dateRaw);
      if (dateRaw && !date) result.warnings.push(`${customer}: data "${dateRaw}" não reconhecida; ficou aguardando agendamento.`);

      let driverId: number | null = null;
      const driverName = s(f.driver);
      if (driverName) {
        const existing = db.prepare('SELECT id FROM drivers WHERE name = ? COLLATE NOCASE').get(driverName) as Row | undefined;
        driverId = existing
          ? existing.id
          : Number(db.prepare('INSERT INTO drivers (name, active, created_at) VALUES (?, 1, ?)').run(driverName, now()).lastInsertRowid);
      }
      const situation = s(f.situation);
      let exec = parseSituation(situation);
      const ts = now();
      const id = Number(
        db
          .prepare(
            `INSERT INTO deliveries (customer_name, receiver_whatsapp, salesperson, order_number, address_text, materials_notes,
              delivery_date, delivery_period, driver_id, urgency, material_separated, driver_notes, exec_status, status,
              legacy_situacao, legacy_data, client_request_id, created_by, created_at, updated_at, completed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aguardando_agendamento', ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            customer.slice(0, 160),
            phone,
            s(f.salesperson) || null,
            s(f.order) || null,
            s(f.address) || null,
            s(f.materials) || null,
            date,
            parsePeriod(f.period),
            driverId,
            parseUrgency(f.urgency),
            parseBool(f.separated) ? 1 : 0,
            s(f.notes) || null,
            exec,
            situation || null,
            raw,
            key,
            userId,
            ts,
            ts,
            exec === 'entregue' ? ts : null,
          ).lastInsertRowid,
      );
      if (exec === 'problema' && userId) {
        db.prepare(
          "INSERT INTO delivery_problems (delivery_id, problem_type, description, reported_by, reported_at) VALUES (?, 'outro', ?, ?, ?)",
        ).run(id, `Importado da agenda antiga: ${situation}`, userId, ts);
      } else if (exec === 'problema') {
        exec = 'pendente';
        db.prepare("UPDATE deliveries SET exec_status = 'pendente' WHERE id = ?").run(id);
      }
      addEvent(db, id, 'importada', userId, { details: { situacao_original: situation || null } });
      refreshStatus(db, id, userId);
      result.imported++;
    });
  });
  return result;
}
