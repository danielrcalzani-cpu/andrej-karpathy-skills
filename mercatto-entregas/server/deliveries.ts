import type { DB, Row } from './db.ts';
import { now, transaction } from './db.ts';
import { HttpError, badRequest, forbidden, notFound } from './http.ts';
import type { SessionUser } from './http.ts';
import {
  computePrepared,
  deriveStatus,
  formatDateBR,
  isFinal,
  isISODate,
  PERIODS,
  PROBLEM_TYPES,
  todayISO,
  validateDelivery,
} from '../shared/domain.ts';
import type { Delivery, DeliveryInput, DeliveryItem, ExecStatus, ItemStage, Status } from '../shared/domain.ts';

const DELIVERY_SELECT = `
  SELECT d.*, dr.name AS driver_name, pu.name AS prepared_by_name,
    (SELECT COUNT(*) FROM delivery_problems p WHERE p.delivery_id = d.id AND p.resolved_at IS NULL) AS open_problems
  FROM deliveries d
  LEFT JOIN drivers dr ON dr.id = d.driver_id
  LEFT JOIN users pu ON pu.id = d.prepared_by`;

const ITEM_SELECT = `
  SELECT i.*, u1.name AS prepared_by_name, u2.name AS checked_by_name, u3.name AS loaded_by_name
  FROM delivery_items i
  LEFT JOIN users u1 ON u1.id = i.prepared_by
  LEFT JOIN users u2 ON u2.id = i.checked_by
  LEFT JOIN users u3 ON u3.id = i.loaded_by`;

function toItem(r: Row): DeliveryItem {
  return {
    id: r.id,
    description: r.description,
    quantity: r.quantity,
    unit: r.unit,
    package_count: r.package_count,
    weight_kg: r.weight_kg,
    prepared: !!r.prepared,
    checked: !!r.checked,
    loaded: !!r.loaded,
    prepared_by_name: r.prepared_by_name,
    prepared_at: r.prepared_at,
    checked_by_name: r.checked_by_name,
    checked_at: r.checked_at,
    loaded_by_name: r.loaded_by_name,
    loaded_at: r.loaded_at,
  };
}

/** Converte linhas do banco em entregas. Para entregadores, remove dados internos. */
export function hydrate(db: DB, rows: Row[], user: SessionUser): Delivery[] {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id as number);
  const itemRows = db
    .prepare(`${ITEM_SELECT} WHERE i.delivery_id IN (${ids.map(() => '?').join(',')}) ORDER BY i.position, i.id`)
    .all(...ids) as Row[];
  const byDelivery = new Map<number, DeliveryItem[]>();
  for (const r of itemRows) {
    const list = byDelivery.get(r.delivery_id) ?? [];
    list.push(toItem(r));
    byDelivery.set(r.delivery_id, list);
  }
  return rows.map((r) => {
    const d: Delivery = {
      id: r.id,
      customer_name: r.customer_name,
      receiver_whatsapp: r.receiver_whatsapp,
      salesperson: r.salesperson,
      order_number: r.order_number,
      postal_code: r.postal_code,
      street: r.street,
      address_number: r.address_number,
      address_complement: r.address_complement,
      neighborhood: r.neighborhood,
      city: r.city,
      state: r.state,
      reference_point: r.reference_point,
      address_text: r.address_text,
      materials_notes: r.materials_notes,
      delivery_date: r.delivery_date,
      delivery_period: r.delivery_period,
      scheduled_start_time: r.scheduled_start_time,
      scheduled_end_time: r.scheduled_end_time,
      driver_id: r.driver_id,
      driver_name: r.driver_name,
      urgency: r.urgency,
      material_separated: !!r.material_separated,
      prep_exception_reason: r.prep_exception_reason,
      prepared_by_name: r.prepared_by_name,
      prepared_at: r.prepared_at,
      status: r.status,
      exec_status: r.exec_status,
      driver_notes: r.driver_notes,
      internal_notes: user.role === 'admin' ? r.internal_notes : null,
      route_position: r.route_position,
      legacy_situacao: user.role === 'admin' ? r.legacy_situacao : null,
      open_problems: r.open_problems,
      version: r.version,
      created_at: r.created_at,
      updated_at: r.updated_at,
      completed_at: r.completed_at,
      items: byDelivery.get(r.id) ?? [],
    };
    return d;
  });
}

/** Carrega uma entrega respeitando o escopo do usuário (entregador só vê as suas). */
export function loadDelivery(db: DB, id: number, user: SessionUser): Delivery {
  const row = db.prepare(`${DELIVERY_SELECT} WHERE d.id = ?`).get(id) as Row | undefined;
  if (!row) throw notFound('Entrega não encontrada.');
  if (user.role === 'driver' && row.driver_id !== user.driver_id) throw notFound('Entrega não encontrada.');
  return hydrate(db, [row], user)[0]!;
}

