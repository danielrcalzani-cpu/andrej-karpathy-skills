import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DB } from './db.ts';
import { HttpError, sendJson } from './http.ts';
import type { Config, Ctx } from './http.ts';
import { SESSION_COOKIE, readCookie, sessionUser } from './auth.ts';
import { requireAccess, router } from './routes.ts';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  // no-referrer: links para Maps/Waze/WhatsApp não levam a URL interna do sistema.
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), microphone=()',
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://viacep.com.br; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
};

export function createApp(db: DB, config: Config, staticDir: string | null) {
  return async function handle(req: IncomingMessage, res: ServerResponse) {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';

    if (!url.pathname.startsWith('/api/')) return serveStatic(staticDir, url.pathname, res);

    try {
      // Proteção CSRF: requisições que alteram dados precisam do cabeçalho enviado pelo app.
      if (method !== 'GET' && method !== 'HEAD' && req.headers['x-requested-with'] !== 'mercatto') {
        throw new HttpError(403, 'Requisição não permitida.');
      }
      const match = router.match(method, url.pathname);
      if (match === null) throw new HttpError(404, 'Recurso não encontrado.');
      if (match === 'method') throw new HttpError(405, 'Método não permitido.');
      const ctx: Ctx = { req, res, url, params: match.params, user: sessionUser(db, readCookie(req, SESSION_COOKIE)), db, config };
      requireAccess(ctx, match.route.access);
      const result = await match.route.handler(ctx);
      if (result !== undefined && !res.headersSent) sendJson(res, 200, result);
    } catch (err) {
      if (res.headersSent) return res.end();
      if (err instanceof HttpError) {
        sendJson(res, err.status, { error: err.message, fields: err.fields });
      } else {
        // Registra só o erro técnico, sem dados pessoais do corpo da requisição.
        console.error(`[erro] ${method} ${url.pathname}:`, err instanceof Error ? err.stack : err);
        sendJson(res, 500, { error: 'Erro inesperado no servidor. Tente novamente em instantes.' });
      }
    }
  };
}

function serveStatic(dir: string | null, pathname: string, res: ServerResponse) {
  if (!dir) {
    res.writeHead(404).end();
    return;
  }
  // Versões: /pc/ (computador) e /m/ (celular); "/" escolhe automaticamente.
  if (pathname === '/pc' || pathname === '/m') {
    res.writeHead(301, { Location: `${pathname}/` }).end();
    return;
  }
  const safe = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(dir, safe);
  if (file.startsWith(dir) && fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(dir) || !fs.existsSync(file)) {
    const version = pathname.startsWith('/pc/') ? 'pc' : pathname.startsWith('/m/') ? 'm' : '';
    file = path.join(dir, version, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Execute "npm run build" para gerar a interface.');
    return;
  }
  const ext = path.extname(file);
  const immutable = file.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
}
