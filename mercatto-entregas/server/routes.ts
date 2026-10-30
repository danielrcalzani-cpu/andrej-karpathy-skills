import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Row } from './db.ts';
import { HttpError, Router, badRequest, forbidden, intParam, notFound, readBody, readJson } from './http.ts';
import type { Ctx } from './http.ts';
import {
  SESSION_COOKIE,
  clearLoginFailures,
  createSession,
  destroySession,
  loginBlocked,
  readCookie,
  registerLoginFailure,
  sessionCookie,
  verifyPassword,
} from './auth.ts';
import * as D from './deliveries.ts';
import * as A from './admin.ts';
import { importLegacy } from './legacy.ts';
import { todayISO } from '../shared/domain.ts';

export const router = new Router();
const r = router;

// ---------------------------------------------------------------------------
// Sessão

r.add('POST', '/api/auth/login', 'public', async (ctx) => {
  const body = await readJson(ctx);
  const username = String(body.username ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const key = `${ctx.req.socket.remoteAddress}|${username}`;
  if (loginBlocked(key)) throw new HttpError(429, 'Muitas tentativas. Aguarde 15 minutos e tente novamente.');
  const u = ctx.db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username) as Row | undefined;
  if (!u || !verifyPassword(password, u.password_hash)) {
    registerLoginFailure(key);
    throw new HttpError(401, 'Usuário ou senha incorretos.');
  }
  clearLoginFailures(key);
  const { token, maxAge } = createSession(ctx.db, u.id);
  ctx.res.setHeader('Set-Cookie', sessionCookie(token, maxAge, ctx.config.cookieSecure));
  return { user: { id: u.id, name: u.name, username: u.username, role: u.role, driver_id: u.driver_id } };
});

r.add('POST', '/api/auth/logout', 'public', (ctx) => {
  const token = readCookie(ctx.req, SESSION_COOKIE);
  if (token) destroySession(ctx.db, token);
  ctx.res.setHeader('Set-Cookie', sessionCookie('', 0, ctx.config.cookieSecure));
  return { ok: true };
});

r.add('GET', '/api/auth/me', 'public', (ctx) => ({ user: ctx.user }));

r.add('GET', '/api/config', 'user', (ctx) => {
  const s = A.getSettings(ctx.db);
  return {
    today: todayISO(ctx.config.timezone),
    timezone: ctx.config.timezone,
    default_city: s.default_city,
    default_state: s.default_state,
    // Nenhum serviço de roteirização configurado: a ordem das paradas é manual.
    route_optimization: false,
    max_photo_mb: Math.round(ctx.config.maxPhotoBytes / 1024 / 1024),
  };
});

// ---------------------------------------------------------------------------
// Entregas

const admin = (ctx: Ctx) => ctx.user!;

r.add('GET', '/api/deliveries', 'user', (ctx) => D.listDeliveries(ctx.db, ctx.url.searchParams, ctx.user!, ctx.config.timezone));

r.add('GET', '/api/deliveries/check-order', 'admin', (ctx) => {
  const order = ctx.url.searchParams.get('order')?.trim();
  if (!order) return { matches: [] };
  const exclude = Number(ctx.url.searchParams.get('exclude')) || null;
  return { matches: D.findByOrderNumber(ctx.db, order, exclude) };
});

r.add('GET', '/api/deliveries/:id', 'user', (ctx) => D.deliveryDetail(ctx.db, intParam(ctx.params.id), ctx.user!));

r.add('POST', '/api/deliveries', 'admin', async (ctx) => {
  const body = await readJson(ctx);
  const requestId = typeof ctx.req.headers['idempotency-key'] === 'string' ? ctx.req.headers['idempotency-key'].slice(0, 80) : null;
  const id = D.createDelivery(ctx.db, body, admin(ctx), requestId);
  return D.deliveryDetail(ctx.db, id, ctx.user!);
});

r.add('PUT', '/api/deliveries/:id', 'admin', async (ctx) => {
  const id = intParam(ctx.params.id);
  D.updateDelivery(ctx.db, id, await readJson(ctx), admin(ctx));
  return D.deliveryDetail(ctx.db, id, ctx.user!);
});