export function deliveryDetail(db: DB, id: number, user: SessionUser) {
  const delivery = loadDelivery(db, id, user);
  const problems = db
    .prepare(
      `SELECT p.*, u.name AS reported_by_name, r.name AS resolved_by_name FROM delivery_problems p
       JOIN users u ON u.id = p.reported_by LEFT JOIN users r ON r.id = p.resolved_by
       WHERE p.delivery_id = ? ORDER BY p.reported_at DESC`,
    )
    .all(id) as Row[];
  const proofs = db
    .prepare(
      `SELECT pr.id, pr.receiver_name, pr.photo_id, pr.notes, pr.completed_at, u.name AS completed_by_name
       FROM delivery_proofs pr JOIN users u ON u.id = pr.completed_by
       WHERE pr.delivery_id = ? ORDER BY pr.completed_at DESC`,
    )
    .all(id) as Row[];
  for (const pr of proofs) {
    pr.photo_ids = (db.prepare('SELECT photo_id FROM proof_photos WHERE proof_id = ? ORDER BY position').all(pr.id) as Row[]).map((r) => r.photo_id);
  }
  const events =
    user.role === 'admin'
      ? (db
          .prepare(
            `SELECT e.id, e.type, e.previous_status, e.new_status, e.details, e.reason, e.changed_at, u.name AS changed_by_name
             FROM delivery_events e LEFT JOIN users u ON u.id = e.changed_by
             WHERE e.delivery_id = ? ORDER BY e.id DESC LIMIT 200`,
          )
          .all(id) as Row[]).map((e) => ({ ...e, details: e.details ? JSON.parse(e.details) : null }))
      : [];
  return {
    delivery,
    problems: problems.map((p) => ({ ...p, admin_notes: user.role === 'admin' ? p.admin_notes : null })),
    proofs,
    events,
  };
}

export function addEvent(
  db: DB,
  deliveryId: number,
  type: string,
  userId: number | null,
  extra: { previous_status?: string | null; new_status?: string | null; details?: unknown; reason?: string | null } = {},
) {
  db.prepare(
    `INSERT INTO delivery_events (delivery_id, type, previous_status, new_status, details, reason, changed_by, changed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    deliveryId,
    type,
    extra.previous_status ?? null,
    extra.new_status ?? null,
    extra.details == null ? null : JSON.stringify(extra.details),
    extra.reason ?? null,
    userId,
    now(),
  );
}

function touch(db: DB, id: number) {
  db.prepare('UPDATE deliveries SET version = version + 1, updated_at = ? WHERE id = ?').run(now(), id);
}

/**
 * Recalcula a situação a partir do estado gravado (regras 1–3) e registra no histórico.
 * Determinístico: o mesmo estado sempre gera a mesma situação.
 */
export function refreshStatus(db: DB, id: number, userId: number | null, reason?: string | null): Status {
  const d = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id) as Row;
  const items = (db.prepare('SELECT prepared, checked FROM delivery_items WHERE delivery_id = ?').all(id) as Row[]).map((i) => ({
    prepared: !!i.prepared,
    checked: !!i.checked,
  }));
  const state = {
    exec_status: d.exec_status as ExecStatus,
    delivery_date: d.delivery_date as string | null,
    items,
    material_separated: !!d.material_separated,
    prep_exception_reason: d.prep_exception_reason as string | null,
  };
  const prepared = computePrepared(state);
  const status = deriveStatus(state);
  if (prepared !== !!d.is_prepared) {
    db.prepare('UPDATE deliveries SET is_prepared = ?, prepared_by = ?, prepared_at = ? WHERE id = ?').run(
      prepared ? 1 : 0,
      prepared ? userId : null,
      prepared ? now() : null,
      id,
    );
  }
  if (status !== d.status) {
    db.prepare('UPDATE deliveries SET status = ? WHERE id = ?').run(status, id);
    addEvent(db, id, 'status', userId, { previous_status: d.status, new_status: status, reason });
  }
  return status;
}

function assertDriver(db: DB, driverId: number | null, previous: number | null = null) {
  if (driverId == null) return;
  const dr = db.prepare('SELECT active FROM drivers WHERE id = ?').get(driverId) as Row | undefined;
  if (!dr) throw badRequest('Entregador não encontrado.', { driver_id: 'Entregador não encontrado.' });
  if (!dr.active && driverId !== previous)
    throw badRequest('Este entregador está inativo.', { driver_id: 'Este entregador está inativo.' });
}

function writeItems(db: DB, deliveryId: number, items: DeliveryItem[], userId: number) {
  const existing = db.prepare('SELECT * FROM delivery_items WHERE delivery_id = ?').all(deliveryId) as Row[];
  const byId = new Map(existing.map((r) => [r.id as number, r]));
  const keep = new Set<number>();
  const ts = now();
  items.forEach((it, position) => {
    const prepared = it.prepared || it.checked; // conferido implica separado
    const old = it.id ? byId.get(it.id) : undefined;
    if (old) {
      keep.add(old.id);
      db.prepare(
        `UPDATE delivery_items SET position = ?, description = ?, quantity = ?, unit = ?, package_count = ?, weight_kg = ?,
           prepared = ?, prepared_by = ?, prepared_at = ?, checked = ?, checked_by = ?, checked_at = ?
         WHERE id = ?`,
      ).run(
        position,
        it.description,
        it.quantity,
        it.unit,
        it.package_count,
        it.weight_kg,
        prepared ? 1 : 0,
        prepared ? (old.prepared ? old.prepared_by : userId) : null,
        prepared ? (old.prepared ? old.prepared_at : ts) : null,
        it.checked ? 1 : 0,
        it.checked ? (old.checked ? old.checked_by : userId) : null,
        it.checked ? (old.checked ? old.checked_at : ts) : null,
        old.id,
      );
    } else {
      db.prepare(
        `INSERT INTO delivery_items (delivery_id, position, description, quantity, unit, package_count, weight_kg,
           prepared, prepared_by, prepared_at, checked, checked_by, checked_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        deliveryId,
        position,
        it.description,
        it.quantity,
        it.unit,
        it.package_count,
        it.weight_kg,
        prepared ? 1 : 0,
        prepared ? userId : null,
        prepared ? ts : null,
        it.checked ? 1 : 0,
        it.checked ? userId : null,
        it.checked ? ts : null,
      );
    }
  });
  const removed = existing.filter((r) => !keep.has(r.id));
  for (const r of removed) db.prepare('DELETE FROM delivery_items WHERE id = ?').run(r.id);
  return removed.map((r) => r.description as string);
}

