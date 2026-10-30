// Regras de negócio compartilhadas entre servidor e interface.
// Tudo aqui é puro (sem I/O) para poder ser testado e reutilizado dos dois lados.

export type Role = 'admin' | 'driver';

export type Period = 'manha' | 'tarde' | 'noite' | 'combinado' | 'a_definir';
export const PERIODS: { value: Period; label: string }[] = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
  { value: 'combinado', label: 'Horário combinado' },
  { value: 'a_definir', label: 'A definir' },
];
const PERIOD_ORDER: Record<string, number> = { manha: 0, tarde: 1, noite: 2, combinado: 3, a_definir: 4 };
export function periodLabel(p: string | null | undefined): string {
  return PERIODS.find((x) => x.value === p)?.label ?? 'Sem período definido';
}
export function periodOrder(p: string | null | undefined): number {
  return p ? PERIOD_ORDER[p] ?? 5 : 5;
}

export type Urgency = 'alta' | 'media' | 'baixa';
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';
export const URGENCIES: { value: Urgency; label: string; tone: Tone }[] = [
  { value: 'alta', label: 'Urgente', tone: 'danger' },
  { value: 'media', label: 'Atenção', tone: 'warning' },
  { value: 'baixa', label: 'Sem pressa', tone: 'success' },
];
export function urgencyMeta(u: string | null | undefined) {
  return URGENCIES.find((x) => x.value === u) ?? null;
}
const URGENCY_RANK: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
export function urgencyRank(u: string | null | undefined): number {
  return u ? URGENCY_RANK[u] ?? 3 : 3;
}

/** Estado de execução (gravado). Separado do estado de preparação de material. */
export type ExecStatus = 'pendente' | 'em_rota' | 'entregue' | 'problema' | 'cancelada';
export const EXEC_STATUSES: ExecStatus[] = ['pendente', 'em_rota', 'entregue', 'problema', 'cancelada'];

/** Situação unificada exibida ao usuário (derivada). */
export type Status =
  | 'aguardando_agendamento'
  | 'aguardando_separacao'
  | 'pronta'
  | 'em_rota'
  | 'entregue'
  | 'problema'
  | 'cancelada';

export const STATUS_META: Record<Status, { label: string; tone: Tone }> = {
  aguardando_agendamento: { label: 'Aguardando agendamento', tone: 'neutral' },
  aguardando_separacao: { label: 'Aguardando separação', tone: 'warning' },
  pronta: { label: 'Pronta para entrega', tone: 'accent' },
  em_rota: { label: 'Em rota', tone: 'info' },
  entregue: { label: 'Entregue', tone: 'success' },
  problema: { label: 'Problema na entrega', tone: 'danger' },
  cancelada: { label: 'Cancelada', tone: 'neutral' },
};
export const STATUSES = Object.keys(STATUS_META) as Status[];
export const FINAL_STATUSES: Status[] = ['entregue', 'cancelada'];
export function isFinal(s: string): boolean {
  return s === 'entregue' || s === 'cancelada';
}

export const UNITS = ['caixas', 'peças', 'barras', 'm²', 'm', 'rolos', 'unidades', 'pacotes', 'sacos', 'kg', 'litros'];
/** Unidades em que a quantidade já representa volumes físicos. m², m, kg e litros não. */
const COUNTABLE_UNITS = new Set(['caixas', 'peças', 'barras', 'rolos', 'unidades', 'pacotes', 'sacos']);

export const PROBLEM_TYPES: { value: string; label: string }[] = [
  { value: 'cliente_ausente', label: 'Cliente ausente' },
  { value: 'endereco_incorreto', label: 'Endereço incorreto' },
  { value: 'material_faltando', label: 'Material faltando' },
  { value: 'cliente_recusou', label: 'Cliente recusou a entrega' },
  { value: 'atraso', label: 'Atraso na entrega' },
  { value: 'veiculo', label: 'Problema com veículo' },
  { value: 'outro', label: 'Outro problema' },
];
export function problemLabel(v: string): string {
  return PROBLEM_TYPES.find((p) => p.value === v)?.label ?? v;
}