const action = (fn: (ctx: Ctx, id: number, body: Record<string, any>) => void) => async (ctx: Ctx) => {
  const id = intParam(ctx.params.id);
  fn(ctx, id, await readJson(ctx));
  return D.deliveryDetail(ctx.db, id, ctx.user!);
};

r.add('POST', '/api/deliveries/:id/schedule', 'admin', action((ctx, id, b) => D.scheduleDelivery(ctx.db, id, b, ctx.user!)));
r.add('POST', '/api/deliveries/:id/material-separated', 'admin', action((ctx, id, b) => D.setMaterialSeparated(ctx.db, id, b, ctx.user!)));
r.add('POST', '/api/deliveries/:id/prep-exception', 'admin', action((ctx, id, b) => D.setPrepException(ctx.db, id, b, ctx.user!)));
r.add('POST', '/api/deliveries/:id/items/confirm-all', 'user', action((ctx, id, b) => D.confirmAllItems(ctx.db, id, b, ctx.user!)));
r.add(
  'POST',
  '/api/deliveries/:id/items/:itemId/stage',
  'user',
  action((ctx, id, b) => D.updateItemStage(ctx.db, id, intParam(ctx.params.itemId), b, ctx.user!)),
);
r.add('POST', '/api/deliveries/:id/start', 'user', action((ctx, id) => D.startDelivery(ctx.db, id, ctx.user!, ctx.config.timezone)));
r.add('POST', '/api/deliveries/:id/complete', 'user', action((ctx, id, b) => D.completeDelivery(ctx.db, id, b, ctx.user!)));
r.add('POST', '/api/deliveries/:id/problems', 'user', action((ctx, id, b) => D.reportProblem(ctx.db, id, b, ctx.user!)));
r.add('POST', '/api/deliveries/:id/cancel', 'admin', action((ctx, id, b) => D.cancelDelivery(ctx.db, id, b, ctx.user!)));
r.add('POST', '/api/deliveries/:id/reopen', 'admin', action((ctx, id, b) => D.reopenDelivery(ctx.db, id, b, ctx.user!)));

r.add('PATCH', '/api/problems/:id', 'admin', async (ctx) => {
  D.updateProblemNotes(ctx.db, intParam(ctx.params.id), await readJson(ctx));
  return { ok: true };
});
r.add('POST', '/api/problems/:id/resolve', 'admin', async (ctx) => {
  D.resolveProblem(ctx.db, intParam(ctx.params.id), await readJson(ctx), ctx.user!);
  return { ok: true };
});

r.add('PUT', '/api/routes', 'admin', async (ctx) => {
  D.saveRouteOrder(ctx.db, await readJson(ctx));
  return { ok: true };
});

// ---------------------------------------------------------------------------
// Fotos de comprovante: gravadas em disco fora da pasta pública, servidas só para quem tem acesso à entrega.

const IMAGE_TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { ext: 'webp', magic: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
};