function validated(body: Record<string, unknown>): DeliveryInput {
  const { value, errors } = validateDelivery(body);
  if (Object.keys(errors).length) throw badRequest('Revise os campos destacados.', errors);
  return value;
}

export function createDelivery(db: DB, body: Record<string, unknown>, user: SessionUser, clientRequestId: string | null): number {
  const input = validated(body);
  return transaction(db, () => {
    if (clientRequestId) {
      // Reenvio do mesmo formulário (duplo clique, rede lenta): devolve a entrega já criada.
      const dup = db.prepare('SELECT id FROM deliveries WHERE client_request_id = ?').get(clientRequestId) as Row | undefined;
      if (dup) return dup.id as number;
    }
    assertDriver(db, input.driver_id);
    const ts = now();
    const res = db
      .prepare(
        `INSERT INTO deliveries (customer_name, receiver_whatsapp, salesperson, order_number, postal_code, street, address_number,
          address_complement, neighborhood, city, state, reference_point, address_text, materials_notes, delivery_date, delivery_period,
          scheduled_start_time, scheduled_end_time, driver_id, urgency, material_separated, driver_notes, internal_notes,
          status, client_request_id, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aguardando_agendamento', ?, ?, ?, ?)`,
      )
      .run(
        input.customer_name,
        input.receiver_whatsapp,
        input.salesperson,
        input.order_number,
        input.postal_code,
        input.street,
        input.address_number,
        input.address_complement,
        input.neighborhood,
        input.city,
        input.state,
        input.reference_point,
        input.address_text,
        input.materials_notes,
        input.delivery_date,
        input.delivery_period,
        input.scheduled_start_time,
        input.scheduled_end_time,
        input.driver_id,
        input.urgency,
        input.material_separated ? 1 : 0,
        input.driver_notes,
        input.internal_notes,
        clientRequestId,
        user.id,
        ts,
        ts,
      );
    const id = Number(res.lastInsertRowid);
    writeItems(db, id, input.items, user.id);
    addEvent(db, id, 'criada', user.id, { new_status: 'aguardando_agendamento' });
    refreshStatus(db, id, user.id);
    return id;
  });
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

/** Aplica nova agenda preservando a anterior no histórico (regra 7). */
function applySchedule(db: DB, d: Row, sched: Schedule, userId: number, reason: string | null): boolean {
  const changed = SCHEDULE_FIELDS.filter((f) => (d[f] ?? null) !== (sched[f] ?? null));
  if (!changed.length) return false;
  assertDriver(db, sched.driver_id, d.driver_id);
  const routeChanged = d.delivery_date !== sched.delivery_date || d.driver_id !== sched.driver_id;
  // Se a entrega já estava em rota e muda de dia/entregador, volta a ficar pendente.
  const resetExec = routeChanged && d.exec_status === 'em_rota';
  db.prepare(
    `UPDATE deliveries SET delivery_date = ?, delivery_period = ?, scheduled_start_time = ?, scheduled_end_time = ?, driver_id = ?,
       route_position = ?, exec_status = ? WHERE id = ?`,
  ).run(
    sched.delivery_date,
    sched.delivery_period,
    sched.scheduled_start_time,
    sched.scheduled_end_time,
    sched.driver_id,
    routeChanged ? null : d.route_position,
    resetExec ? 'pendente' : d.exec_status,
    d.id,
  );
  const names = (ids: (number | null)[]) =>
    ids.map((id) => (id ? ((db.prepare('SELECT name FROM drivers WHERE id = ?').get(id) as Row | undefined)?.name ?? null) : null));
  const [prevDriver, newDriver] = names([d.driver_id, sched.driver_id]);
  addEvent(db, d.id, d.delivery_date ? 'reagendamento' : 'agendamento', userId, {
    details: {
      antes: { data: d.delivery_date, periodo: d.delivery_period, inicio: d.scheduled_start_time, fim: d.scheduled_end_time, entregador: prevDriver },
      depois: { data: sched.delivery_date, periodo: sched.delivery_period, inicio: sched.scheduled_start_time, fim: sched.scheduled_end_time, entregador: newDriver },
    },
    reason,
  });
  return true;
}

function loadRow(db: DB, id: number): Row {
  const d = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id) as Row | undefined;
  if (!d) throw notFound('Entrega não encontrada.');
  return d;
}

