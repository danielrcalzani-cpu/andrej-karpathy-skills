import type { DB, Row } from './db.ts';
import { now, transaction } from './db.ts';
import { HttpError, badRequest, notFound } from './http.ts';
import type { SessionUser } from './http.ts';
import { hashPassword, validatePassword } from './auth.ts';
import { addDays, isISODate, normalizeWhatsApp, todayISO } from '../shared/domain.ts';

// ---------------------------------------------------------------------------
// Painel

export function summary(db: DB, timezone: string) {
  const today = todayISO(timezone);
  const count = (sql: string, ...p: (string | number)[]) => (db.prepare(`SELECT COUNT(*) AS n FROM deliveries d WHERE ${sql}`).get(...p) as Row).n as number;
  return {
    today,
    hoje: count("d.delivery_date = ? AND d.status != 'cancelada'", today),
    hoje_pendentes: count("d.delivery_date = ? AND d.status NOT IN ('entregue','cancelada')", today),
    aguardando_separacao: count("d.status = 'aguardando_separacao'"),
    pronta: count("d.status = 'pronta'"),
    em_rota: count("d.status = 'em_rota'"),
    entregues_hoje: completedOn(db, today, timezone),
    problema: count("d.status = 'problema'"),
    aguardando_agendamento: count("d.status = 'aguardando_agendamento'"),
    atrasadas: count("d.delivery_date < ? AND d.status NOT IN ('entregue','cancelada')", today),
  };
}

function completedOn(db: DB, day: string, timezone: string): number {
  // Busca uma janela larga em UTC e confere a data local de cada conclusão.
  const since = new Date(Date.now() - 2 * 86400_000).toISOString();
  const rows = db.prepare("SELECT completed_at FROM deliveries WHERE status = 'entregue' AND completed_at >= ?").all(since) as Row[];
  return rows.filter((r) => todayISO(timezone, new Date(r.completed_at)) === day).length;
}

// ---------------------------------------------------------------------------
// Notificações (sem tempo real: o app atualiza periodicamente)

export function notifications(db: DB, user: SessionUser, timezone: string) {
  const today = todayISO(timezone);
  const tomorrow = addDays(today, 1);
  const alerts: { kind: string; tone: string; text: string; delivery_id: number; customer_name: string }[] = [];
  const push = (kind: string, tone: string, text: string, rows: Row[]) =>
    rows.forEach((r) => alerts.push({ kind, tone, text, delivery_id: r.id, customer_name: r.customer_name }));

  push('problema', 'danger', 'Problema informado na entrega', db.prepare("SELECT id, customer_name FROM deliveries WHERE status = 'problema' ORDER BY updated_at DESC").all() as Row[]);
  push(
    'urgente_separacao',
    'danger',
    'Entrega urgente aguardando separação',
    db.prepare("SELECT id, customer_name FROM deliveries WHERE urgency = 'alta' AND status = 'aguardando_separacao'").all() as Row[],
  );
  push(
    'material_incompleto',
    'warning',
    'Material incompleto para entrega próxima',
    db
      .prepare("SELECT id, customer_name FROM deliveries WHERE status = 'aguardando_separacao' AND delivery_date <= ? AND COALESCE(urgency,'') != 'alta'")
      .all(tomorrow) as Row[],
  );
  push(
    'sem_entregador',
    'warning',
    'Agendada sem entregador',
    db.prepare("SELECT id, customer_name FROM deliveries WHERE delivery_date IS NOT NULL AND driver_id IS NULL AND status NOT IN ('entregue','cancelada')").all() as Row[],
  );

  const me = db.prepare('SELECT last_seen_event_id FROM users WHERE id = ?').get(user.id) as Row;
  const since = new Date(Date.now() - 3 * 86400_000).toISOString();
  const events = (db
    .prepare(
      `SELECT e.id, e.type, e.new_status, e.changed_at, e.delivery_id, d.customer_name, u.name AS changed_by_name
       FROM delivery_events e JOIN deliveries d ON d.id = e.delivery_id LEFT JOIN users u ON u.id = e.changed_by
       WHERE e.changed_at >= ? AND (e.changed_by IS NULL OR e.changed_by != ?)
         AND (e.type IN ('problema','reagendamento','problema_resolvido') OR (e.type = 'status' AND e.new_status = 'entregue'))
       ORDER BY e.id DESC LIMIT 40`,
    )
    .all(since, user.id) as Row[]).map((e) => ({ ...e, unread: e.id > me.last_seen_event_id }));
  return { alerts, events, unread: events.filter((e) => e.unread).length };
}