r.add('POST', '/api/deliveries/:id/photos', 'user', async (ctx) => {
  const id = intParam(ctx.params.id);
  D.loadDelivery(ctx.db, id, ctx.user!); // escopo antes de ler o arquivo
  const mime = String(ctx.req.headers['content-type'] ?? '').split(';')[0]!.trim();
  const type = IMAGE_TYPES[mime];
  if (!type) throw badRequest('Formato de imagem não suportado. Use JPG, PNG ou WEBP.');
  const buf = await readBody(ctx.req, ctx.config.maxPhotoBytes);
  if (buf.length < 100 || !type.magic(buf)) throw badRequest('O arquivo enviado não é uma imagem válida.');
  const dir = path.join(ctx.config.dataDir, 'photos');
  fs.mkdirSync(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.${type.ext}`;
  fs.writeFileSync(path.join(dir, name), buf, { mode: 0o600 });
  const photoId = D.savePhoto(ctx.db, id, ctx.user!, { name, mime, size: buf.length });
  return { photo_id: photoId };
});

r.add('GET', '/api/photos/:id', 'user', (ctx) => {
  const p = ctx.db.prepare('SELECT * FROM photos WHERE id = ?').get(intParam(ctx.params.id)) as Row | undefined;
  if (!p) throw notFound('Foto não encontrada.');
  D.loadDelivery(ctx.db, p.delivery_id, ctx.user!); // entregador só vê fotos das suas entregas
  const file = path.join(ctx.config.dataDir, 'photos', path.basename(p.file_name));
  if (!fs.existsSync(file)) throw notFound('Arquivo da foto não encontrado.');
  ctx.res.writeHead(200, {
    'Content-Type': p.mime,
    'Content-Length': fs.statSync(file).size,
    'Cache-Control': 'private, max-age=3600',
    'Content-Disposition': 'inline',
  });
  fs.createReadStream(file).pipe(ctx.res);
  return undefined;
});

// ---------------------------------------------------------------------------
// Painel administrativo

r.add('GET', '/api/summary', 'admin', (ctx) => A.summary(ctx.db, ctx.config.timezone));
r.add('GET', '/api/notifications', 'admin', (ctx) => A.notifications(ctx.db, ctx.user!, ctx.config.timezone));
r.add('POST', '/api/notifications/seen', 'admin', (ctx) => {
  A.markNotificationsSeen(ctx.db, ctx.user!);
  return { ok: true };
});
r.add('GET', '/api/reports', 'admin', (ctx) => A.report(ctx.db, ctx.url.searchParams, ctx.config.timezone));

r.add('GET', '/api/drivers', 'admin', (ctx) => ({ drivers: A.listDrivers(ctx.db, ctx.url.searchParams, ctx.config.timezone) }));
r.add('POST', '/api/drivers', 'admin', async (ctx) => ({ id: A.createDriver(ctx.db, await readJson(ctx)) }));
r.add('PUT', '/api/drivers/:id', 'admin', async (ctx) => {
  A.updateDriver(ctx.db, intParam(ctx.params.id), await readJson(ctx));
  return { ok: true };
});
r.add('GET', '/api/vehicles', 'admin', (ctx) => ({ vehicles: A.listVehicles(ctx.db) }));
r.add('POST', '/api/vehicles', 'admin', async (ctx) => ({ id: A.createVehicle(ctx.db, await readJson(ctx)) }));
r.add('PUT', '/api/vehicles/:id', 'admin', async (ctx) => {
  A.updateVehicle(ctx.db, intParam(ctx.params.id), await readJson(ctx));
  return { ok: true };
});
r.add('GET', '/api/users', 'admin', (ctx) => ({ users: A.listUsers(ctx.db) }));
r.add('POST', '/api/users', 'admin', async (ctx) => ({ id: A.createUser(ctx.db, await readJson(ctx)) }));
r.add('PUT', '/api/users/:id', 'admin', async (ctx) => {
  A.updateUser(ctx.db, intParam(ctx.params.id), await readJson(ctx), ctx.user!);
  return { ok: true };
});
r.add('GET', '/api/settings', 'admin', (ctx) => A.getSettings(ctx.db));
r.add('PUT', '/api/settings', 'admin', async (ctx) => {
  A.saveSettings(ctx.db, await readJson(ctx));
  return A.getSettings(ctx.db);
});

r.add('POST', '/api/import/legacy', 'admin', async (ctx) => {
  const body = await readJson(ctx);
  return importLegacy(ctx.db, body.data, ctx.user!.id);
});

/** Exportação completa (cópia de segurança em JSON) — sem senhas nem sessões. */
r.add('GET', '/api/export', 'admin', (ctx) => {
  const tables = ['deliveries', 'delivery_items', 'delivery_events', 'delivery_problems', 'delivery_proofs', 'photos', 'drivers', 'vehicles', 'settings'];
  const out: Record<string, unknown> = { exported_at: new Date().toISOString() };
  for (const t of tables) out[t] = ctx.db.prepare(`SELECT * FROM ${t}`).all();
  ctx.res.setHeader('Content-Disposition', `attachment; filename="mercatto-entregas-${todayISO(ctx.config.timezone)}.json"`);
  return out;
});

export function requireAccess(ctx: Ctx, access: 'public' | 'user' | 'admin') {
  if (access === 'public') return;
  if (!ctx.user) throw new HttpError(401, 'Sua sessão expirou. Entre novamente.');
  if (access === 'admin' && ctx.user.role !== 'admin') throw forbidden();
}
