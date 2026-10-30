// Importação dos registros da agenda antiga (campos: Cliente, Vendedor, WhatsApp de quem recebe, Nº do pedido ou nota,
// Endereço de entrega, Materiais a entregar, Data da entrega, Período, Entregador ou motorista, Material separado?,
// Situação, Urgência, Observações). O registro original é guardado intacto em legacy_data.
import crypto from 'node:crypto';
import type { DB, Row } from './db.ts';
import { now, transaction } from './db.ts';
import { addEvent, refreshStatus } from './deliveries.ts';
import { normalizeWhatsApp } from '../shared/domain.ts';
import { extractRecords, parseBool, parseDate, parsePeriod, parseSituation, parseUrgency, pick, s } from '../shared/legacy-parse.ts';

export { extractRecords, parseBool, parseDate, parsePeriod, parseSituation, parseUrgency };

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