function assertVersion(d: Row, version: unknown) {
  if (version != null && Number(version) !== d.version)
    throw new HttpError(409, 'Esta entrega foi alterada por outra pessoa enquanto você editava. Recarregue para ver a versão mais recente.');
}

export function updateDelivery(db: DB, id: number, body: Record<string, unknown>, user: SessionUser) {
  const input = validated(body);
  transaction(db, () => {
    const d = loadRow(db, id);
    if (body.version == null) throw badRequest('Versão da entrega ausente.');
    assertVersion(d, body.version);
    const changed = EDIT_FIELDS.filter((f) => (d[f] ?? null) !== (input[f] ?? null));
    if (changed.length) {
      db.prepare(`UPDATE deliveries SET ${changed.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`).run(
        ...changed.map((f) => input[f] ?? null),
        id,
      );
    }
    if (!!d.material_separated !== input.material_separated) {
      db.prepare('UPDATE deliveries SET material_separated = ? WHERE id = ?').run(input.material_separated ? 1 : 0, id);
      changed.push('material_separated' as never);
    }
    const removed = writeItems(db, id, input.items, user.id);
    applySchedule(db, d, input, user.id, null);
    if (changed.length || removed.length) {
      addEvent(db, id, 'edicao', user.id, { details: { campos: changed, materiais_removidos: removed } });
    }
    touch(db, id);
    refreshStatus(db, id, user.id);
  });
}

function parseSchedule(body: Record<string, unknown>, d: Row): Schedule {
  const merged: Record<string, unknown> = { ...d, items: [] };
  for (const f of SCHEDULE_FIELDS) if (f in body) merged[f] = body[f];
  const { value, errors } = validateDelivery(merged);
  const relevant = Object.fromEntries(Object.entries(errors).filter(([k]) => (SCHEDULE_FIELDS as readonly string[]).includes(k)));
  if (Object.keys(relevant).length) throw badRequest('Revise os dados do agendamento.', relevant);
  return value;
}

export function scheduleDelivery(db: DB, id: number, body: Record<string, unknown>, user: SessionUser) {
  transaction(db, () => {
    const d = loadRow(db, id);
    assertVersion(d, body.version);
    if (isFinal(d.status)) throw new HttpError(409, 'Entregas concluídas ou canceladas não podem ser reagendadas. Reabra primeiro.');
    const sched = parseSchedule(body, d);
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) || null : null;
    if (applySchedule(db, d, sched, user.id, reason)) {
      touch(db, id);
      refreshStatus(db, id, user.id, reason);
    }
  });
}

// ---------------------------------------------------------------------------
// Separação, conferência e carregamento

function stageColumns(stage: ItemStage) {
  return { col: stage, by: `${stage}_by`, at: `${stage}_at` };
}

function canTouchStage(user: SessionUser, stage: ItemStage) {
  // Entregador só confirma carregamento; separação/conferência são do depósito (administração).
  if (user.role === 'driver' && stage !== 'loaded') throw forbidden();
}

function setStage(db: DB, itemId: number, stage: ItemStage, value: boolean, userId: number) {
  const { col, by, at } = stageColumns(stage);
  const ts = now();
  db.prepare(`UPDATE delivery_items SET ${col} = ?, ${by} = ?, ${at} = ? WHERE id = ? AND ${col} != ?`).run(
    value ? 1 : 0,
    value ? userId : null,
    value ? ts : null,
    itemId,
    value ? 1 : 0,
  );
  // Conferir implica separado; desfazer a separação desfaz a conferência.
  if (stage === 'checked' && value) setStage(db, itemId, 'prepared', true, userId);
  if (stage === 'prepared' && !value) setStage(db, itemId, 'checked', false, userId);
}