export function markNotificationsSeen(db: DB, user: SessionUser) {
  const max = (db.prepare('SELECT COALESCE(MAX(id), 0) AS m FROM delivery_events').get() as Row).m;
  db.prepare('UPDATE users SET last_seen_event_id = ? WHERE id = ?').run(max, user.id);
}

// ---------------------------------------------------------------------------
// Relatórios — apenas métricas calculáveis a partir dos registros gravados

export function report(db: DB, q: URLSearchParams, timezone: string) {
  const today = todayISO(timezone);
  const from = isISODate(q.get('from')) ? q.get('from')! : addDays(today, -6);
  const to = isISODate(q.get('to')) ? q.get('to')! : today;
  if (from > to) throw badRequest('O início do período deve ser antes do fim.');

  const rows = db
    .prepare(
      `SELECT d.id, d.status, d.driver_id, dr.name AS driver_name, d.completed_at,
         (SELECT MIN(e.changed_at) FROM delivery_events e WHERE e.delivery_id = d.id AND e.type = 'status' AND e.new_status = 'em_rota') AS started_at,
         (SELECT COUNT(*) FROM delivery_problems p WHERE p.delivery_id = d.id) AS problems
       FROM deliveries d LEFT JOIN drivers dr ON dr.id = d.driver_id
       WHERE d.delivery_date BETWEEN ? AND ?`,
    )
    .all(from, to) as Row[];

  const canceled = rows.filter((r) => r.status === 'cancelada').length;
  const delivered = rows.filter((r) => r.status === 'entregue');
  const pending = rows.filter((r) => r.status !== 'entregue' && r.status !== 'cancelada').length;
  const withProblems = rows.filter((r) => r.problems > 0).length;
  const base = rows.length - canceled;

  const perDriver = new Map<string, { driver: string; total: number; delivered: number; problems: number }>();
  for (const r of rows) {
    if (r.status === 'cancelada') continue;
    const key = r.driver_name ?? 'Sem entregador';
    const e = perDriver.get(key) ?? { driver: key, total: 0, delivered: 0, problems: 0 };
    e.total++;
    if (r.status === 'entregue') e.delivered++;
    if (r.problems > 0) e.problems++;
    perDriver.set(key, e);
  }

  // Tempo entre "Em rota" e "Entregue": só quando os dois registros existem.
  const durations = delivered
    .filter((r) => r.started_at && r.completed_at)
    .map((r) => (Date.parse(r.completed_at) - Date.parse(r.started_at)) / 60000)
    .filter((m) => m >= 0 && m < 24 * 60);
  const avgRouteMinutes = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

  const problemTypes = db
    .prepare(
      `SELECT p.problem_type, COUNT(*) AS n FROM delivery_problems p JOIN deliveries d ON d.id = p.delivery_id
       WHERE d.delivery_date BETWEEN ? AND ? GROUP BY p.problem_type ORDER BY n DESC`,
    )
    .all(from, to) as Row[];

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
    avg_route_minutes: avgRouteMinutes,
    avg_route_samples: durations.length,
    problem_types: problemTypes,
  };
}

// ---------------------------------------------------------------------------
// Entregadores e veículos

function text(v: unknown, max = 120): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

