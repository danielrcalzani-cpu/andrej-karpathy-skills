// Modelo da entrega na versão claude.ai — funções puras (sem navegador), usadas pela página e pelo script de cópia.
import { computePrepared, deriveStatus, isFinal, normalizeWhatsApp } from '../../shared/domain.ts';
import type { DeliveryItem, ExecStatus } from '../../shared/domain.ts';
import { parseBool, parseDate, parsePeriod, parseSituation, parseUrgency, pick, s as str } from '../../shared/legacy-parse.ts';

export type Doc = Record<string, any>;
const now = () => new Date().toISOString();

export function itemsOf(d: Doc): (DeliveryItem & { id: number; position: number; prepared_by?: string; checked_by?: string; loaded_by?: string })[] {
  return Object.entries(d.items ?? {})
    .filter(([, v]) => v)
    .map(([k, v]: any) => ({ ...v, id: Number(k) }))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);
}

export type Ev = (type: string, extra?: { previous_status?: string | null; new_status?: string | null; details?: unknown; reason?: string | null }) => void;

/** Campos guardados como mapa (mesclados campo a campo nas gravações). */
export const MAP_FIELDS = ['items', 'problems', 'proofs'];

/** Recalcula a situação a partir do estado gravado (regras 1–3), registrando a mudança no histórico. */
export function refreshDerived(d: Doc, ev: Ev, reason: string | null, uid: string | null) {
  const items = itemsOf(d).map((i) => ({ prepared: !!i.prepared, checked: !!i.checked }));
  const st = {
    exec_status: d.exec_status as ExecStatus,
    delivery_date: (d.delivery_date ?? null) as string | null,
    items,
    material_separated: !!d.material_separated,
    prep_exception_reason: d.prep_exception_reason ?? null,
  };
  const prepared = computePrepared(st);
  const status = deriveStatus(st);
  if (prepared !== !!d.is_prepared) {
    d.is_prepared = prepared;
    d.prepared_by = prepared ? uid : null;
    d.prepared_at = prepared ? now() : null;
  }
  if (status !== d.status) {
    ev('status', { previous_status: d.status ?? null, new_status: status, reason });
    d.status = status;
  }
  d.final = isFinal(status);
  d.completed_sort = d.completed_at || d.updated_at;
}


/** Converte um registro da agenda antiga em entrega (o registro original fica em legacy_data). */
export function legacyToDelivery(
  rec: Record<string, unknown>,
  opts: { id: string; driverId: (name: string) => number; uid: string | null; newId: () => string; warnings: string[] },
): Doc | null {
  const f = pick(rec);
  const customer = str(f.customer);
  if (!customer) return null;
  const phoneRaw = str(f.phone);
  const phone = normalizeWhatsApp(phoneRaw);
  if (phoneRaw && !phone) opts.warnings.push(`${customer}: WhatsApp "${phoneRaw}" inválido; mantido no registro original.`);
  const dateRaw = str(f.date);
  const date = parseDate(dateRaw);
  if (dateRaw && !date) opts.warnings.push(`${customer}: data "${dateRaw}" não reconhecida; ficou aguardando agendamento.`);
  const driverRaw = str(f.driver);
  const situation = str(f.situation);
  const exec = parseSituation(situation);
  const ts = now();
  const created = typeof rec.criado === 'string' && rec.criado ? rec.criado : ts;
  const doneAt = typeof rec.entregueEm === 'string' && rec.entregueEm ? rec.entregueEm : ts;
  const d: Doc = {
    customer_name: customer.slice(0, 160),
    receiver_whatsapp: phone,
    salesperson: str(f.salesperson) || null,
    order_number: str(f.order) || null,
    postal_code: null,
    street: null,
    address_number: null,
    address_complement: null,
    neighborhood: null,
    city: null,
    state: null,
    reference_point: null,
    address_text: str(f.address) || null,
    materials_notes: str(f.materials) || null,
    delivery_date: date,
    delivery_period: parsePeriod(f.period),
    scheduled_start_time: null,
    scheduled_end_time: null,
    driver_id: driverRaw ? opts.driverId(driverRaw) : null,
    urgency: parseUrgency(f.urgency),
    material_separated: parseBool(f.separated),
    is_prepared: false,
    prep_exception_reason: null,
    prepared_by: null,
    prepared_at: null,
    exec_status: exec,
    status: 'aguardando_agendamento',
    driver_notes: str(f.notes) || null,
    internal_notes: null,
    route_position: null,
    legacy_situacao: situation || null,
    legacy_data: JSON.stringify(rec),
    client_request_id: opts.id,
    version: 1,
    created_by: opts.uid,
    created_at: created,
    updated_at: ts,
    completed_at: exec === 'entregue' ? doneAt : null,
    items: {},
    problems:
      exec === 'problema'
        ? { [opts.newId()]: { problem_type: 'outro', description: `Importado da agenda antiga: ${situation}`, reported_by: opts.uid, reported_at: ts, admin_notes: null, resolved_at: null, resolved_by: null, resolution_notes: null } }
        : {},
    proofs: {},
  };
  const events: Doc = {};
  const ev: Ev = (type, extra = {}) =>
    (events[opts.newId()] = { type, previous_status: extra.previous_status ?? null, new_status: extra.new_status ?? null, details: extra.details ?? null, reason: null, changed_by: opts.uid, changed_at: now() });
  ev('importada', { details: { situacao_original: situation || null } });
  refreshDerived(d, ev, null, opts.uid);
  d.events = events;
  return d;
}
