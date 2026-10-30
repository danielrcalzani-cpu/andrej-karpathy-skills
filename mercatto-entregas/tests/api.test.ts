import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { openMemoryDatabase, now } from '../server/db.ts';
import { hashPassword } from '../server/auth.ts';
import { createApp } from '../server/app.ts';
import { todayISO, addDays } from '../shared/domain.ts';

const db = openMemoryDatabase();
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mercatto-test-'));
const TZ = 'America/Manaus';
const today = todayISO(TZ);
let server: http.Server;
let base = '';

function addUser(username: string, role: 'admin' | 'driver', driverId: number | null = null) {
  db.prepare('INSERT INTO users (name, username, password_hash, role, driver_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    username.toUpperCase(),
    username,
    hashPassword('senha-segura'),
    role,
    driverId,
    now(),
  );
}

class Client {
  cookie = '';
  async req(method: string, url: string, body?: unknown, headers: Record<string, string> = {}) {
    const isBuf = Buffer.isBuffer(body);
    const res = await fetch(base + url, {
      method,
      headers: {
        ...(body !== undefined && !isBuf ? { 'Content-Type': 'application/json' } : {}),
        'X-Requested-With': 'mercatto',
        ...(this.cookie ? { Cookie: this.cookie } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isBuf ? new Uint8Array(body as Buffer) : JSON.stringify(body),
    });
    const set = res.headers.get('set-cookie');
    if (set) this.cookie = set.split(';')[0]!;
    const type = res.headers.get('content-type') ?? '';
    return { status: res.status, body: type.includes('json') ? ((await res.json()) as any) : await res.arrayBuffer() };
  }
  async login(username: string) {
    const r = await this.req('POST', '/api/auth/login', { username, password: 'senha-segura' });
    assert.equal(r.status, 200);
    return this;
  }
}

let adminC: Client;
let carlos: Client;
let marcos: Client;
let carlosId = 0;
let marcosId = 0;

before(async () => {
  carlosId = Number(db.prepare("INSERT INTO drivers (name, phone, active, created_at) VALUES ('Carlos', '5592991234567', 1, ?)").run(now()).lastInsertRowid);
  marcosId = Number(db.prepare("INSERT INTO drivers (name, active, created_at) VALUES ('Marcos', 1, ?)").run(now()).lastInsertRowid);
  addUser('admin', 'admin');
  addUser('carlos', 'driver', carlosId);
  addUser('marcos', 'driver', marcosId);
  server = http.createServer(createApp(db, { dataDir, timezone: TZ, cookieSecure: false, maxPhotoBytes: 1024 * 1024 }, null));
  await new Promise<void>((r) => server.listen(0, r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  adminC = await new Client().login('admin');
  carlos = await new Client().login('carlos');
  marcos = await new Client().login('marcos');
});
after(() => server.close());

const baseDelivery = {
  customer_name: 'João Silva',
  receiver_whatsapp: '(92) 99123-4567',
  salesperson: 'Ana',
  order_number: '1045',
  street: 'Rua Exemplo',
  address_number: '123',
  neighborhood: 'Centro',
  city: 'Manaus',
  state: 'am',
  driver_notes: 'Ligar antes de chegar',
  internal_notes: 'Cliente VIP',
  urgency: 'alta',
};

test('exige login e bloqueia requisições sem o cabeçalho anti-CSRF', async () => {
  assert.equal((await new Client().req('GET', '/api/deliveries')).status, 401);
  const res = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'senha-segura' }),
  });
  assert.equal(res.status, 403);
  assert.equal((await new Client().req('POST', '/api/auth/login', { username: 'admin', password: 'errada' })).status, 401);
});

