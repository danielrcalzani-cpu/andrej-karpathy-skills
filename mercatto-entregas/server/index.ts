import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase, now } from './db.ts';
import type { Row } from './db.ts';
import { hashPassword, validatePassword } from './auth.ts';
import { createApp } from './app.ts';
import { DEFAULT_TIMEZONE } from '../shared/domain.ts';
import { loadEnvFile } from './env.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnvFile(path.join(root, '.env'));

const config = {
  dataDir: path.resolve(root, process.env.DATA_DIR || './data'),
  timezone: process.env.APP_TIMEZONE || DEFAULT_TIMEZONE,
  cookieSecure: process.env.COOKIE_SECURE === '1',
  maxPhotoBytes: (Number(process.env.MAX_PHOTO_MB) || 8) * 1024 * 1024,
};

const db = openDatabase(config.dataDir);

// Primeiro acesso: cria o administrador a partir das variáveis de ambiente.
const users = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as Row).n;
if (!users) {
  const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const err = validatePassword(password);
  if (err) {
    console.error(`Nenhum usuário cadastrado. Defina ADMIN_PASSWORD (mín. 8 caracteres) no .env ou use "npm run create-user". ${err}`);
    process.exit(1);
  }
  db.prepare("INSERT INTO users (name, username, password_hash, role, created_at) VALUES (?, ?, ?, 'admin', ?)").run(
    process.env.ADMIN_NAME || 'Administrador',
    username,
    hashPassword(password),
    now(),
  );
  console.log(`Administrador "${username}" criado.`);
}

const staticDir = process.env.NODE_ENV === 'production' ? path.join(root, 'dist') : null;
const port = Number(process.env.PORT) || 3000;
http.createServer(createApp(db, config, staticDir)).listen(port, () => {
  console.log(`Mercatto Entregas rodando em http://localhost:${port} (fuso ${config.timezone})`);
});