export function listDrivers(db: DB, q: URLSearchParams, timezone: string) {
  const date = isISODate(q.get('date')) ? q.get('date')! : todayISO(timezone);
  return db
    .prepare(
      `SELECT dr.*, v.name AS vehicle_name, v.plate AS vehicle_plate,
         (SELECT COUNT(*) FROM deliveries d WHERE d.driver_id = dr.id AND d.delivery_date = ? AND d.status != 'cancelada') AS day_count,
         (SELECT COUNT(*) FROM deliveries d WHERE d.driver_id = dr.id AND d.status NOT IN ('entregue','cancelada')) AS open_count,
         (SELECT GROUP_CONCAT(COALESCE(d.delivery_period,'none')) FROM deliveries d WHERE d.driver_id = dr.id AND d.delivery_date = ? AND d.status != 'cancelada') AS day_periods,
         (SELECT u.username FROM users u WHERE u.driver_id = dr.id AND u.active = 1 LIMIT 1) AS username
       FROM drivers dr LEFT JOIN vehicles v ON v.id = dr.vehicle_id
       ORDER BY dr.active DESC, dr.name COLLATE NOCASE`,
    )
    .all(date, date)
    .map((r) => ({ ...(r as Row), active: !!(r as Row).active, date }));
}

function driverFields(db: DB, body: Record<string, unknown>) {
  const name = text(body.name);
  if (!name) throw badRequest('Informe o nome.', { name: 'Informe o nome do entregador.' });
  let phone = text(body.phone, 30);
  if (phone) {
    phone = normalizeWhatsApp(phone);
    if (!phone) throw badRequest('Telefone inválido.', { phone: 'Use DDD + número.' });
  }
  const vehicleId = body.vehicle_id ? Number(body.vehicle_id) : null;
  if (vehicleId && !db.prepare('SELECT id FROM vehicles WHERE id = ?').get(vehicleId)) throw badRequest('Veículo não encontrado.');
  return { name, phone, vehicleId, active: body.active === false ? 0 : 1 };
}

export function createDriver(db: DB, body: Record<string, unknown>) {
  const f = driverFields(db, body);
  const r = db.prepare('INSERT INTO drivers (name, phone, active, vehicle_id, created_at) VALUES (?, ?, ?, ?, ?)').run(f.name, f.phone, f.active, f.vehicleId, now());
  return Number(r.lastInsertRowid);
}

export function updateDriver(db: DB, id: number, body: Record<string, unknown>) {
  const f = driverFields(db, body);
  const r = db.prepare('UPDATE drivers SET name = ?, phone = ?, active = ?, vehicle_id = ? WHERE id = ?').run(f.name, f.phone, f.active, f.vehicleId, id);
  if (!r.changes) throw notFound('Entregador não encontrado.');
  if (!f.active) db.prepare('UPDATE users SET active = 0 WHERE driver_id = ?').run(id);
}

export function listVehicles(db: DB) {
  return (db.prepare('SELECT * FROM vehicles ORDER BY active DESC, name COLLATE NOCASE').all() as Row[]).map((v) => ({ ...v, active: !!v.active }));
}

function vehicleFields(body: Record<string, unknown>) {
  const name = text(body.name);
  if (!name) throw badRequest('Informe o nome do veículo.', { name: 'Informe um nome, ex.: Caminhão baú.' });
  const cap = body.capacity_kg === '' || body.capacity_kg == null ? null : Number(body.capacity_kg);
  if (cap != null && (!Number.isFinite(cap) || cap < 0)) throw badRequest('Capacidade inválida.', { capacity_kg: 'Capacidade inválida.' });
  return { name, plate: text(body.plate, 10)?.toUpperCase() ?? null, type: text(body.type, 60), cap, active: body.active === false ? 0 : 1 };
}

