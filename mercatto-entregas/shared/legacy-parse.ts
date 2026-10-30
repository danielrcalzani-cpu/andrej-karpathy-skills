// Leitura dos registros da agenda antiga — funções puras, usadas pelo servidor e pela versão claude.ai.
import { isISODate } from './domain.ts';
import type { ExecStatus, Period, Urgency } from './domain.ts';

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
  ['local', 'address'],
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
  ['prio', 'urgency'],
  ['cor', 'urgency'],
  ['observacoes', 'notes'],
  ['observacao', 'notes'],
  ['obs', 'notes'],
];

export function pick(rec: Record<string, unknown>) {
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

export const s = (v: unknown) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)).trim();

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

