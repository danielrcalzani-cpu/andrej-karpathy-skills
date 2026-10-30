import crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { DB, Row } from './db.ts';
import { now } from './db.ts';
import type { SessionUser } from './http.ts';

const SESSION_DAYS = 30;
export const SESSION_COOKIE = 'mercatto_sid';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

export function validatePassword(p: unknown): string | null {
  if (typeof p !== 'string' || p.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  if (p.length > 200) return 'Senha longa demais.';
  return null;
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export function createSession(db: DB, userId: number): { token: string; maxAge: number } {
  const token = crypto.randomBytes(32).toString('base64url');
  const maxAge = SESSION_DAYS * 24 * 3600;
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
    sha256(token),
    userId,
    new Date(Date.now() + maxAge * 1000).toISOString(),
    now(),
  );
  // Limpeza oportunista de sessões expiradas.
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now());
  return { token, maxAge };
}

export function destroySession(db: DB, token: string) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function readCookie(req: IncomingMessage, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function sessionUser(db: DB, token: string | null): SessionUser | null {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.username, u.role, u.driver_id FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`,
    )
    .get(sha256(token), now()) as Row | undefined;
  return row ? (row as SessionUser) : null;
}

export function sessionCookie(token: string, maxAge: number, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

// Limite simples de tentativas de login (memória do processo).
const attempts = new Map<string, { count: number; until: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function loginBlocked(key: string): boolean {
  const a = attempts.get(key);
  return !!a && a.until > Date.now() && a.count >= MAX_ATTEMPTS;
}
export function registerLoginFailure(key: string) {
  const a = attempts.get(key);
  if (!a || a.until < Date.now()) attempts.set(key, { count: 1, until: Date.now() + WINDOW_MS });
  else a.count++;
}
export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
