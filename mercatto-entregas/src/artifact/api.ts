// Versão claude.ai: substitui src/api.ts. As telas continuam chamando os mesmos endereços (/api/...),
// mas os dados ficam no banco compartilhado da página (capability `db`) e as fotos no armazenamento
// de arquivos (`assets`). As regras de negócio são as mesmas de shared/domain.ts.
//
// Segurança: quem abre a página é decidido pelo compartilhamento do claude.ai. Configurações e cadastro
// de entregadores só são graváveis por Editores (regra do banco). A restrição "entregador só vê as suas
// entregas" é aplicada pela interface; quem tem acesso de Colaborador consegue tecnicamente ler os
// registros de entregas da página.
import {
  DEFAULT_TIMEZONE,
  PERIODS,
  PROBLEM_TYPES,
  addDays,
  formatDateBR,
  isFinal,
  isISODate,
  normalizeWhatsApp,
  periodOrder,
  todayISO,
  urgencyRank,
  validateDelivery,
} from '../../shared/domain.ts';
import type { DeliveryInput, DeliveryItem, FieldErrors, ItemStage } from '../../shared/domain.ts';
import { extractRecords } from '../../shared/legacy-parse.ts';
import { invalidateAll } from '../lib.tsx';
import { MAP_FIELDS, itemsOf, legacyToDelivery, refreshDerived } from './model.ts';
import type { Doc, Ev } from './model.ts';

