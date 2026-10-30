import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DB } from './db.ts';
import type { FieldErrors } from '../shared/domain.ts';

export interface SessionUser {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'driver';
  driver_id: number | null;
}

export interface Config {
  dataDir: string;
  timezone: string;
  cookieSecure: boolean;
  maxPhotoBytes: number;
}

export interface Ctx {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  params: Record<string, string>;
  user: SessionUser | null;
  db: DB;
  config: Config;
}

export class HttpError extends Error {
  status: number;
  fields?: FieldErrors;
  constructor(status: number, message: string, fields?: FieldErrors) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export const notFound = (what = 'Registro não encontrado.') => new HttpError(404, what);
export const forbidden = () => new HttpError(403, 'Você não tem permissão para esta ação.');
export const badRequest = (msg: string, fields?: FieldErrors) => new HttpError(400, msg, fields);

export function sendJson(res: ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(data),
  });
  res.end(data);
}

export function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length'] ?? 0);
    if (declared > limit) {
      reject(new HttpError(413, 'Arquivo ou conteúdo grande demais.'));
      req.resume();
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new HttpError(413, 'Arquivo ou conteúdo grande demais.'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function readJson(ctx: Ctx): Promise<Record<string, any>> {
  const buf = await readBody(ctx.req, 2 * 1024 * 1024);
  if (!buf.length) return {};
  const type = ctx.req.headers['content-type'] ?? '';
  if (!type.includes('application/json')) throw badRequest('Formato de envio inválido.');
  try {
    const parsed = JSON.parse(buf.toString('utf8'));
    if (parsed === null || typeof parsed !== 'object') throw new Error();
    return parsed;
  } catch {
    throw badRequest('Conteúdo inválido.');
  }
}

export type Access = 'public' | 'user' | 'admin';
export type Handler = (ctx: Ctx) => Promise<unknown> | unknown;
interface Route {
  method: string;
  regex: RegExp;
  keys: string[];
  access: Access;
  handler: Handler;
}

export class Router {
  routes: Route[] = [];
  add(method: string, pattern: string, access: Access, handler: Handler) {
    const keys: string[] = [];
    const regex = new RegExp(
      '^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$',
    );
    this.routes.push({ method, regex, keys, access, handler });
  }
  match(method: string, pathname: string): { route: Route; params: Record<string, string> } | 'method' | null {
    let pathMatched = false;
    for (const route of this.routes) {
      const m = route.regex.exec(pathname);
      if (!m) continue;
      pathMatched = true;
      if (route.method !== method) continue;
      const params: Record<string, string> = {};
      route.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]!)));
      return { route, params };
    }
    return pathMatched ? 'method' : null;
  }
}

export function intParam(v: string | undefined | null): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw notFound();
  return n;
}