test('cria entrega sem data → Aguardando agendamento, preservando todos os campos', async () => {
  const r = await adminC.req('POST', '/api/deliveries', { ...baseDelivery, materials_notes: 'Entregar pela garagem' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const d = r.body.delivery;
  assert.equal(d.status, 'aguardando_agendamento');
  assert.equal(d.receiver_whatsapp, '5592991234567');
  assert.equal(d.state, 'AM');
  assert.equal(d.salesperson, 'Ana');
  assert.equal(d.order_number, '1045');
  assert.equal(d.urgency, 'alta');
  assert.equal(d.driver_notes, 'Ligar antes de chegar');
  assert.equal(d.internal_notes, 'Cliente VIP');
  assert.equal(d.materials_notes, 'Entregar pela garagem');
});

test('validação: nome obrigatório, quantidade negativa e WhatsApp inválido', async () => {
  const r = await adminC.req('POST', '/api/deliveries', {
    customer_name: '',
    receiver_whatsapp: '123',
    street: 'Rua A',
    items: [{ description: 'Piso', quantity: -2, unit: 'caixas' }],
  });
  assert.equal(r.status, 400);
  assert.ok(r.body.fields.customer_name);
  assert.ok(r.body.fields.receiver_whatsapp);
  assert.ok(r.body.fields['items.0.quantity']);
});

test('envio duplicado com a mesma chave não cria duas entregas', async () => {
  const headers = { 'Idempotency-Key': 'form-abc' };
  const a = await adminC.req('POST', '/api/deliveries', { ...baseDelivery, order_number: 'DUP-1' }, headers);
  const b = await adminC.req('POST', '/api/deliveries', { ...baseDelivery, order_number: 'DUP-1' }, headers);
  assert.equal(a.body.delivery.id, b.body.delivery.id);
  const check = await adminC.req('GET', '/api/deliveries/check-order?order=dup-1');
  assert.equal(check.body.matches.length, 1);
});

let mainId = 0;

test('fluxo completo: agendar, separar, conferir, carregar, iniciar e confirmar com foto', async () => {
  const created = await adminC.req('POST', '/api/deliveries', {
    ...baseDelivery,
    delivery_date: today,
    delivery_period: 'manha',
    driver_id: carlosId,
    items: [
      { description: 'Piso SPC Carvalho', quantity: 12, unit: 'caixas' },
      { description: 'Rodapé Branco', quantity: 4, unit: 'barras' },
      { description: 'Manta', quantity: 30, unit: 'm²', package_count: 2 },
    ],
  });
  const d = created.body.delivery;
  mainId = d.id;
  assert.equal(d.status, 'aguardando_separacao');

  // Entregador não pode iniciar sem material conferido nem conferir material.
  assert.equal((await carlos.req('POST', `/api/deliveries/${d.id}/start`, {})).status, 409);
  assert.equal((await carlos.req('POST', `/api/deliveries/${d.id}/items/${d.items[0].id}/stage`, { stage: 'checked', value: true })).status, 403);

  // Separar não basta: precisa conferir.
  let r = await adminC.req('POST', `/api/deliveries/${d.id}/items/confirm-all`, { stage: 'prepared' });
  assert.equal(r.body.delivery.status, 'aguardando_separacao');
  r = await adminC.req('POST', `/api/deliveries/${d.id}/items/${d.items[0].id}/stage`, { stage: 'checked', value: true });
  assert.equal(r.body.delivery.status, 'aguardando_separacao');
  r = await adminC.req('POST', `/api/deliveries/${d.id}/items/confirm-all`, { stage: 'checked' });
  assert.equal(r.body.delivery.status, 'pronta');
  assert.ok(r.body.delivery.prepared_at);

  // Carregamento pelo entregador.
  r = await carlos.req('POST', `/api/deliveries/${d.id}/items/confirm-all`, { stage: 'loaded' });
  assert.equal(r.status, 200);
  assert.ok(r.body.delivery.items.every((i: any) => i.loaded && i.loaded_by_name === 'CARLOS'));

  r = await carlos.req('POST', `/api/deliveries/${d.id}/start`, {});
  assert.equal(r.body.delivery.status, 'em_rota');

  // Foto inválida é rejeitada; JPEG válido é aceito.
  assert.equal((await carlos.req('POST', `/api/deliveries/${d.id}/photos`, Buffer.from('não é imagem'.repeat(20)), { 'Content-Type': 'image/jpeg' })).status, 400);
  assert.equal((await carlos.req('POST', `/api/deliveries/${d.id}/photos`, Buffer.alloc(2 * 1024 * 1024, 0xff), { 'Content-Type': 'image/jpeg' })).status, 413);
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(500, 1)]);
  const up = await carlos.req('POST', `/api/deliveries/${d.id}/photos`, jpeg, { 'Content-Type': 'image/jpeg' });
  assert.equal(up.status, 200);

  // Outro entregador não acessa a foto.
  assert.equal((await marcos.req('GET', `/api/photos/${up.body.photo_id}`)).status, 404);
  assert.equal((await adminC.req('GET', `/api/photos/${up.body.photo_id}`)).status, 200);

  assert.equal((await carlos.req('POST', `/api/deliveries/${d.id}/complete`, { receiver_name: '' })).status, 400);
  r = await carlos.req('POST', `/api/deliveries/${d.id}/complete`, { receiver_name: 'Maria (esposa)', photo_id: up.body.photo_id, notes: 'Deixado na garagem' });
  assert.equal(r.status, 200);
  assert.equal(r.body.delivery.status, 'entregue');
  assert.equal(r.body.proofs[0].receiver_name, 'Maria (esposa)');
  assert.equal(r.body.proofs[0].completed_by_name, 'CARLOS');
  // Quantidades preservadas após mudança de status.
  assert.equal(r.body.delivery.items[0].quantity, 12);

  // Confirmar duas vezes não gera dois comprovantes.
  assert.equal((await carlos.req('POST', `/api/deliveries/${d.id}/complete`, { receiver_name: 'Maria' })).status, 409);

  const detail = await adminC.req('GET', `/api/deliveries/${d.id}`);
  const statuses = detail.body.events.filter((e: any) => e.type === 'status').map((e: any) => e.new_status).reverse();
  assert.deepEqual(statuses, ['aguardando_separacao', 'pronta', 'em_rota', 'entregue']);
  assert.ok(detail.body.events.every((e: any) => e.changed_at));
});