function parseStage(v: unknown): ItemStage {
  if (v === 'prepared' || v === 'checked' || v === 'loaded') return v;
  throw badRequest('Etapa inválida.');
}

export function updateItemStage(db: DB, deliveryId: number, itemId: number, body: Record<string, unknown>, user: SessionUser) {
  const stage = parseStage(body.stage);
  canTouchStage(user, stage);
  loadDelivery(db, deliveryId, user); // valida escopo
  transaction(db, () => {
    const d = loadRow(db, deliveryId);
    if (isFinal(d.status) && stage !== 'loaded') throw new HttpError(409, 'Esta entrega já foi encerrada.');
    const item = db.prepare('SELECT * FROM delivery_items WHERE id = ? AND delivery_id = ?').get(itemId, deliveryId) as Row | undefined;
    if (!item) throw notFound('Material não encontrado.');
    const value = body.value === true;
    setStage(db, itemId, stage, value, user.id);
    addEvent(db, deliveryId, stage === 'loaded' ? 'carregamento' : 'preparo', user.id, {
      details: { item: item.description, etapa: stage, valor: value },
    });
    touch(db, deliveryId);
    refreshStatus(db, deliveryId, user.id);
  });
}

export function confirmAllItems(db: DB, deliveryId: number, body: Record<string, unknown>, user: SessionUser) {
  const stage = parseStage(body.stage);
  canTouchStage(user, stage);
  loadDelivery(db, deliveryId, user);
  transaction(db, () => {
    const d = loadRow(db, deliveryId);
    if (isFinal(d.status)) throw new HttpError(409, 'Esta entrega já foi encerrada.');
    const items = db.prepare('SELECT id FROM delivery_items WHERE delivery_id = ?').all(deliveryId) as Row[];
    if (!items.length) throw badRequest('Esta entrega não tem materiais cadastrados.');
    for (const it of items) setStage(db, it.id, stage, true, user.id);
    addEvent(db, deliveryId, stage === 'loaded' ? 'carregamento' : 'preparo', user.id, { details: { etapa: stage, todos: true } });
    touch(db, deliveryId);
    refreshStatus(db, deliveryId, user.id);
  });
}

export function setMaterialSeparated(db: DB, deliveryId: number, body: Record<string, unknown>, user: SessionUser) {
  transaction(db, () => {
    const d = loadRow(db, deliveryId);
    if (isFinal(d.status)) throw new HttpError(409, 'Esta entrega já foi encerrada.');
    const value = body.value === true;
    db.prepare('UPDATE deliveries SET material_separated = ? WHERE id = ?').run(value ? 1 : 0, deliveryId);
    addEvent(db, deliveryId, 'preparo', user.id, { details: { material_separado: value } });
    touch(db, deliveryId);
    refreshStatus(db, deliveryId, user.id);
  });
}

/** Liberação excepcional sem conferência completa — exige justificativa e fica auditada. */
export function setPrepException(db: DB, deliveryId: number, body: Record<string, unknown>, user: SessionUser) {
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
  const clear = body.clear === true;
  if (!clear && reason.length < 5) throw badRequest('Explique o motivo da exceção.', { reason: 'Explique o motivo (mín. 5 caracteres).' });
  transaction(db, () => {
    const d = loadRow(db, deliveryId);
    if (isFinal(d.status)) throw new HttpError(409, 'Esta entrega já foi encerrada.');
    db.prepare('UPDATE deliveries SET prep_exception_reason = ? WHERE id = ?').run(clear ? null : reason, deliveryId);
    addEvent(db, deliveryId, clear ? 'excecao_removida' : 'excecao_preparo', user.id, { reason: clear ? null : reason });
    touch(db, deliveryId);
    refreshStatus(db, deliveryId, user.id, clear ? null : reason);
  });
}

// ---------------------------------------------------------------------------
// Execução da entrega

function setExec(db: DB, d: Row, exec: ExecStatus, userId: number, reason: string | null, completedAt?: string | null) {
  if (completedAt !== undefined) db.prepare('UPDATE deliveries SET completed_at = ? WHERE id = ?').run(completedAt, d.id);
  db.prepare('UPDATE deliveries SET exec_status = ? WHERE id = ?').run(exec, d.id);
  touch(db, d.id);
  refreshStatus(db, d.id, userId, reason);
}