export class ApiError extends Error {
  status: number;
  fields?: FieldErrors;
  constructor(status: number, message: string, fields?: FieldErrors) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

const TZ = DEFAULT_TIMEZONE;
const TEAM = 'cfg/main/docs/team';
const SETTINGS = 'cfg/main/docs/settings';
const FINALS_LIMIT = 400;

// ---------------------------------------------------------------------------
// Conexão com o claude.ai

const B: {
  db: any;
  user: any;
  assets: any;
  downloads: any;
  uid: string | null;
  myName: string;
  canEdit: boolean;
  active: Map<string, Doc>;
  finals: Map<string, Doc>;
  older: Map<string, Doc>;
  team: Doc;
  settings: Doc;
  lastSeen: string;
  ready: Promise<void> | null;
  failure: string | null;
} = {
  db: null,
  user: null,
  assets: null,
  downloads: null,
  uid: null,
  myName: '',
  canEdit: false,
  active: new Map(),
  finals: new Map(),
  older: new Map(),
  team: { drivers: {}, vehicles: {} },
  settings: {},
  lastSeen: '',
  ready: null,
  failure: null,
};

let changeTimer: number | undefined;
function changed() {
  clearTimeout(changeTimer);
  changeTimer = window.setTimeout(invalidateAll, 120);
}

function connect(): Promise<void> {
  if (B.ready) return B.ready;
  B.ready = (async () => {
    const claude = (window as any).claude;
    if (!claude?.use) {
      B.failure = 'Abra este sistema pelo link do claude.ai.';
      return;
    }
    const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
    B.db = db;
    B.user = user;
    if (user) {
      const me = await user.me();
      B.uid = me.id;
      B.myName = me.name;
      B.canEdit = me.canEdit;
    }
    if (!db) {
      B.failure = 'Você precisa estar conectado ao claude.ai com uma conta que tenha acesso a esta página.';
      return;
    }
    // Recursos opcionais: sem eles, a página funciona e só esconde a função.
    claude.use('assets').then((a: any) => (B.assets = a));
    claude.use('downloads').then((d: any) => (B.downloads = d));

    const pending = new Set(['active', 'finals', 'team', 'settings']);
    let resolveFirst!: () => void;
    const first = new Promise<void>((r) => (resolveFirst = r));
    const done = (k: string) => {
      pending.delete(k);
      if (!pending.size) resolveFirst();
      changed();
    };
    const fail = (k: string) => (e: any) => {
      if (k === 'active') B.failure = e?.code === 'revoked' ? 'Seu acesso a esta página foi retirado.' : 'Não foi possível ler as entregas agora.';
      done(k);
    };
    const toMap = (snap: any) => new Map<string, Doc>(snap.docs.map((d: any) => [d.id, { ...d.data(), id: d.id }]));
    db.collection('deliveries')
      .where('final', '==', false)
      .onSnapshot((s: any) => ((B.active = toMap(s)), done('active')), fail('active'));
    db.collection('deliveries')
      .where('final', '==', true)
      .orderBy('completed_sort', 'desc')
      .limit(FINALS_LIMIT)
      .onSnapshot((s: any) => ((B.finals = toMap(s)), done('finals')), fail('finals'));
    db.doc(TEAM).onSnapshot((s: any) => ((B.team = s.exists ? { drivers: {}, vehicles: {}, ...s.data() } : { drivers: {}, vehicles: {} }), done('team')), fail('team'));
    db.doc(SETTINGS).onSnapshot((s: any) => ((B.settings = s.exists ? { ...s.data() } : {}), done('settings')), fail('settings'));
    if (B.uid) db.doc(`data/users/${B.uid}/state`).onSnapshot((s: any) => ((B.lastSeen = s.exists ? String(s.data().last_seen ?? '') : ''), changed()), () => {});
    // Sem resposta em 10 s: segue com o que houver (a lista atualiza sozinha quando o banco responder).
    await Promise.race([first, new Promise((r) => setTimeout(r, 10_000))]);
  })();
  return B.ready;
}

// ---------------------------------------------------------------------------
// Utilidades

const now = () => new Date().toISOString();
let seq = 0;
const newId = () => `${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const numericId = () => String(Date.now() * 1000 + Math.floor(Math.random() * 1000));

function badRequest(msg: string, fields?: FieldErrors): never {
  throw new ApiError(400, msg, fields);
}
function conflict(msg: string): never {
  throw new ApiError(409, msg);
}
function notFound(msg = 'Registro não encontrado.'): never {
  throw new ApiError(404, msg);
}
function forbidden(): never {
  throw new ApiError(403, 'Você não tem permissão para esta ação.');
}

function dbError(e: any): never {
  if (e instanceof ApiError) throw e;
  const code = e?.code;
  if (code === 'invalid_argument') throw new ApiError(403, 'Seu acesso a esta página não permite esta alteração. Peça ao escritório.');
  if (code === 'quota_exceeded') throw new ApiError(507, 'O armazenamento desta página está cheio. Avise o escritório.');
  if (code === 'revoked' || code === 'not_granted') throw new ApiError(401, 'Seu acesso a esta página foi retirado.');
  throw new ApiError(0, 'Sem conexão com o banco de dados. Verifique a internet e tente novamente.');
}

async function write(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e: any) {
    if (e?.code === 'unavailable') {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
      try {
        await fn();
        return;
      } catch (e2) {
        dbError(e2);
      }
    }
    dbError(e);
  }
}

interface Me {
  id: string | null;
  role: 'admin' | 'driver';
  driver_id: number | null;
  name: string;
}

let previewDriver: number | null = null; // administrador vendo o app de um entregador

function currentMe(): Me | null {
  if (B.canEdit) {
    if (previewDriver != null) return { id: B.uid, role: 'driver', driver_id: previewDriver, name: driverName(previewDriver) ?? 'Entregador' };
    return { id: B.uid, role: 'admin', driver_id: null, name: B.myName || 'Administrador' };
  }
  if (!B.uid) return null;
  const d = Object.entries(B.team.drivers ?? {}).find(([, v]: any) => v && v.user_id === B.uid && v.active !== false);
  if (!d) return null;
  return { id: B.uid, role: 'driver', driver_id: Number(d[0]), name: B.myName || (d[1] as Doc).name };
}

function requireMe(): Me {
  const me = currentMe();
  if (!me) throw new ApiError(401, 'Sem acesso.');
  return me;
}
function requireAdmin(): Me {
  const me = requireMe();
  if (me.role !== 'admin') forbidden();
  return me;
}

const driverName = (id: number | null | undefined) => (id != null ? ((B.team.drivers ?? {})[String(id)]?.name ?? null) : null);

function allDeliveries(): Doc[] {
  const map = new Map<string, Doc>();
  for (const m of [B.older, B.finals, B.active])
    for (const [k, v] of m) {
      const prev = map.get(k);
      if (!prev || String(v.updated_at) >= String(prev.updated_at)) map.set(k, v);
    }
  return [...map.values()];
}

function rawDelivery(id: string): Doc {
  const d = B.active.get(id) ?? B.finals.get(id) ?? B.older.get(id);
  if (!d) notFound('Entrega não encontrada.');
  return d;
}

async function names(ids: (string | null | undefined)[]): Promise<Record<string, string>> {
  const list = [...new Set(ids.filter(Boolean) as string[])];
  if (!list.length || !B.user) return {};
  try {
    const ps = await B.user.profiles(list);
    return Object.fromEntries(list.map((id) => [id, ps[id]?.name || 'Alguém']));
  } catch {
    return {};
  }
}

/** Converte o documento no formato que as telas usam. */
function hydrate(d: Doc, me: Me, nm: Record<string, string>) {
  const items = itemsOf(d).map((i) => ({
    ...i,
    prepared_by_name: i.prepared_by ? nm[i.prepared_by] ?? null : null,
    checked_by_name: i.checked_by ? nm[i.checked_by] ?? null : null,
    loaded_by_name: i.loaded_by ? nm[i.loaded_by] ?? null : null,
  }));
  return {
    ...d,
    id: d.id,
    items,
    driver_name: driverName(d.driver_id),
    prepared_by_name: d.prepared_by ? nm[d.prepared_by] ?? null : null,
    material_separated: !!d.material_separated,
    open_problems: Object.values(d.problems ?? {}).filter((p: any) => p && !p.resolved_at).length,
    internal_notes: me.role === 'admin' ? (d.internal_notes ?? null) : null,
    legacy_situacao: me.role === 'admin' ? (d.legacy_situacao ?? null) : null,
    legacy_data: undefined,
    events: undefined,
    problems: undefined,
    proofs: undefined,
  };
}

function personIds(docs: Doc[]) {
  const ids: string[] = [];
  for (const d of docs) {
    ids.push(d.prepared_by);
    for (const i of itemsOf(d)) ids.push(i.prepared_by!, i.checked_by!, i.loaded_by!);
  }
  return ids;
}

async function hydrateMany(docs: Doc[], me: Me) {
  const nm = await names(personIds(docs));
  return docs.map((d) => hydrate(d, me, nm));
}

function canSee(d: Doc, me: Me) {
  return me.role === 'admin' || (d.driver_id != null && Number(d.driver_id) === me.driver_id);
}

// ---------------------------------------------------------------------------
// Mutação: aplica mudanças numa cópia, recalcula a situação (mesmas regras do servidor) e grava só o que mudou.

async function mutate(id: string, fn: (d: Doc, ev: Ev) => void, opts: { reason?: string | null; version?: unknown } = {}) {
  const me = requireMe();
  const cur = rawDelivery(id);
  if (!canSee(cur, me)) notFound('Entrega não encontrada.');
  if (opts.version != null && Number(opts.version) !== Number(cur.version))
    conflict('Esta entrega foi alterada por outra pessoa enquanto você editava. Feche e abra de novo para ver a versão mais recente.');
  const next: Doc = structuredClone(cur);
  const events: Doc = {};
  const ev: Ev = (type, extra = {}) => {
    events[newId()] = {
      type,
      previous_status: extra.previous_status ?? null,
      new_status: extra.new_status ?? null,
      details: extra.details ?? null,
      reason: extra.reason ?? null,
      changed_by: me.id,
      changed_at: now(),
    };
  };
  fn(next, ev);
  next.version = Number(cur.version ?? 1) + 1;
  next.updated_at = now();
  refreshDerived(next, ev, opts.reason ?? null, me.id);

  const patch: Doc = {};
  for (const k of Object.keys(next)) {
    if (k === 'id' || k === 'events') continue;
    if (MAP_FIELDS.includes(k)) {
      const a = cur[k] ?? {};
      const b = next[k] ?? {};
      const diff: Doc = {};
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        const bv = b[key] ?? null;
        if (JSON.stringify(a[key] ?? null) !== JSON.stringify(bv)) diff[key] = bv;
      }
      if (Object.keys(diff).length) patch[k] = diff;
    } else if (JSON.stringify(cur[k] ?? null) !== JSON.stringify(next[k] ?? null)) patch[k] = next[k] ?? null;
  }
  if (Object.keys(events).length) patch.events = events;
  await write(() => B.db.doc(`deliveries/${id}`).update(patch));
  // Atualiza a memória já (o banco confirma em seguida pelo onSnapshot).
  const merged: Doc = { ...next, events: { ...(cur.events ?? {}), ...events } };
  (merged.final ? B.finals : B.active).set(id, merged);
  (merged.final ? B.active : B.finals).delete(id);
  changed();
}

function validated(body: Doc): DeliveryInput {
  const { value, errors } = validateDelivery(body);
  if (Object.keys(errors).length) badRequest('Revise os campos destacados.', errors);
  return value;
}

function assertDriver(driverId: number | null, previous: number | null = null) {
  if (driverId == null) return;
  const dr = (B.team.drivers ?? {})[String(driverId)];
  if (!dr) badRequest('Entregador não encontrado.', { driver_id: 'Entregador não encontrado.' });
  if (dr.active === false && driverId !== previous) badRequest('Este entregador está inativo.', { driver_id: 'Este entregador está inativo.' });
}

function writeItems(d: Doc, items: DeliveryItem[], uid: string | null): string[] {
  const existing: Doc = d.items ?? {};
  const keep = new Set<string>();
  const ts = now();
  let maxId = Math.max(0, ...Object.keys(existing).map(Number).filter(Number.isFinite));
  const out: Doc = {};
  items.forEach((it, position) => {
    const prepared = it.prepared || it.checked;
    const key = it.id != null && existing[String(it.id)] ? String(it.id) : String(++maxId);
    const old = existing[key] ?? null;
    keep.add(key);
    out[key] = {
      position,
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      package_count: it.package_count,
      weight_kg: it.weight_kg,
      prepared,
      prepared_by: prepared ? (old?.prepared ? old.prepared_by : uid) : null,
      prepared_at: prepared ? (old?.prepared ? old.prepared_at : ts) : null,
      checked: it.checked,
      checked_by: it.checked ? (old?.checked ? old.checked_by : uid) : null,
      checked_at: it.checked ? (old?.checked ? old.checked_at : ts) : null,
      loaded: old?.loaded ?? false,
      loaded_by: old?.loaded_by ?? null,
      loaded_at: old?.loaded_at ?? null,
    };
  });
  const removed: string[] = [];
  for (const [k, v] of Object.entries(existing)) {
    if (!v || keep.has(k)) continue;
    removed.push((v as Doc).description);
    out[k] = null; // remoção (o banco mescla objetos, então a chave fica nula)
  }
  d.items = out;
  return removed;
}

const SCHEDULE_FIELDS = ['delivery_date', 'delivery_period', 'scheduled_start_time', 'scheduled_end_time', 'driver_id'] as const;
const EDIT_FIELDS = [
  'customer_name',
  'receiver_whatsapp',
  'salesperson',
  'order_number',
  'postal_code',
  'street',
  'address_number',
  'address_complement',
  'neighborhood',
  'city',
  'state',
  'reference_point',
  'address_text',
  'materials_notes',
  'urgency',
  'driver_notes',
  'internal_notes',
] as const;
type Schedule = Pick<DeliveryInput, (typeof SCHEDULE_FIELDS)[number]>;

/** Regra 7: reagendar preserva a agenda anterior no histórico. */
function applySchedule(d: Doc, sched: Schedule, ev: Ev, reason: string | null): boolean {
  const changedFields = SCHEDULE_FIELDS.filter((f) => (d[f] ?? null) !== (sched[f] ?? null));
  if (!changedFields.length) return false;
  assertDriver(sched.driver_id, d.driver_id ?? null);
  const routeChanged = (d.delivery_date ?? null) !== sched.delivery_date || (d.driver_id ?? null) !== sched.driver_id;
  const before = { data: d.delivery_date ?? null, periodo: d.delivery_period ?? null, inicio: d.scheduled_start_time ?? null, fim: d.scheduled_end_time ?? null, entregador: driverName(d.driver_id) };
  const hadDate = !!d.delivery_date;
  for (const f of SCHEDULE_FIELDS) d[f] = sched[f] ?? null;
  if (routeChanged) {
    d.route_position = null;
    if (d.exec_status === 'em_rota') d.exec_status = 'pendente';
  }
  ev(hadDate ? 'reagendamento' : 'agendamento', {
    details: {
      antes: before,
      depois: { data: sched.delivery_date, periodo: sched.delivery_period, inicio: sched.scheduled_start_time, fim: sched.scheduled_end_time, entregador: driverName(sched.driver_id) },
    },
    reason,
  });
  return true;
}

function parseSchedule(body: Doc, d: Doc): Schedule {
  const merged: Doc = { ...d, items: [] };
  for (const f of SCHEDULE_FIELDS) if (f in body) merged[f] = body[f];
  const { value, errors } = validateDelivery(merged);
  const relevant = Object.fromEntries(Object.entries(errors).filter(([k]) => (SCHEDULE_FIELDS as readonly string[]).includes(k)));
  if (Object.keys(relevant).length) badRequest('Revise os dados do agendamento.', relevant);
  return value;
}

const textOf = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function setStage(it: Doc, stage: ItemStage, value: boolean, uid: string | null) {
  if (!!it[stage] !== value) {
    it[stage] = value;
    it[`${stage}_by`] = value ? uid : null;
    it[`${stage}_at`] = value ? now() : null;
  }
  if (stage === 'checked' && value) setStage(it, 'prepared', true, uid);
  if (stage === 'prepared' && !value) setStage(it, 'checked', false, uid);
}

function parseStage(v: unknown): ItemStage {
  if (v === 'prepared' || v === 'checked' || v === 'loaded') return v;
  badRequest('Etapa inválida.');
}

// ---------------------------------------------------------------------------
// Rotas da "API"

type Handler = (p: Record<string, string>, q: URLSearchParams, body: Doc, headers: Record<string, string>) => Promise<unknown> | unknown;
const routes: { method: string; re: RegExp; keys: string[]; fn: Handler }[] = [];
function route(method: string, pattern: string, fn: Handler) {
  const keys: string[] = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
  routes.push({ method, re, keys, fn });
}

route('GET', '/api/auth/me', () => {
  if (B.failure) return { user: null, reason: B.failure };
  const me = currentMe();
  if (!me) {
    return {
      user: null,
      reason: B.uid
        ? 'Seu acesso ainda não foi vinculado a um cadastro de entregador. Peça ao escritório para vincular você em Entregadores.'
        : 'Entre no claude.ai com a conta que recebeu acesso a esta página.',
    };
  }
  return { user: { id: me.id, name: me.name, username: '', role: me.role, driver_id: me.driver_id, preview: previewDriver != null } };
});

route('GET', '/api/config', () => ({
  today: todayISO(TZ),
  timezone: TZ,
  default_city: B.settings.default_city ?? '',
  default_state: B.settings.default_state ?? '',
  route_optimization: false,
  max_photo_mb: 8,
}));

route('POST', '/api/auth/logout', () => {
  previewDriver = null;
  return { ok: true };
});

// Administrador abre o app de um entregador para conferir o que ele vê.
route('POST', '/api/preview/driver', (_p, _q, body) => {
  if (!B.canEdit) forbidden();
  previewDriver = body.driver_id == null ? null : Number(body.driver_id);
  return { ok: true };
});

const norm = (t: unknown) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const byRoute = (a: Doc, b: Doc) =>
  (a.delivery_date ? 0 : 1) - (b.delivery_date ? 0 : 1) ||
  String(a.delivery_date ?? '').localeCompare(String(b.delivery_date ?? '')) ||
  (a.route_position == null ? 1 : 0) - (b.route_position == null ? 1 : 0) ||
  (a.route_position ?? 0) - (b.route_position ?? 0) ||
  periodOrder(a.delivery_period) - periodOrder(b.delivery_period) ||
  String(a.scheduled_start_time ?? '99').localeCompare(String(b.scheduled_start_time ?? '99')) ||
  String(a.id).localeCompare(String(b.id));

const STATUS_RANK: Record<string, number> = { problema: 0, aguardando_separacao: 1, pronta: 2, em_rota: 3, aguardando_agendamento: 4, entregue: 5, cancelada: 6 };
const SORTS: Record<string, (a: Doc, b: Doc) => number> = {
  date: byRoute,
  urgency: (a, b) => urgencyRank(a.urgency) - urgencyRank(b.urgency) || byRoute(a, b),
  customer: (a, b) => String(a.customer_name).localeCompare(String(b.customer_name), 'pt-BR'),
  driver: (a, b) =>
    (driverName(a.driver_id) ? 0 : 1) - (driverName(b.driver_id) ? 0 : 1) || String(driverName(a.driver_id) ?? '').localeCompare(String(driverName(b.driver_id) ?? ''), 'pt-BR') || byRoute(a, b),
  status: (a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9) || byRoute(a, b),
  recent: (a, b) => String(b.updated_at).localeCompare(String(a.updated_at)),
  completed: (a, b) => String(b.completed_sort ?? '').localeCompare(String(a.completed_sort ?? '')),
};

async function loadOlderFinals(n: number) {
  if (B.finals.size < FINALS_LIMIT || B.older.size >= n) return;
  try {
    const snap = await B.db.collection('deliveries').where('final', '==', true).orderBy('completed_sort', 'desc').limit(Math.min(n + 50, 1000)).get();
    B.older = new Map(snap.docs.map((d: any) => [d.id, { ...d.data(), id: d.id }]));
  } catch {
    /* histórico antigo indisponível agora */
  }
}

route('GET', '/api/deliveries', async (_p, q) => {
  const me = requireMe();
  const today = todayISO(TZ);
  const limit = Math.min(Math.max(Number(q.get('limit')) || 100, 1), 500);
  const offset = Math.max(Number(q.get('offset')) || 0, 0);
  const wantsFinals = q.get('include_done') === '1' || /entregue|cancelada/.test(q.get('status') ?? '') || q.get('scope') === 'history';
  if (wantsFinals) await loadOlderFinals(offset + limit);
  let list = allDeliveries();

  if (me.role === 'driver') {
    list = list.filter((d) => Number(d.driver_id) === me.driver_id);
    list =
      q.get('scope') === 'history'
        ? list.filter((d) => d.status === 'entregue' || d.status === 'cancelada')
        : list.filter((d) => !['entregue', 'cancelada', 'aguardando_agendamento'].includes(d.status) || (d.status === 'entregue' && d.delivery_date === today));
  }
  const search = norm(q.get('q')?.trim());
  if (search) list = list.filter((d) => ['customer_name', 'order_number', 'street', 'neighborhood', 'address_text', 'city'].some((f) => norm(d[f]).includes(search)));
  const statuses = q.get('status')?.split(',').filter(Boolean);
  if (statuses?.length) list = list.filter((d) => statuses.includes(d.status));
  else if (me.role === 'admin' && q.get('include_done') !== '1') list = list.filter((d) => !isFinal(d.status));
  const driver = q.get('driver');
  if (driver === 'none') list = list.filter((d) => d.driver_id == null);
  else if (driver) list = list.filter((d) => Number(d.driver_id) === Number(driver));
  const urgency = q.get('urgency');
  if (urgency === 'any') list = list.filter((d) => d.urgency);
  else if (urgency) list = list.filter((d) => d.urgency === urgency);
  const separated = q.get('separated');
  if (separated === 'no') list = list.filter((d) => !d.is_prepared && !isFinal(d.status));
  if (separated === 'yes') list = list.filter((d) => d.is_prepared);
  const period = q.get('period');
  if (period === 'none') list = list.filter((d) => !d.delivery_period);
  else if (period && PERIODS.some((p) => p.value === period)) list = list.filter((d) => d.delivery_period === period);
  const from = q.get('from');
  const to = q.get('to');
  if (isISODate(from)) list = list.filter((d) => d.delivery_date && d.delivery_date >= from);
  if (isISODate(to)) list = list.filter((d) => d.delivery_date && d.delivery_date <= to);
  if (q.get('unscheduled') === '1') list = list.filter((d) => !d.delivery_date);
  if (q.get('overdue') === '1') list = list.filter((d) => d.delivery_date && d.delivery_date < today && !isFinal(d.status));

  list.sort(SORTS[q.get('sort') ?? 'date'] ?? SORTS.date);
  return { total: list.length, items: await hydrateMany(list.slice(offset, offset + limit), me) };
});

route('GET', '/api/deliveries/check-order', (_p, q) => {
  requireAdmin();
  const order = norm(q.get('order')?.trim());
  if (!order) return { matches: [] };
  const exclude = q.get('exclude');
  return {
    matches: allDeliveries()
      .filter((d) => norm(d.order_number) === order && String(d.id) !== exclude)
      .slice(0, 5)
      .map((d) => ({ id: d.id, customer_name: d.customer_name, delivery_date: d.delivery_date, status: d.status })),
  };
});

async function detail(id: string) {
  const me = requireMe();
  const d = rawDelivery(id);
  if (!canSee(d, me)) notFound('Entrega não encontrada.');
  const problems = Object.entries(d.problems ?? {})
    .filter(([, v]) => v)
    .map(([k, v]: any) => ({ ...v, id: k }))
    .sort((a, b) => String(b.reported_at).localeCompare(String(a.reported_at)));
  const proofs = Object.entries(d.proofs ?? {})
    .filter(([, v]) => v)
    .map(([k, v]: any) => ({ ...v, id: k }))
    .sort((a, b) => String(b.completed_at).localeCompare(String(a.completed_at)));
  const events =
    me.role === 'admin'
      ? Object.entries(d.events ?? {})
          .filter(([, v]) => v)
          .map(([k, v]: any) => ({ ...v, id: k }))
          .sort((a, b) => String(b.changed_at).localeCompare(String(a.changed_at)) || String(b.id).localeCompare(String(a.id)))
          .slice(0, 200)
      : [];
  const nm = await names([
    ...personIds([d]),
    ...problems.flatMap((p) => [p.reported_by, p.resolved_by]),
    ...proofs.map((p) => p.completed_by),
    ...events.map((e) => e.changed_by),
  ]);
  return {
    delivery: hydrate(d, me, nm),
    problems: problems.map((p) => ({
      ...p,
      reported_by_name: nm[p.reported_by] ?? 'Alguém',
      resolved_by_name: p.resolved_by ? nm[p.resolved_by] ?? 'Alguém' : null,
      admin_notes: me.role === 'admin' ? p.admin_notes ?? null : null,
    })),
    proofs: proofs.map((p) => ({ ...p, completed_by_name: nm[p.completed_by] ?? 'Alguém' })),
    events: events.map((e) => ({ ...e, changed_by_name: e.changed_by ? nm[e.changed_by] ?? 'Alguém' : null })),
  };
}

route('GET', '/api/deliveries/:id', (p) => detail(p.id!));

route('POST', '/api/deliveries', async (_p, _q, body, headers) => {
  const me = requireAdmin();
  const input = validated(body);
  // Reenvio do mesmo formulário (duplo clique, rede lenta) reaproveita a mesma entrega.
  const key = headers['Idempotency-Key'];
  const existing = key ? allDeliveries().find((d) => d.client_request_id === key) : undefined;
  if (existing) return detail(existing.id);
  assertDriver(input.driver_id);
  const id = numericId();
  const ts = now();
  const d: Doc = {
    ...Object.fromEntries(EDIT_FIELDS.map((f) => [f, input[f] ?? null])),
    ...Object.fromEntries(SCHEDULE_FIELDS.map((f) => [f, input[f] ?? null])),
    material_separated: input.material_separated,
    is_prepared: false,
    prep_exception_reason: null,
    prepared_by: null,
    prepared_at: null,
    exec_status: 'pendente',
    status: 'aguardando_agendamento',
    route_position: null,
    legacy_situacao: null,
    legacy_data: null,
    client_request_id: key ?? null,
    version: 1,
    created_by: me.id,
    created_at: ts,
    updated_at: ts,
    completed_at: null,
    problems: {},
    proofs: {},
  };
  writeItems(d, input.items, me.id);
  for (const [k, v] of Object.entries(d.items)) if (v === null) delete d.items[k];
  const events: Doc = {};
  const ev: Ev = (type, extra = {}) =>
    (events[newId()] = {
      type,
      previous_status: extra.previous_status ?? null,
      new_status: extra.new_status ?? null,
      details: extra.details ?? null,
      reason: extra.reason ?? null,
      changed_by: me.id,
      changed_at: now(),
    });
  ev('criada', { new_status: 'aguardando_agendamento' });
  refreshDerived(d, ev, null, me.id);
  d.events = events;
  await write(() => B.db.doc(`deliveries/${id}`).set(d));
  (d.final ? B.finals : B.active).set(id, { ...d, id });
  changed();
  return detail(id);
});

route('PUT', '/api/deliveries/:id', async (p, _q, body) => {
  const me = requireAdmin();
  if (body.version == null) badRequest('Versão da entrega ausente.');
  const input = validated(body);
  await mutate(
    p.id!,
    (d, ev) => {
      const changedFields: string[] = EDIT_FIELDS.filter((f) => (d[f] ?? null) !== (input[f] ?? null));
      for (const f of changedFields) d[f] = (input as Doc)[f] ?? null;
      if (!!d.material_separated !== input.material_separated) {
        d.material_separated = input.material_separated;
        changedFields.push('material_separated');
      }
      const removed = writeItems(d, input.items, me.id);
      applySchedule(d, input, ev, null);
      if (changedFields.length || removed.length) ev('edicao', { details: { campos: changedFields, materiais_removidos: removed } });
    },
    { version: body.version },
  );
  return detail(p.id!);
});

route('POST', '/api/deliveries/:id/schedule', async (p, _q, body) => {
  requireAdmin();
  const reason = textOf(body.reason, 500) || null;
  await mutate(
    p.id!,
    (d, ev) => {
      if (isFinal(d.status)) conflict('Entregas concluídas ou canceladas não podem ser reagendadas. Reabra primeiro.');
      applySchedule(d, parseSchedule(body, d), ev, reason);
    },
    { reason, version: body.version },
  );
  return detail(p.id!);
});

route('POST', '/api/deliveries/:id/material-separated', async (p, _q, body) => {
  requireAdmin();
  await mutate(p.id!, (d, ev) => {
    if (isFinal(d.status)) conflict('Esta entrega já foi encerrada.');
    d.material_separated = body.value === true;
    ev('preparo', { details: { material_separado: body.value === true } });
  });
  return detail(p.id!);
});

route('POST', '/api/deliveries/:id/prep-exception', async (p, _q, body) => {
  requireAdmin();
  const reason = textOf(body.reason, 500);
  const clear = body.clear === true;
  if (!clear && reason.length < 5) badRequest('Explique o motivo da exceção.', { reason: 'Explique o motivo (mín. 5 caracteres).' });
  await mutate(
    p.id!,
    (d, ev) => {
      if (isFinal(d.status)) conflict('Esta entrega já foi encerrada.');
      d.prep_exception_reason = clear ? null : reason;
      ev(clear ? 'excecao_removida' : 'excecao_preparo', { reason: clear ? null : reason });
    },
    { reason: clear ? null : reason },
  );
  return detail(p.id!);
});

function stageGuard(stage: ItemStage) {
  const me = requireMe();
  // Entregador só confirma carregamento; separação e conferência são do depósito.
  if (me.role === 'driver' && stage !== 'loaded') forbidden();
  return me;
}

route('POST', '/api/deliveries/:id/items/confirm-all', async (p, _q, body) => {
  const stage = parseStage(body.stage);
  const me = stageGuard(stage);
  await mutate(p.id!, (d, ev) => {
    if (isFinal(d.status)) conflict('Esta entrega já foi encerrada.');
    const keys = Object.keys(d.items ?? {}).filter((k) => d.items[k]);
    if (!keys.length) badRequest('Esta entrega não tem materiais cadastrados.');
    for (const k of keys) setStage(d.items[k], stage, true, me.id);
    ev(stage === 'loaded' ? 'carregamento' : 'preparo', { details: { etapa: stage, todos: true } });
  });
  return detail(p.id!);
});

route('POST', '/api/deliveries/:id/items/:itemId/stage', async (p, _q, body) => {
  const stage = parseStage(body.stage);
  const me = stageGuard(stage);
  await mutate(p.id!, (d, ev) => {
    if (isFinal(d.status) && stage !== 'loaded') conflict('Esta entrega já foi encerrada.');
    const it = d.items?.[p.itemId!];
    if (!it) notFound('Material não encontrado.');
    const value = body.value === true;
    setStage(it, stage, value, me.id);
    ev(stage === 'loaded' ? 'carregamento' : 'preparo', { details: { item: it.description, etapa: stage, valor: value } });
  });
  return detail(p.id!);
});

/** Regra 4: início da entrega. */
route('POST', '/api/deliveries/:id/start', async (p) => {
  await mutate(p.id!, (d) => {
    if (d.status === 'em_rota') return;
    if (d.status === 'aguardando_separacao') conflict('O material desta entrega ainda não foi conferido. Fale com o depósito antes de sair.');
    if (d.status === 'aguardando_agendamento') conflict('Esta entrega ainda não tem data agendada.');
    if (d.status !== 'pronta') conflict('Esta entrega não pode ser iniciada na situação atual.');
    if (d.driver_id == null) conflict('Defina um entregador antes de iniciar a rota.');
    if (d.delivery_date > todayISO(TZ)) conflict(`Esta entrega está agendada para ${formatDateBR(d.delivery_date)}.`);
    d.exec_status = 'em_rota';
  });
  return detail(p.id!);
});

/** Regra 5: confirmação com comprovante. */
route('POST', '/api/deliveries/:id/complete', async (p, _q, body) => {
  const me = requireMe();
  const receiver = textOf(body.receiver_name, 160);
  if (receiver.length < 2) badRequest('Informe quem recebeu.', { receiver_name: 'Informe o nome de quem recebeu.' });
  const notes = textOf(body.notes, 1000) || null;
  const validId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(v);
  const photoIds = [...new Set((Array.isArray(body.photo_ids) ? body.photo_ids : [body.photo_id]).filter(validId))];
  await mutate(p.id!, (d) => {
    if (d.status === 'entregue') conflict('Esta entrega já foi confirmada.');
    if (!['pronta', 'em_rota', 'problema'].includes(d.status))
      conflict(
        d.status === 'aguardando_separacao'
          ? 'O material desta entrega ainda não foi conferido.'
          : d.status === 'aguardando_agendamento'
            ? 'Esta entrega ainda não foi agendada.'
            : 'Esta entrega não pode ser confirmada na situação atual.',
      );
    const ts = now();
    d.proofs = { ...(d.proofs ?? {}), [newId()]: { receiver_name: receiver, photo_id: photoIds[0] ?? null, photo_ids: photoIds, notes, completed_by: me.id, completed_at: ts } };
    for (const [k, prob] of Object.entries(d.problems ?? {}))
      if (prob && !(prob as Doc).resolved_at)
        d.problems[k] = { ...(prob as Doc), resolved_at: ts, resolved_by: me.id, resolution_notes: (prob as Doc).resolution_notes ?? 'Entrega concluída.' };
    d.completed_at = ts;
    d.exec_status = 'entregue';
  });
  return detail(p.id!);
});

/** Regra 6: problema na entrega. */
route('POST', '/api/deliveries/:id/problems', async (p, _q, body) => {
  const me = requireMe();
  const type = String(body.problem_type ?? '');
  if (!PROBLEM_TYPES.some((t) => t.value === type)) badRequest('Escolha o tipo de problema.', { problem_type: 'Escolha uma opção.' });
  const description = textOf(body.description, 1000) || null;
  if (type === 'outro' && !description) badRequest('Descreva o problema.', { description: 'Descreva o que aconteceu.' });
  await mutate(
    p.id!,
    (d, ev) => {
      if (isFinal(d.status)) conflict('Esta entrega já foi encerrada.');
      d.problems = {
        ...(d.problems ?? {}),
        [newId()]: { problem_type: type, description, reported_by: me.id, reported_at: now(), admin_notes: null, resolved_at: null, resolved_by: null, resolution_notes: null },
      };
      ev('problema', { details: { tipo: type }, reason: description });
      d.exec_status = 'problema';
    },
    { reason: description },
  );
  return detail(p.id!);
});

function findProblem(problemId: string): Doc {
  const d = allDeliveries().find((x) => x.problems?.[problemId]);
  if (!d) notFound('Problema não encontrado.');
  return d;
}

route('PATCH', '/api/problems/:id', async (p, _q, body) => {
  requireAdmin();
  const d = findProblem(p.id!);
  const notes = textOf(body.admin_notes, 2000) || null;
  await mutate(d.id, (x) => (x.problems[p.id!] = { ...x.problems[p.id!], admin_notes: notes }));
  return { ok: true };
});

route('POST', '/api/problems/:id/resolve', async (p, _q, body) => {
  const me = requireAdmin();
  const notes = textOf(body.resolution_notes, 1000);
  if (notes.length < 3) badRequest('Descreva como o problema foi resolvido.', { resolution_notes: 'Descreva a solução.' });
  const d = findProblem(p.id!);
  await mutate(
    d.id,
    (x, ev) => {
      const prob = x.problems[p.id!];
      if (prob.resolved_at) conflict('Este problema já foi resolvido.');
      x.problems[p.id!] = { ...prob, resolved_at: now(), resolved_by: me.id, resolution_notes: notes };
      ev('problema_resolvido', { reason: notes });
      if (body.schedule && typeof body.schedule === 'object') applySchedule(x, parseSchedule(body.schedule, x), ev, notes);
      const open = Object.values(x.problems).filter((v: any) => v && !v.resolved_at).length;
      if (!open && x.exec_status === 'problema') x.exec_status = 'pendente';
    },
    { reason: notes },
  );
  return { ok: true };
});

route('POST', '/api/deliveries/:id/cancel', async (p, _q, body) => {
  requireAdmin();
  const reason = textOf(body.reason, 500);
  if (reason.length < 3) badRequest('Informe o motivo do cancelamento.', { reason: 'Informe o motivo.' });
  await mutate(
    p.id!,
    (d) => {
      if (d.status === 'entregue') conflict('Entregas concluídas não podem ser canceladas. Reabra primeiro.');
      d.exec_status = 'cancelada';
    },
    { reason },
  );
  return detail(p.id!);
});

route('POST', '/api/deliveries/:id/reopen', async (p, _q, body) => {
  requireAdmin();
  const reason = textOf(body.reason, 500);
  if (reason.length < 3) badRequest('Informe o motivo da reabertura.', { reason: 'Informe o motivo.' });
  await mutate(
    p.id!,
    (d) => {
      if (!isFinal(d.status)) conflict('Esta entrega já está ativa.');
      const open = Object.values(d.problems ?? {}).filter((v: any) => v && !v.resolved_at).length;
      d.exec_status = open ? 'problema' : 'pendente';
      d.completed_at = null;
    },
    { reason },
  );
  return detail(p.id!);
});

route('PUT', '/api/routes', async (_p, _q, body) => {
  requireAdmin();
  if (!isISODate(body.date)) badRequest('Data inválida.');
  const driverId = body.driver_id == null ? null : Number(body.driver_id);
  const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
  if (!ids.length) badRequest('Lista de entregas inválida.');
  for (const id of ids) {
    const d = rawDelivery(id);
    if (d.delivery_date !== body.date || (d.driver_id ?? null) !== driverId) conflict('A rota mudou enquanto você organizava. Recarregue e tente de novo.');
  }
  await Promise.all(
    ids.map((id, idx) =>
      write(async () => {
        await B.db.doc(`deliveries/${id}`).update({ route_position: idx + 1 });
        B.active.get(id) && (B.active.get(id)!.route_position = idx + 1);
      }),
    ),
  );
  changed();
  return { ok: true };
});

// ---------------------------------------------------------------------------
// Painel, avisos e relatórios

route('GET', '/api/summary', () => {
  requireAdmin();
  const today = todayISO(TZ);
  const all = allDeliveries();
  const count = (f: (d: Doc) => boolean) => all.filter(f).length;
  return {
    today,
    hoje: count((d) => d.delivery_date === today && d.status !== 'cancelada'),
    hoje_pendentes: count((d) => d.delivery_date === today && !isFinal(d.status)),
    aguardando_separacao: count((d) => d.status === 'aguardando_separacao'),
    pronta: count((d) => d.status === 'pronta'),
    em_rota: count((d) => d.status === 'em_rota'),
    entregues_hoje: count((d) => d.status === 'entregue' && d.completed_at && todayISO(TZ, new Date(d.completed_at)) === today),
    problema: count((d) => d.status === 'problema'),
    aguardando_agendamento: count((d) => d.status === 'aguardando_agendamento'),
    atrasadas: count((d) => d.delivery_date && d.delivery_date < today && !isFinal(d.status)),
  };
});

route('GET', '/api/notifications', async () => {
  const me = requireAdmin();
  const tomorrow = addDays(todayISO(TZ), 1);
  const active = [...B.active.values()];
  const alerts: Doc[] = [];
  const push = (kind: string, tone: string, text: string, list: Doc[]) => list.forEach((d) => alerts.push({ kind, tone, text, delivery_id: d.id, customer_name: d.customer_name }));
  push('problema', 'danger', 'Problema informado na entrega', active.filter((d) => d.status === 'problema'));
  push('urgente_separacao', 'danger', 'Entrega urgente aguardando separação', active.filter((d) => d.urgency === 'alta' && d.status === 'aguardando_separacao'));
  push('material_incompleto', 'warning', 'Material incompleto para entrega próxima', active.filter((d) => d.status === 'aguardando_separacao' && d.delivery_date <= tomorrow && d.urgency !== 'alta'));
  push('sem_entregador', 'warning', 'Agendada sem entregador', active.filter((d) => d.delivery_date && d.driver_id == null));
  const since = new Date(Date.now() - 3 * 86400_000).toISOString();
  const events = allDeliveries()
    .flatMap((d) =>
      Object.entries(d.events ?? {})
        .filter(([, e]: any) => e && e.changed_at >= since && e.changed_by !== me.id && (['problema', 'reagendamento', 'problema_resolvido'].includes(e.type) || (e.type === 'status' && e.new_status === 'entregue')))
        .map(([k, e]: any) => ({ ...e, id: k, delivery_id: d.id, customer_name: d.customer_name })),
    )
    .sort((a, b) => String(b.changed_at).localeCompare(String(a.changed_at)))
    .slice(0, 40);
  const nm = await names(events.map((e) => e.changed_by));
  const out = events.map((e) => ({ ...e, changed_by_name: e.changed_by ? nm[e.changed_by] ?? 'Alguém' : null, unread: e.changed_at > B.lastSeen }));
  return { alerts, events: out, unread: out.filter((e) => e.unread).length };
});

route('POST', '/api/notifications/seen', async () => {
  requireAdmin();
  if (!B.uid) return { ok: true };
  const ts = now();
  await write(() => B.db.doc(`data/users/${B.uid}/state`).set({ last_seen: ts }));
  B.lastSeen = ts;
  return { ok: true };
});

route('GET', '/api/reports', async (_p, q) => {
  requireAdmin();
  const today = todayISO(TZ);
  const from = isISODate(q.get('from')) ? q.get('from')! : addDays(today, -6);
  const to = isISODate(q.get('to')) ? q.get('to')! : today;
  if (from > to) badRequest('O início do período deve ser antes do fim.');
  await loadOlderFinals(1000);
  const rows = allDeliveries().filter((d) => d.delivery_date && d.delivery_date >= from && d.delivery_date <= to);
  const canceled = rows.filter((r) => r.status === 'cancelada').length;
  const delivered = rows.filter((r) => r.status === 'entregue');
  const pending = rows.filter((r) => !isFinal(r.status)).length;
  const problemCount = (d: Doc) => Object.values(d.problems ?? {}).filter(Boolean).length;
  const withProblems = rows.filter((r) => problemCount(r) > 0).length;
  const base = rows.length - canceled;
  const perDriver = new Map<string, { driver: string; total: number; delivered: number; problems: number }>();
  for (const r of rows) {
    if (r.status === 'cancelada') continue;
    const key = driverName(r.driver_id) ?? 'Sem entregador';
    const e = perDriver.get(key) ?? { driver: key, total: 0, delivered: 0, problems: 0 };
    e.total++;
    if (r.status === 'entregue') e.delivered++;
    if (problemCount(r) > 0) e.problems++;
    perDriver.set(key, e);
  }
  // Tempo entre "Em rota" e "Entregue": só quando os dois registros existem.
  const durations = delivered
    .map((r) => {
      const started = Object.values(r.events ?? {})
        .filter((e: any) => e && e.type === 'status' && e.new_status === 'em_rota')
        .map((e: any) => e.changed_at)
        .sort()[0];
      return started && r.completed_at ? (Date.parse(r.completed_at) - Date.parse(started)) / 60000 : -1;
    })
    .filter((m) => m >= 0 && m < 24 * 60);
  const types = new Map<string, number>();
  for (const r of rows) for (const pr of Object.values(r.problems ?? {})) if (pr) types.set((pr as Doc).problem_type, (types.get((pr as Doc).problem_type) ?? 0) + 1);
  return {
    from,
    to,
    total: base,
    canceled,
    delivered: delivered.length,
    pending,
    with_problems: withProblems,
    completion_rate: base > 0 ? delivered.length / base : null,
    per_driver: [...perDriver.values()].sort((a, b) => b.total - a.total),
    avg_route_minutes: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
    avg_route_samples: durations.length,
    problem_types: [...types.entries()].map(([problem_type, n]) => ({ problem_type, n })).sort((a, b) => b.n - a.n),
  };
});

// ---------------------------------------------------------------------------
// Entregadores, veículos e configurações (gravação só para Editores — regra do banco)

async function saveTeam(patch: Doc) {
  await write(async () => {
    const ref = B.db.doc(TEAM);
    const snap = await ref.get();
    if (snap.exists) await ref.update(patch);
    else await ref.set({ drivers: {}, vehicles: {}, ...patch });
  });
  B.team = { ...B.team, drivers: { ...B.team.drivers, ...(patch.drivers ?? {}) }, vehicles: { ...B.team.vehicles, ...(patch.vehicles ?? {}) } };
  changed();
}

route('GET', '/api/drivers', async (_p, q) => {
  requireAdmin();
  const date = isISODate(q.get('date')) ? q.get('date')! : todayISO(TZ);
  const all = allDeliveries();
  const drivers = Object.entries(B.team.drivers ?? {}).filter(([, v]) => v) as [string, Doc][];
  const nm = await names(drivers.map(([, v]) => v.user_id));
  const vehicles = B.team.vehicles ?? {};
  return {
    drivers: drivers
      .map(([k, v]) => {
        const id = Number(k);
        const day = all.filter((d) => Number(d.driver_id) === id && d.delivery_date === date && d.status !== 'cancelada');
        const veh = v.vehicle_id != null ? vehicles[String(v.vehicle_id)] : null;
        return {
          id,
          name: v.name,
          phone: v.phone ?? null,
          active: v.active !== false,
          vehicle_id: v.vehicle_id ?? null,
          vehicle_name: veh?.name ?? null,
          vehicle_plate: veh?.plate ?? null,
          user_id: v.user_id ?? null,
          username: v.user_id ? nm[v.user_id] ?? 'Pessoa vinculada' : null,
          day_count: day.length,
          open_count: all.filter((d) => Number(d.driver_id) === id && !isFinal(d.status)).length,
          day_periods: day.map((d) => d.delivery_period ?? 'none').join(','),
          date,
        };
      })
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'pt-BR')),
  };
});

function driverFields(body: Doc) {
  const name = textOf(body.name, 120);
  if (!name) badRequest('Informe o nome.', { name: 'Informe o nome do entregador.' });
  let phone: string | null = textOf(body.phone, 30) || null;
  if (phone) {
    phone = normalizeWhatsApp(phone);
    if (!phone) badRequest('Telefone inválido.', { phone: 'Use DDD + número.' });
  }
  const vehicleId = body.vehicle_id ? Number(body.vehicle_id) : null;
  if (vehicleId && !(B.team.vehicles ?? {})[String(vehicleId)]) badRequest('Veículo não encontrado.');
  const userId = typeof body.user_id === 'string' && body.user_id ? body.user_id : null;
  if (userId) {
    const other = Object.entries(B.team.drivers ?? {}).find(([, v]: any) => v && v.user_id === userId);
    if (other && Number(other[0]) !== Number(body.id ?? -1)) badRequest('Esta pessoa já está vinculada a outro entregador.', { user_id: 'Pessoa já vinculada.' });
  }
  return { name, phone, vehicle_id: vehicleId, user_id: userId, active: body.active !== false };
}

route('POST', '/api/drivers', async (_p, _q, body) => {
  requireAdmin();
  const f = driverFields(body);
  const id = Math.max(0, ...Object.keys(B.team.drivers ?? {}).map(Number)) + 1;
  await saveTeam({ drivers: { [id]: { ...f, created_at: now() } } });
  return { id };
});

route('PUT', '/api/drivers/:id', async (p, _q, body) => {
  requireAdmin();
  const cur = (B.team.drivers ?? {})[p.id!];
  if (!cur) notFound('Entregador não encontrado.');
  const f = driverFields({ ...body, id: p.id });
  await saveTeam({ drivers: { [p.id!]: { ...cur, ...f } } });
  return { ok: true };
});

route('GET', '/api/vehicles', () => {
  requireAdmin();
  return {
    vehicles: Object.entries(B.team.vehicles ?? {})
      .filter(([, v]) => v)
      .map(([k, v]: any) => ({ ...v, id: Number(k), active: v.active !== false }))
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'pt-BR')),
  };
});

function vehicleFields(body: Doc) {
  const name = textOf(body.name, 120);
  if (!name) badRequest('Informe o nome do veículo.', { name: 'Informe um nome, ex.: Caminhão baú.' });
  const cap = body.capacity_kg === '' || body.capacity_kg == null ? null : Number(body.capacity_kg);
  if (cap != null && (!Number.isFinite(cap) || cap < 0)) badRequest('Capacidade inválida.', { capacity_kg: 'Capacidade inválida.' });
  return { name, plate: textOf(body.plate, 10).toUpperCase() || null, type: textOf(body.type, 60) || null, capacity_kg: cap, active: body.active !== false };
}

route('POST', '/api/vehicles', async (_p, _q, body) => {
  requireAdmin();
  const f = vehicleFields(body);
  const id = Math.max(0, ...Object.keys(B.team.vehicles ?? {}).map(Number)) + 1;
  await saveTeam({ vehicles: { [id]: { ...f, created_at: now() } } });
  return { id };
});

route('PUT', '/api/vehicles/:id', async (p, _q, body) => {
  requireAdmin();
  const cur = (B.team.vehicles ?? {})[p.id!];
  if (!cur) notFound('Veículo não encontrado.');
  await saveTeam({ vehicles: { [p.id!]: { ...cur, ...vehicleFields(body) } } });
  return { ok: true };
});

route('GET', '/api/people', async (_p, q) => {
  requireAdmin();
  if (!B.user) return { people: [] };
  const hits = await B.user.search(q.get('q') ?? '');
  return { people: hits.filter((h: any) => h.name).map((h: any) => ({ id: h.id, name: h.name })) };
});

route('GET', '/api/users', () => ({ users: [] }));

route('GET', '/api/settings', () => {
  requireAdmin();
  return { default_city: B.settings.default_city ?? '', default_state: B.settings.default_state ?? '', company_phone: B.settings.company_phone ?? '' };
});

route('PUT', '/api/settings', async (_p, _q, body) => {
  requireAdmin();
  const state = textOf(body.default_state, 2).toUpperCase();
  if (state && !/^[A-Z]{2}$/.test(state)) badRequest('Estado inválido.', { default_state: 'Use a sigla, ex.: AM.' });
  const values = { default_city: textOf(body.default_city, 120), default_state: state, company_phone: textOf(body.company_phone, 30) };
  await write(() => B.db.doc(SETTINGS).set(values));
  B.settings = values;
  changed();
  return values;
});

// ---------------------------------------------------------------------------
// Importação da agenda antiga (mesmas regras do servidor; reimportar não duplica)

async function hashOf(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

route('POST', '/api/import/legacy', async (_p, _q, body) => {
  const me = requireAdmin();
  const records = extractRecords(body.data);
  const result = { imported: 0, skipped_duplicates: 0, failed: [] as { index: number; reason: string }[], warnings: [] as string[] };
  if (!records.length) {
    result.failed.push({ index: -1, reason: 'Nenhum registro encontrado no arquivo.' });
    return result;
  }
  const newDrivers: Doc = {};
  let nextDriver = Math.max(0, ...Object.keys(B.team.drivers ?? {}).map(Number)) + 1;
  const findDriver = (name: string): number => {
    const all = { ...(B.team.drivers ?? {}), ...newDrivers };
    const hit = Object.entries(all).find(([, v]: any) => v && norm(v.name) === norm(name));
    if (hit) return Number(hit[0]);
    newDrivers[nextDriver] = { name, phone: null, vehicle_id: null, user_id: null, active: true, created_at: now() };
    return nextDriver++;
  };
  const docs: [string, Doc][] = [];
  for (const [index, rec] of records.entries()) {
    const id = 'L' + (await hashOf(JSON.stringify(rec)));
    if (allDeliveries().some((d) => d.id === id)) {
      result.skipped_duplicates++;
      continue;
    }
    const d = legacyToDelivery(rec, { id, driverId: findDriver, uid: me.id, newId, warnings: result.warnings });
    if (!d) {
      result.failed.push({ index, reason: 'Registro sem nome de cliente.' });
      continue;
    }
    docs.push([id, d]);
  }
  if (Object.keys(newDrivers).length) await saveTeam({ drivers: newDrivers });
  for (const [id, d] of docs) {
    await write(() => B.db.doc(`deliveries/${id}`).set(d));
    (d.final ? B.finals : B.active).set(id, { ...d, id });
    result.imported++;
  }
  changed();
  return result;
});

// ---------------------------------------------------------------------------
// Interface usada pelas telas (mesma de src/api.ts)

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  await connect();
  const url = new URL(path, 'https://local');
  const method = opts.method ?? 'GET';
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.re.exec(url.pathname);
    if (!m) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]!)));
    try {
      return (await r.fn(params, url.searchParams, (opts.body ?? {}) as Doc, opts.headers ?? {})) as T;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, 'Erro inesperado. Tente novamente em instantes.');
    }
  }
  throw new ApiError(404, 'Recurso não encontrado.');
}

export const post = <T = any>(path: string, body: unknown = {}, headers?: Record<string, string>) => api<T>(path, { method: 'POST', body, headers });
export const put = <T = any>(path: string, body: unknown) => api<T>(path, { method: 'PUT', body });

/** Foto guardada no armazenamento de arquivos da página. */
export const photoUrl = (photoId: number | string) => `/_blob/${photoId}`;

export async function exportBackup() {
  requireAdmin();
  await connect();
  if (!B.downloads) throw new ApiError(0, 'O download não está disponível neste navegador.');
  await loadOlderFinals(1000);
  const data = JSON.stringify(
    {
      exported_at: now(),
      deliveries: allDeliveries(),
      team: B.team,
      settings: B.settings,
    },
    null,
    2,
  );
  await B.downloads.save({ filename: `mercatto-entregas-${todayISO(TZ)}.json`, data });
}

export { compressImage } from '../image.ts';

/** Envia a foto para o armazenamento da página. */
export async function uploadPhoto(deliveryId: number | string, blob: Blob, onProgress: (pct: number) => void): Promise<{ photo_id: string }> {
  await connect();
  const me = requireMe();
  if (!canSee(rawDelivery(String(deliveryId)), me)) notFound('Entrega não encontrada.');
  if (!B.assets) throw new ApiError(403, 'O envio de fotos não está liberado para o seu acesso. Confirme sem foto ou peça ao escritório.');
  onProgress(10);
  try {
    const res = await B.assets.upload(blob, { type: 'image/jpeg' });
    onProgress(100);
    return { photo_id: res.id };
  } catch (e: any) {
    const msg =
      e?.code === 'too_large'
        ? 'A foto é grande demais.'
        : e?.code === 'quota_or_state'
          ? 'O espaço para fotos desta página acabou. Avise o escritório.'
          : e?.code === 'rate_limited'
            ? 'Muitos envios seguidos. Aguarde alguns segundos e tente de novo.'
            : 'O envio da foto falhou.';
    throw new ApiError(0, msg);
  }
}