test('entregador vê só as próprias entregas e não vê notas internas', async () => {
  const mine = await carlos.req('GET', '/api/deliveries');
  assert.ok(mine.body.items.length > 0);
  assert.ok(mine.body.items.every((d: any) => d.driver_name === 'Carlos' && d.internal_notes === null));
  const other = await marcos.req('GET', '/api/deliveries');
  assert.equal(other.body.items.length, 0);
  assert.equal((await marcos.req('GET', `/api/deliveries/${mainId}`)).status, 404);
  // Rotas administrativas bloqueadas para entregador (no servidor, não só na interface).
  assert.equal((await carlos.req('GET', '/api/summary')).status, 403);
  assert.equal((await carlos.req('POST', '/api/deliveries', baseDelivery)).status, 403);
  assert.equal((await carlos.req('PUT', '/api/routes', { date: today, driver_id: carlosId, ids: [mainId] })).status, 403);
  assert.equal((await carlos.req('GET', '/api/export')).status, 403);
});

test('problema: registra, aparece no painel, resolve com reagendamento e mantém histórico', async () => {
  const created = await adminC.req('POST', '/api/deliveries', {
    ...baseDelivery,
    order_number: '2000',
    delivery_date: today,
    driver_id: carlosId,
    material_separated: true,
  });
  const id = created.body.delivery.id;
  assert.equal(created.body.delivery.status, 'pronta');
  assert.equal((await carlos.req('POST', `/api/deliveries/${id}/problems`, { problem_type: 'inventado' })).status, 400);
  let r = await carlos.req('POST', `/api/deliveries/${id}/problems`, { problem_type: 'cliente_ausente', description: 'Ninguém atendeu' });
  assert.equal(r.body.delivery.status, 'problema');

  const summary = await adminC.req('GET', '/api/summary');
  assert.ok(summary.body.problema >= 1);
  const notif = await adminC.req('GET', '/api/notifications');
  assert.ok(notif.body.alerts.some((a: any) => a.kind === 'problema' && a.delivery_id === id));
  assert.ok(notif.body.events.some((e: any) => e.type === 'problema' && e.unread));

  const problemId = r.body.problems[0].id;
  await adminC.req('PATCH', `/api/problems/${problemId}`, { admin_notes: 'Liguei, volta amanhã' });
  r = await adminC.req('POST', `/api/problems/${problemId}/resolve`, {
    resolution_notes: 'Cliente pediu para amanhã',
    schedule: { delivery_date: addDays(today, 1), delivery_period: 'tarde', driver_id: marcosId },
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const detail = await adminC.req('GET', `/api/deliveries/${id}`);
  assert.equal(detail.body.delivery.status, 'pronta');
  assert.equal(detail.body.delivery.driver_name, 'Marcos');
  assert.equal(detail.body.problems.length, 1);
  assert.ok(detail.body.problems[0].resolved_at);
  assert.equal(detail.body.problems[0].admin_notes, 'Liguei, volta amanhã');
  const resched = detail.body.events.find((e: any) => e.type === 'reagendamento');
  assert.equal(resched.details.antes.data, today);
  assert.equal(resched.details.antes.entregador, 'Carlos');
  // Agora é do Marcos: Carlos perde o acesso.
  assert.equal((await carlos.req('GET', `/api/deliveries/${id}`)).status, 404);
  assert.equal((await marcos.req('GET', `/api/deliveries/${id}`)).status, 200);
  // Notas internas do problema não vão para o entregador.
  const forDriver = await marcos.req('GET', `/api/deliveries/${id}`);
  assert.equal(forDriver.body.problems[0].admin_notes, null);
});

test('edição com versão desatualizada é recusada (alteração concorrente)', async () => {
  const created = await adminC.req('POST', '/api/deliveries', { ...baseDelivery, order_number: '3000' });
  const d = created.body.delivery;
  const ok = await adminC.req('PUT', `/api/deliveries/${d.id}`, { ...d, customer_name: 'João S.', version: d.version });
  assert.equal(ok.status, 200);
  const stale = await adminC.req('PUT', `/api/deliveries/${d.id}`, { ...d, customer_name: 'Outro', version: d.version });
  assert.equal(stale.status, 409);
});

test('exceção de preparo exige justificativa e fica auditada', async () => {
  const created = await adminC.req('POST', '/api/deliveries', {
    ...baseDelivery,
    order_number: '4000',
    delivery_date: today,
    items: [{ description: 'Forro PVC', quantity: 10, unit: 'peças' }],
  });
  const id = created.body.delivery.id;
  assert.equal((await adminC.req('POST', `/api/deliveries/${id}/prep-exception`, { reason: '' })).status, 400);
  const r = await adminC.req('POST', `/api/deliveries/${id}/prep-exception`, { reason: 'Cliente retira faltante na loja' });
  assert.equal(r.body.delivery.status, 'pronta');
  assert.ok(r.body.events.some((e: any) => e.type === 'excecao_preparo' && e.reason));
});

test('ordem da rota é salva e o entregador vê a mesma sequência', async () => {
  const ids: number[] = [];
  for (const name of ['Parada A', 'Parada B', 'Parada C']) {
    const c = await adminC.req('POST', '/api/deliveries', {
      ...baseDelivery,
      customer_name: name,
      order_number: name,
      delivery_date: addDays(today, 2),
      driver_id: marcosId,
      material_separated: true,
    });
    ids.push(c.body.delivery.id);
  }
  const order = [ids[2]!, ids[0]!, ids[1]!];
  const r = await adminC.req('PUT', '/api/routes', { date: addDays(today, 2), driver_id: marcosId, ids: order });
  assert.equal(r.status, 200);
  const driverView = await marcos.req('GET', '/api/deliveries');
  const seq = driverView.body.items.filter((d: any) => d.delivery_date === addDays(today, 2)).map((d: any) => d.id);
  assert.deepEqual(seq, order);
  // Lista com entrega de outro entregador é recusada.
  assert.equal((await adminC.req('PUT', '/api/routes', { date: addDays(today, 2), driver_id: carlosId, ids: order })).status, 409);
});

test('filtros: só o que falta separar, mostrar entregues e busca', async () => {
  const pending = await adminC.req('GET', '/api/deliveries?separated=no');
  assert.ok(pending.body.items.every((d: any) => d.status !== 'entregue' && d.status !== 'pronta'));
  const active = await adminC.req('GET', '/api/deliveries');
  assert.ok(active.body.items.every((d: any) => d.status !== 'entregue'));
  const withDone = await adminC.req('GET', '/api/deliveries?include_done=1');
  assert.ok(withDone.body.items.some((d: any) => d.status === 'entregue'));
  const search = await adminC.req('GET', '/api/deliveries?q=' + encodeURIComponent('Parada B'));
  assert.equal(search.body.total, 1);
  const like = await adminC.req('GET', '/api/deliveries?q=%25');
  assert.equal(like.body.total, 0);
  const history = await carlos.req('GET', '/api/deliveries?scope=history');
  assert.ok(history.body.items.every((d: any) => d.status === 'entregue' || d.status === 'cancelada'));
});

test('cancelar e reabrir exigem motivo', async () => {
  const c = await adminC.req('POST', '/api/deliveries', { ...baseDelivery, order_number: '5000' });
  const id = c.body.delivery.id;
  assert.equal((await adminC.req('POST', `/api/deliveries/${id}/cancel`, {})).status, 400);
  let r = await adminC.req('POST', `/api/deliveries/${id}/cancel`, { reason: 'Cliente desistiu' });
  assert.equal(r.body.delivery.status, 'cancelada');
  r = await adminC.req('POST', `/api/deliveries/${id}/reopen`, { reason: 'Cliente voltou atrás' });
  assert.equal(r.body.delivery.status, 'aguardando_agendamento');
});

test('relatório calcula métricas a partir dos registros', async () => {
  const r = await adminC.req('GET', `/api/reports?from=${today}&to=${addDays(today, 7)}`);
  assert.equal(r.status, 200);
  assert.ok(r.body.delivered >= 1);
  assert.ok(r.body.problem_types.some((p: any) => p.problem_type === 'cliente_ausente'));
  assert.ok(r.body.completion_rate > 0 && r.body.completion_rate <= 1);
});

test('importação da agenda antiga preserva registros e não duplica', async () => {
  const legacy = [
    {
      Cliente: 'Pedro Santos',
      Vendedor: 'Lia',
      'WhatsApp de quem recebe': '92 98877-6655',
      'Nº do pedido ou nota': 'NF 778',
      'Endereço de entrega': 'Av. Djalma Batista, 1000 - Chapada',
      'Materiais a entregar': '10 cx piso laminado',
      'Data da entrega': '05/11/2026',
      'Período': 'Tarde',
      'Entregador ou motorista': 'Carlos',
      'Material separado?': 'Sim',
      'Situação': 'Agendada',
      'Urgência': 'vermelho',
      'Observações': 'Portão azul',
    },
    { Cliente: 'Sem data', 'Endereço de entrega': 'Rua X, 10', 'Situação': 'Entregue' },
  ];
  let r = await adminC.req('POST', '/api/import/legacy', { data: legacy });
  assert.equal(r.body.imported, 2);
  r = await adminC.req('POST', '/api/import/legacy', { data: legacy });
  assert.equal(r.body.imported, 0);
  assert.equal(r.body.skipped_duplicates, 2);
  const list = await adminC.req('GET', '/api/deliveries?q=Pedro');
  const d = list.body.items[0];
  assert.equal(d.delivery_date, '2026-11-05');
  assert.equal(d.delivery_period, 'tarde');
  assert.equal(d.urgency, 'alta');
  assert.equal(d.driver_name, 'Carlos');
  assert.equal(d.receiver_whatsapp, '5592988776655');
  assert.equal(d.status, 'pronta');
  assert.equal(d.legacy_situacao, 'Agendada');
  assert.equal(d.driver_notes, 'Portão azul');
  const done = await adminC.req('GET', '/api/deliveries?q=Sem%20data&include_done=1');
  assert.equal(done.body.items[0].status, 'entregue');
});