/** Regra 4: entregador inicia o deslocamento para a entrega. */
export function startDelivery(db: DB, id: number, user: SessionUser, timezone: string) {
  loadDelivery(db, id, user);
  transaction(db, () => {
    const d = loadRow(db, id);
    if (d.status === 'em_rota') return;
    if (d.status === 'aguardando_separacao')
      throw new HttpError(409, 'O material desta entrega ainda não foi conferido. Fale com o depósito antes de sair.');
    if (d.status === 'aguardando_agendamento') throw new HttpError(409, 'Esta entrega ainda não tem data agendada.');
    if (d.status !== 'pronta') throw new HttpError(409, 'Esta entrega não pode ser iniciada na situação atual.');
    if (!d.driver_id) throw new HttpError(409, 'Defina um entregador antes de iniciar a rota.');
    const today = todayISO(timezone);
    if (d.delivery_date > today) throw new HttpError(409, `Esta entrega está agendada para ${formatDateBR(d.delivery_date)}.`);
    setExec(db, d, 'em_rota', user.id, null);
  });
}

export function savePhoto(
  db: DB,
  deliveryId: number,
  user: SessionUser,
  file: { name: string; mime: string; size: number },
): number {
  loadDelivery(db, deliveryId, user);
  const res = db
    .prepare('INSERT INTO photos (delivery_id, file_name, mime, size, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(deliveryId, file.name, file.mime, file.size, user.id, now());
  return Number(res.lastInsertRowid);
}

/** Regra 5: confirmação de entrega com comprovante. */
export function completeDelivery(db: DB, id: number, body: Record<string, unknown>, user: SessionUser) {
  loadDelivery(db, id, user);
  const receiver = typeof body.receiver_name === 'string' ? body.receiver_name.trim().slice(0, 160) : '';
  if (receiver.length < 2) throw badRequest('Informe quem recebeu.', { receiver_name: 'Informe o nome de quem recebeu.' });
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 1000) || null : null;
  const photoIds = [...new Set((Array.isArray(body.photo_ids) ? body.photo_ids : body.photo_id == null ? [] : [body.photo_id]).map(Number))];
  transaction(db, () => {
    const d = loadRow(db, id);
    if (d.status === 'entregue') throw new HttpError(409, 'Esta entrega já foi confirmada.');
    if (!['pronta', 'em_rota', 'problema'].includes(d.status)) {
      const msg =
        d.status === 'aguardando_separacao'
          ? 'O material desta entrega ainda não foi conferido.'
          : d.status === 'aguardando_agendamento'
            ? 'Esta entrega ainda não foi agendada.'
            : 'Esta entrega não pode ser confirmada na situação atual.';
      throw new HttpError(409, msg);
    }
    for (const pid of photoIds) {
      const p = Number.isInteger(pid) && db.prepare('SELECT id FROM photos WHERE id = ? AND delivery_id = ?').get(pid, id);
      if (!p) throw badRequest('Foto não encontrada. Envie novamente.');
    }
    const ts = now();
    const proof = db
      .prepare('INSERT INTO delivery_proofs (delivery_id, receiver_name, photo_id, notes, completed_by, completed_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, receiver, photoIds[0] ?? null, notes, user.id, ts);
    photoIds.forEach((pid, position) =>
      db.prepare('INSERT INTO proof_photos (proof_id, photo_id, position) VALUES (?, ?, ?)').run(Number(proof.lastInsertRowid), pid, position),
    );
    // Problemas em aberto ficam registrados como resolvidos pela própria entrega (o histórico não é apagado).
    db.prepare(
      `UPDATE delivery_problems SET resolved_at = ?, resolved_by = ?, resolution_notes = COALESCE(resolution_notes, 'Entrega concluída.')
       WHERE delivery_id = ? AND resolved_at IS NULL`,
    ).run(ts, user.id, id);
    setExec(db, d, 'entregue', user.id, null, ts);
  });
}

/** Regra 6: registro de problema. */
export function reportProblem(db: DB, id: number, body: Record<string, unknown>, user: SessionUser) {
  loadDelivery(db, id, user);
  const type = String(body.problem_type ?? '');
  if (!PROBLEM_TYPES.some((p) => p.value === type)) throw badRequest('Escolha o tipo de problema.', { problem_type: 'Escolha uma opção.' });
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 1000) || null : null;
  if (type === 'outro' && !description) throw badRequest('Descreva o problema.', { description: 'Descreva o que aconteceu.' });
  transaction(db, () => {
    const d = loadRow(db, id);
    if (isFinal(d.status)) throw new HttpError(409, 'Esta entrega já foi encerrada.');
    db.prepare('INSERT INTO delivery_problems (delivery_id, problem_type, description, reported_by, reported_at) VALUES (?, ?, ?, ?, ?)').run(
      id,
      type,
      description,
      user.id,
      now(),
    );
    addEvent(db, id, 'problema', user.id, { details: { tipo: type }, reason: description });
    setExec(db, d, 'problema', user.id, description);
  });
}

export function updateProblemNotes(db: DB, problemId: number, body: Record<string, unknown>) {
  const notes = typeof body.admin_notes === 'string' ? body.admin_notes.trim().slice(0, 2000) || null : null;
  const res = db.prepare('UPDATE delivery_problems SET admin_notes = ? WHERE id = ?').run(notes, problemId);
  if (!res.changes) throw notFound('Problema não encontrado.');
}