export type ItemStage = 'prepared' | 'checked' | 'loaded';
export const STAGE_LABEL: Record<ItemStage, string> = { prepared: 'Separado', checked: 'Conferido', loaded: 'Carregado' };

export interface DeliveryItem {
  id?: number;
  description: string;
  quantity: number;
  unit: string;
  package_count: number | null;
  weight_kg: number | null;
  prepared: boolean;
  checked: boolean;
  loaded: boolean;
  prepared_by_name?: string | null;
  prepared_at?: string | null;
  checked_by_name?: string | null;
  checked_at?: string | null;
  loaded_by_name?: string | null;
  loaded_at?: string | null;
}

export interface AddressFields {
  postal_code: string | null;
  street: string | null;
  address_number: string | null;
  address_complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  reference_point: string | null;
  /** Endereço em texto livre (registros antigos ou endereço não estruturado). */
  address_text: string | null;
}

export interface DeliveryInput extends AddressFields {
  customer_name: string;
  receiver_whatsapp: string | null;
  salesperson: string | null;
  order_number: string | null;
  materials_notes: string | null;
  delivery_date: string | null;
  delivery_period: Period | null;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  driver_id: number | null;
  urgency: Urgency | null;
  material_separated: boolean;
  driver_notes: string | null;
  internal_notes: string | null;
  items: DeliveryItem[];
}

export interface Delivery extends DeliveryInput {
  id: number;
  status: Status;
  exec_status: ExecStatus;
  driver_name: string | null;
  route_position: number | null;
  prep_exception_reason: string | null;
  prepared_by_name: string | null;
  prepared_at: string | null;
  legacy_situacao: string | null;
  open_problems: number;
  version: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// ---------------------------------------------------------------------------
// Preparação e status

export function computePrepared(d: {
  items: Pick<DeliveryItem, 'prepared' | 'checked'>[];
  material_separated: boolean;
  prep_exception_reason?: string | null;
}): boolean {
  if (d.prep_exception_reason) return true;
  if (d.items.length > 0) return d.items.every((i) => i.prepared && i.checked);
  return d.material_separated;
}

export function deriveStatus(d: {
  exec_status: ExecStatus;
  delivery_date: string | null;
  items: Pick<DeliveryItem, 'prepared' | 'checked'>[];
  material_separated: boolean;
  prep_exception_reason?: string | null;
}): Status {
  switch (d.exec_status) {
    case 'cancelada':
    case 'entregue':
    case 'problema':
    case 'em_rota':
      return d.exec_status;
  }
  if (!d.delivery_date) return 'aguardando_agendamento';
  if (!computePrepared(d)) return 'aguardando_separacao';
  return 'pronta';
}

/** Volumes físicos de um item, ou null quando não dá para saber (ex.: m² sem nº de volumes). */
export function itemVolumes(i: Pick<DeliveryItem, 'quantity' | 'unit' | 'package_count'>): number | null {
  if (i.package_count != null) return i.package_count;
  if (COUNTABLE_UNITS.has(i.unit) && Number.isInteger(i.quantity)) return i.quantity;
  return null;
}

export interface Progress {
  done: number;
  total: number;
  unit: 'volumes' | 'itens';
}

/** Progresso por volumes quando todos os itens têm volume conhecido; senão por linhas de material. */
export function progress(items: DeliveryItem[], isDone: (i: DeliveryItem) => boolean): Progress {
  const vols = items.map(itemVolumes);
  if (items.length > 0 && vols.every((v) => v != null)) {
    let done = 0;
    let total = 0;
    items.forEach((i, idx) => {
      total += vols[idx]!;
      if (isDone(i)) done += vols[idx]!;
    });
    return { done, total, unit: 'volumes' };
  }
  return { done: items.filter(isDone).length, total: items.length, unit: 'itens' };
}
export const prepProgress = (items: DeliveryItem[]) => progress(items, (i) => i.prepared && i.checked);
export const loadProgress = (items: DeliveryItem[]) => progress(items, (i) => i.loaded);

export function progressText(p: Progress, verb: string): string {
  const noun = p.unit === 'volumes' ? (p.total === 1 ? 'volume' : 'volumes') : p.total === 1 ? 'item' : 'itens';
  return `${p.done} de ${p.total} ${noun} ${verb}`;
}

export function formatQuantity(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}
export function itemLine(i: Pick<DeliveryItem, 'quantity' | 'unit' | 'description'>): string {
  return `${formatQuantity(i.quantity)} ${i.unit} — ${i.description}`;
}

// ---------------------------------------------------------------------------
// Telefone / WhatsApp

/** Normaliza para o formato internacional 55 + DDD + número. Retorna null se inválido. */
export function normalizeWhatsApp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  if (digits.length === 11 && digits[2] !== '9') return null;
  return '55' + digits;
}