export function createVehicle(db: DB, body: Record<string, unknown>) {
  const f = vehicleFields(body);
  const r = db.prepare('INSERT INTO vehicles (name, plate, type, capacity_kg, active, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(f.name, f.plate, f.type, f.cap, f.active, now());
  return Number(r.lastInsertRowid);
}

export function updateVehicle(db: DB, id: number, body: Record<string, unknown>) {
  const f = vehicleFields(body);
  const r = db.prepare('UPDATE vehicles SET name = ?, plate = ?, type = ?, capacity_kg = ?, active = ? WHERE id = ?').run(f.name, f.plate, f.type, f.cap, f.active, id);
  if (!r.changes) throw notFound('Veículo não encontrado.');
}

// ---------------------------------------------------------------------------
// Usuários

export function listUsers(db: DB) {
  return (db
    .prepare(
      `SELECT u.id, u.name, u.username, u.role, u.driver_id, u.active, u.created_at, dr.name AS driver_name
       FROM users u LEFT JOIN drivers dr ON dr.id = u.driver_id ORDER BY u.active DESC, u.role, u.name COLLATE NOCASE`,
    )
    .all() as Row[]).map((u) => ({ ...u, active: !!u.active }));
}

export function createUser(db: DB, body: Record<string, unknown>) {
  const name = text(body.name);
  const username = text(body.username, 40)?.toLowerCase();
  const role = body.role === 'driver' ? 'driver' : body.role === 'admin' ? 'admin' : null;
  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Informe o nome.';
  if (!username || !/^[a-z0-9._-]{3,40}$/.test(username)) errors.username = 'Use de 3 a 40 letras minúsculas, números, ponto ou hífen.';
  if (!role) errors.role = 'Escolha o perfil.';
  const pwErr = validatePassword(body.password);
  if (pwErr) errors.password = pwErr;
  const driverId = role === 'driver' ? Number(body.driver_id) || null : null;
  if (role === 'driver' && (!driverId || !db.prepare('SELECT id FROM drivers WHERE id = ? AND active = 1').get(driverId)))
    errors.driver_id = 'Vincule a um entregador ativo.';
  if (Object.keys(errors).length) throw badRequest('Revise os campos destacados.', errors);
  if (db.prepare('SELECT id FROM users WHERE username = ?').get(username!)) throw badRequest('Usuário já existe.', { username: 'Este usuário já existe.' });
  const r = db
    .prepare('INSERT INTO users (name, username, password_hash, role, driver_id, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name!, username!, hashPassword(String(body.password)), role!, driverId, now());
  return Number(r.lastInsertRowid);
}

export function updateUser(db: DB, id: number, body: Record<string, unknown>, me: SessionUser) {
  transaction(db, () => {
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Row | undefined;
    if (!u) throw notFound('Usuário não encontrado.');
    const name = text(body.name) ?? u.name;
    const active = body.active === false ? 0 : 1;
    if (!active && u.role === 'admin') {
      if (id === me.id) throw new HttpError(409, 'Você não pode desativar o próprio acesso.');
      const admins = (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1").get() as Row).n;
      if (admins <= 1) throw new HttpError(409, 'É preciso manter pelo menos um administrador ativo.');
    }
    db.prepare('UPDATE users SET name = ?, active = ? WHERE id = ?').run(name, active, id);
    if (body.password) {
      const err = validatePassword(body.password);
      if (err) throw badRequest(err, { password: err });
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(String(body.password)), id);
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND ? != ?').run(id, id, me.id);
    }
    if (!active) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  });
}

// ---------------------------------------------------------------------------
// Configurações

const SETTING_KEYS = ['default_city', 'default_state', 'company_phone'] as const;

export function getSettings(db: DB): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as Row[];
  const out: Record<string, string> = { default_city: '', default_state: '', company_phone: '' };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export function saveSettings(db: DB, body: Record<string, unknown>) {
  const state = text(body.default_state, 2)?.toUpperCase() ?? '';
  if (state && !/^[A-Z]{2}$/.test(state)) throw badRequest('Estado inválido.', { default_state: 'Use a sigla, ex.: AM.' });
  const values: Record<string, string> = {
    default_city: text(body.default_city) ?? '',
    default_state: state,
    company_phone: text(body.company_phone, 30) ?? '',
  };
  transaction(db, () => {
    for (const k of SETTING_KEYS) db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(k, values[k]!);
  });
}