export function resolveProblem(db: DB, problemId: number, body: Record<string, unknown>, user: SessionUser) {
  const notes = typeof body.resolution_notes === 'string' ? body.resolution_notes.trim().slice(0, 1000) : '';
  if (notes.length < 3) throw badRequest('Descreva como o problema foi resolvido.', { resolution_notes: 'Descreva a solução.' });
  transaction(db, () => {
    const p = db.prepare('SELECT * FROM delivery_problems WHERE id = ?').get(problemId) as Row | undefined;
    if (!p) throw notFound('Problema não encontrado.');
    if (p.resolved_at) throw new HttpError(409, 'Este problema já foi resolvido.');
    db.prepare('UPDATE delivery_problems SET resolved_at = ?, resolved_by = ?, resolution_notes = ? WHERE id = ?').run(
      now(),
      user.id,
      notes,
      problemId,
    );
    addEvent(db, p.delivery_id, 'problema_resolvido', user.id, { reason: notes });
    const d = loadRow(db, p.delivery_id);
    if (body.schedule && typeof body.schedule === 'object') {
      applySchedule(db, d, parseSchedule(body.schedule as Record<string, unknown>, d), user.id, notes);
    }
    const open = (db.prepare('SELECT COUNT(*) AS n FROM delivery_problems WHERE delivery_id = ? AND resolved_at IS NULL').get(p.delivery_id) as Row).n;
    if (!open && d.exec_status === 'problema') setExec(db, loadRow(db, p.delivery_id), 'pendente', user.id, notes);
    else {
      touch(db, p.delivery_id);
      refreshStatus(db, p.delivery_id, user.id, notes);
    }
  });
}

export function cancelDelivery(db: DB, id: number, body: Record<string, unknown>, user: SessionUser) {
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
  if (reason.length < 3) throw badRequest('Informe o motivo do cancelamento.', { reason: 'Informe o motivo.' });
  transaction(db, () => {
    const d = loadRow(db, id);
    if (d.status === 'cancelada') return;
    if (d.status === 'entregue') throw new HttpError(409, 'Entregas concluídas não podem ser canceladas. Reabra primeiro.');
    setExec(db, d, 'cancelada', user.id, reason);
  });
}

export function reopenDelivery(db: DB, id: number, body: Record<string, unknown>, user: SessionUser) {
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
  if (reason.length < 3) throw badRequest('Informe o motivo da reabertura.', { reason: 'Informe o motivo.' });
  transaction(db, () => {
    const d = loadRow(db, id);
    if (!isFinal(d.status)) throw new HttpError(409, 'Esta entrega já está ativa.');
    const open = (db.prepare('SELECT COUNT(*) AS n FROM delivery_problems WHERE delivery_id = ? AND resolved_at IS NULL').get(id) as Row).n;
    setExec(db, d, open ? 'problema' : 'pendente', user.id, reason, null);
  });
}

// ---------------------------------------------------------------------------
// Consultas

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (c) => '\\' + c);
}

const PERIOD_CASE = `CASE d.delivery_period WHEN 'manha' THEN 0 WHEN 'tarde' THEN 1 WHEN 'noite' THEN 2 WHEN 'combinado' THEN 3 WHEN 'a_definir' THEN 4 ELSE 5 END`;
export const ROUTE_ORDER = `d.delivery_date IS NULL, d.delivery_date, d.route_position IS NULL, d.route_position, ${PERIOD_CASE}, d.scheduled_start_time IS NULL, d.scheduled_start_time, d.id`;
const SORTS: Record<string, string> = {
  date: ROUTE_ORDER,
  urgency: `CASE d.urgency WHEN 'alta' THEN 0 WHEN 'media' THEN 1 WHEN 'baixa' THEN 2 ELSE 3 END, ${ROUTE_ORDER}`,
  customer: 'd.customer_name COLLATE NOCASE, d.id',
  driver: `dr.name IS NULL, dr.name COLLATE NOCASE, ${ROUTE_ORDER}`,
  status: `CASE d.status WHEN 'problema' THEN 0 WHEN 'aguardando_separacao' THEN 1 WHEN 'pronta' THEN 2 WHEN 'em_rota' THEN 3 WHEN 'aguardando_agendamento' THEN 4 WHEN 'entregue' THEN 5 ELSE 6 END, ${ROUTE_ORDER}`,
  recent: 'd.updated_at DESC',
  completed: 'd.completed_at IS NULL, d.completed_at DESC, d.updated_at DESC',
};