export function formatPhone(raw: string | null | undefined): string {
  const n = normalizeWhatsApp(raw);
  if (!n) return raw ?? '';
  const d = n.slice(2);
  return d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

/** Máscara progressiva enquanto o usuário digita. */
export function maskPhoneInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function whatsappUrl(phone: string, text: string): string | null {
  const n = normalizeWhatsApp(phone);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export const WHATSAPP_TEMPLATES: { id: string; label: string; build: (d: { customer_name: string; order_number: string | null }) => string }[] = [
  {
    id: 'a_caminho',
    label: 'Entrega a caminho',
    build: (d) =>
      `Olá, ${firstName(d.customer_name)}! Tudo bem? Aqui é da Mercatto Decor. Estamos passando para avisar que sua entrega referente ao pedido ${orderRef(d.order_number)} está a caminho. Obrigado!`,
  },
  {
    id: 'concluida',
    label: 'Entrega concluída',
    build: (d) =>
      `Olá, ${firstName(d.customer_name)}! Sua entrega do pedido ${orderRef(d.order_number)} foi registrada como concluída. A Mercatto Decor agradece pela preferência!`,
  },
  {
    id: 'problema',
    label: 'Confirmar informação',
    build: (d) =>
      `Olá, ${firstName(d.customer_name)}! Aqui é da Mercatto Decor. Precisamos confirmar uma informação sobre a entrega do pedido ${orderRef(d.order_number)}. Poderia entrar em contato conosco?`,
  },
];
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
function orderRef(n: string | null): string {
  return n ? `nº ${n}` : '';
}

// ---------------------------------------------------------------------------
// Endereço e navegação

export function formatPostalCode(raw: string | null | undefined): string {
  const d = (raw ?? '').replace(/\D/g, '');
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : raw ?? '';
}

/** Endereço legível em duas linhas. */
export function formatAddress(a: AddressFields): { line1: string; line2: string } {
  if (a.street) {
    const line1 = [a.street, a.address_number || 's/n'].join(', ') + (a.address_complement ? ` — ${a.address_complement}` : '');
    const cityUf = [a.city, a.state].filter(Boolean).join('/');
    const line2 = [a.neighborhood, cityUf].filter(Boolean).join(' · ');
    return { line1, line2 };
  }
  return { line1: a.address_text ?? '', line2: '' };
}

export function shortLocation(a: AddressFields): string {
  if (a.neighborhood) return a.neighborhood;
  if (a.street) return a.street;
  return (a.address_text ?? '').split(/[,\n]/)[0] ?? '';
}

/**
 * Texto de destino para Maps/Waze. Contém somente o endereço (sem nome ou telefone do cliente).
 * Retorna null quando não há endereço suficiente para navegar com segurança.
 */
export function navigationQuery(a: AddressFields, defaults?: { city?: string; state?: string }): string | null {
  if (a.street && a.street.trim().length >= 3) {
    const city = a.city || defaults?.city;
    const state = a.state || defaults?.state;
    if (!city && !a.postal_code) return null;
    return [
      [a.street.trim(), a.address_number?.trim()].filter(Boolean).join(', '),
      a.neighborhood,
      [city, state].filter(Boolean).join(' - '),
      a.postal_code ? formatPostalCode(a.postal_code) : null,
      'Brasil',
    ]
      .filter(Boolean)
      .join(', ');
  }
  const text = a.address_text?.replace(/\s+/g, ' ').trim();
  if (!text || text.length < 8 || !/[a-zA-ZÀ-ú]{3,}/.test(text)) return null;
  const hasCity = defaults?.city && text.toLowerCase().includes(defaults.city.toLowerCase());
  return [text, !hasCity ? defaults?.city : null, !hasCity ? defaults?.state : null].filter(Boolean).join(', ');
}

export function googleMapsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=driving`;
}
export function wazeUrl(query: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
}

// ---------------------------------------------------------------------------
// Datas (strings ISO YYYY-MM-DD; horários no fuso da operação)

export const DEFAULT_TIMEZONE = 'America/Manaus';

export function todayISO(tz: string = DEFAULT_TIMEZONE, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function isISODate(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** Segunda-feira da semana da data. */
export function startOfWeek(iso: string): string {
  const dow = new Date(iso + 'T00:00:00Z').getUTCDay();
  return addDays(iso, dow === 0 ? -6 : 1 - dow);
}
export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export function weekdayName(iso: string, short = false): string {
  const dow = new Date(iso + 'T00:00:00Z').getUTCDay();
  return short ? WEEKDAYS_SHORT[dow]! : WEEKDAYS[dow]!;
}
/** Ex.: "Sexta-feira, 30 de outubro de 2026" */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const text = `${weekdayName(iso)}, ${d} de ${MONTHS[m! - 1]} de ${y}`;
  return text[0]!.toUpperCase() + text.slice(1);
}
/** Data e hora (24h) de um timestamp UTC no fuso da operação. */
export function formatDateTime(ts: string | null | undefined, tz: string = DEFAULT_TIMEZONE): string {
  if (!ts) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(ts))
    .replace(',', ' às');
}
export function relativeDay(iso: string, today: string): string {
  if (iso === today) return 'Hoje';
  if (iso === addDays(today, 1)) return 'Amanhã';
  if (iso === addDays(today, -1)) return 'Ontem';
  return `${weekdayName(iso, true)}, ${formatDateBR(iso)}`;
}
export function greeting(tz: string = DEFAULT_TIMEZONE, now: Date = new Date()): string {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(now));
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ---------------------------------------------------------------------------
// Validação

export type FieldErrors = Record<string, string>;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function str(v: unknown, max = 500): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}
function num(v: unknown): number | null {
  if (v === '' || v == null) return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

/** Valida e normaliza os dados de uma entrega. Usado no formulário e no servidor. */
export function validateDelivery(raw: Record<string, unknown>): { value: DeliveryInput; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const customer_name = str(raw.customer_name, 160) ?? '';
  if (!customer_name) errors.customer_name = 'Informe o nome do cliente.';

  let receiver_whatsapp = str(raw.receiver_whatsapp, 40);
  if (receiver_whatsapp) {
    const n = normalizeWhatsApp(receiver_whatsapp);
    if (!n) errors.receiver_whatsapp = 'Número inválido. Use DDD + número, ex.: (92) 99123-4567.';
    else receiver_whatsapp = n;
  }

  const postal_code = str(raw.postal_code, 9)?.replace(/\D/g, '') || null;
  if (postal_code && postal_code.length !== 8) errors.postal_code = 'O CEP deve ter 8 dígitos.';
  const state = str(raw.state, 2)?.toUpperCase() ?? null;
  if (state && !/^[A-Z]{2}$/.test(state)) errors.state = 'Use a sigla do estado, ex.: AM.';

  const street = str(raw.street, 200);
  const address_text = str(raw.address_text, 500);
  if (!street && !address_text) errors.street = 'Informe o endereço de entrega.';

  const delivery_date = str(raw.delivery_date, 10);
  if (delivery_date && !isISODate(delivery_date)) errors.delivery_date = 'Data inválida.';

  const periodRaw = str(raw.delivery_period, 20);
  const delivery_period = periodRaw && PERIODS.some((p) => p.value === periodRaw) ? (periodRaw as Period) : null;
  if (periodRaw && !delivery_period) errors.delivery_period = 'Período inválido.';

  const scheduled_start_time = str(raw.scheduled_start_time, 5);
  const scheduled_end_time = str(raw.scheduled_end_time, 5);
  if (scheduled_start_time && !TIME_RE.test(scheduled_start_time)) errors.scheduled_start_time = 'Horário inválido.';
  if (scheduled_end_time && !TIME_RE.test(scheduled_end_time)) errors.scheduled_end_time = 'Horário inválido.';
  if (scheduled_start_time && scheduled_end_time && scheduled_end_time <= scheduled_start_time)
    errors.scheduled_end_time = 'O fim deve ser depois do início.';
  if ((scheduled_start_time || scheduled_end_time) && !delivery_date)
    errors.delivery_date = 'Defina a data antes de informar um horário.';

  const driverNum = num(raw.driver_id);
  const driver_id = driverNum != null && Number.isInteger(driverNum) && driverNum > 0 ? driverNum : null;

  const urgencyRaw = str(raw.urgency, 10);
  const urgency = urgencyRaw && URGENCIES.some((u) => u.value === urgencyRaw) ? (urgencyRaw as Urgency) : null;

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items: DeliveryItem[] = [];
  rawItems.slice(0, 100).forEach((ri, idx) => {
    const r = (ri ?? {}) as Record<string, unknown>;
    const description = str(r.description, 200);
    const quantity = num(r.quantity);
    const package_count = num(r.package_count);
    const weight_kg = num(r.weight_kg);
    const unit = str(r.unit, 20) ?? 'unidades';
    if (!description && quantity == null) return; // linha vazia é ignorada
    const k = `items.${idx}`;
    if (!description) errors[`${k}.description`] = 'Descreva o material.';
    if (quantity == null || Number.isNaN(quantity)) errors[`${k}.quantity`] = 'Informe a quantidade.';
    else if (quantity <= 0) errors[`${k}.quantity`] = 'A quantidade deve ser maior que zero.';
    if (package_count != null && (Number.isNaN(package_count) || package_count < 0 || !Number.isInteger(package_count)))
      errors[`${k}.package_count`] = 'Volumes deve ser um número inteiro, sem negativos.';
    if (weight_kg != null && (Number.isNaN(weight_kg) || weight_kg < 0)) errors[`${k}.weight_kg`] = 'Peso inválido.';
    const idNum = num(r.id);
    items.push({
      id: idNum && Number.isInteger(idNum) ? idNum : undefined,
      description: description ?? '',
      quantity: quantity ?? 0,
      unit,
      package_count: package_count != null && !Number.isNaN(package_count) ? package_count : null,
      weight_kg: weight_kg != null && !Number.isNaN(weight_kg) ? weight_kg : null,
      prepared: r.prepared === true,
      checked: r.checked === true,
      loaded: r.loaded === true,
    });
  });

  return {
    errors,
    value: {
      customer_name,
      receiver_whatsapp,
      salesperson: str(raw.salesperson, 120),
      order_number: str(raw.order_number, 60),
      postal_code,
      street,
      address_number: str(raw.address_number, 20),
      address_complement: str(raw.address_complement, 120),
      neighborhood: str(raw.neighborhood, 120),
      city: str(raw.city, 120),
      state,
      reference_point: str(raw.reference_point, 200),
      address_text,
      materials_notes: str(raw.materials_notes, 2000),
      delivery_date,
      delivery_period,
      scheduled_start_time,
      scheduled_end_time,
      driver_id,
      urgency,
      material_separated: raw.material_separated === true,
      driver_notes: str(raw.driver_notes, 2000),
      internal_notes: str(raw.internal_notes, 2000),
      items,
    },
  };
}