export function listDeliveries(db: DB, q: URLSearchParams, user: SessionUser, timezone: string) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  const today = todayISO(timezone);

  if (user.role === 'driver') {
    // Escopo do entregador: apenas as suas entregas.
    where.push('d.driver_id = ?');
    params.push(user.driver_id!);
    if (q.get('scope') === 'history') {
      where.push("d.status IN ('entregue','cancelada')");
    } else {
      // Pendentes (incluindo atrasadas e futuras) + concluídas hoje.
      where.push("(d.status NOT IN ('entregue','cancelada','aguardando_agendamento') OR (d.status = 'entregue' AND d.delivery_date = ?))");
      params.push(today);
    }
  }

  const search = q.get('q')?.trim();
  if (search) {
    const like = `%${escapeLike(search)}%`;
    where.push(
      `(d.customer_name LIKE ? ESCAPE '\\' OR d.order_number LIKE ? ESCAPE '\\' OR d.street LIKE ? ESCAPE '\\' OR d.neighborhood LIKE ? ESCAPE '\\' OR d.address_text LIKE ? ESCAPE '\\' OR d.city LIKE ? ESCAPE '\\')`,
    );
    params.push(like, like, like, like, like, like);
  }
  const statuses = q.get('status')?.split(',').filter(Boolean);
  if (statuses?.length) {
    where.push(`d.status IN (${statuses.map(() => '?').join(',')})`);
    params.push(...statuses);
  } else if (user.role === 'admin' && q.get('include_done') !== '1') {
    where.push("d.status NOT IN ('entregue','cancelada')");
  }
  const driver = q.get('driver');
  if (driver === 'none') where.push('d.driver_id IS NULL');
  else if (driver) {
    where.push('d.driver_id = ?');
    params.push(Number(driver));
  }
  const urgency = q.get('urgency');
  if (urgency === 'any') where.push('d.urgency IS NOT NULL');
  else if (urgency) {
    where.push('d.urgency = ?');
    params.push(urgency);
  }
  const separated = q.get('separated');
  if (separated === 'no') where.push("d.is_prepared = 0 AND d.status NOT IN ('entregue','cancelada')");
  if (separated === 'yes') where.push('d.is_prepared = 1');
  const period = q.get('period');
  if (period === 'none') where.push('d.delivery_period IS NULL');
  else if (period && PERIODS.some((p) => p.value === period)) {
    where.push('d.delivery_period = ?');
    params.push(period);
  }
  const from = q.get('from');
  const to = q.get('to');
  if (isISODate(from)) {
    where.push('d.delivery_date >= ?');
    params.push(from);
  }
  if (isISODate(to)) {
    where.push('d.delivery_date <= ?');
    params.push(to);
  }
  if (q.get('unscheduled') === '1') where.push('d.delivery_date IS NULL');
  if (q.get('overdue') === '1') {
    where.push("d.delivery_date < ? AND d.status NOT IN ('entregue','cancelada')");
    params.push(today);
  }

  const sort = SORTS[q.get('sort') ?? 'date'] ?? SORTS.date;
  const limit = Math.min(Math.max(Number(q.get('limit')) || 100, 1), 500);
  const offset = Math.max(Number(q.get('offset')) || 0, 0);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM deliveries d LEFT JOIN drivers dr ON dr.id = d.driver_id ${whereSql}`).get(...params) as Row).n;
  const rows = db.prepare(`${DELIVERY_SELECT} ${whereSql} ORDER BY ${sort} LIMIT ? OFFSET ?`).all(...params, limit, offset) as Row[];
  return { total, items: hydrate(db, rows, user) };
}

/** Salva a ordem das paradas de uma rota (entregador + data). */
export function saveRouteOrder(db: DB, body: Record<string, unknown>) {
  const date = body.date;
  if (!isISODate(date)) throw badRequest('Data inválida.');
  const driverId = body.driver_id == null ? null : Number(body.driver_id);
  const ids = Array.isArray(body.ids) ? body.ids.map(Number) : [];
  if (!ids.length || ids.some((n) => !Number.isInteger(n))) throw badRequest('Lista de entregas inválida.');
  transaction(db, () => {
    ids.forEach((id, idx) => {
      const d = db.prepare('SELECT delivery_date, driver_id FROM deliveries WHERE id = ?').get(id) as Row | undefined;
      if (!d || d.delivery_date !== date || (d.driver_id ?? null) !== driverId)
        throw new HttpError(409, 'A rota mudou enquanto você organizava. Recarregue e tente de novo.');
      db.prepare('UPDATE deliveries SET route_position = ? WHERE id = ?').run(idx + 1, id);
    });
  });
}

export function findByOrderNumber(db: DB, order: string, excludeId: number | null) {
  return db
    .prepare(
      `SELECT id, customer_name, delivery_date, status FROM deliveries
       WHERE order_number = ? COLLATE NOCASE AND id != ? ORDER BY id DESC LIMIT 5`,
    )
    .all(order.trim(), excludeId ?? 0) as Row[];
}

