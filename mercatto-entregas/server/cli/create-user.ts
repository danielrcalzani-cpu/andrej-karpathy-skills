// Uso: npm run create-user -- <usuario> <senha> "<Nome>" [admin|driver] [id_entregador]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase, now } from '../db.ts';
import { hashPassword, validatePassword } from '../auth.ts';
import { loadEnvFile } from '../env.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
loadEnvFile(path.join(root, '.env'));
const [username, password, name, role = 'admin', driverId] = process.argv.slice(2);
if (!username || !password || !name) {
  console.error('Uso: npm run create-user -- <usuario> <senha> "<Nome>" [admin|driver] [id_entregador]');
  process.exit(1);
}
const err = validatePassword(password);
if (err) {
  console.error(err);
  process.exit(1);
}
const db = openDatabase(path.resolve(root, process.env.DATA_DIR || './data'));
db.prepare('INSERT INTO users (name, username, password_hash, role, driver_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
  name,
  username.toLowerCase(),
  hashPassword(password),
  role === 'driver' ? 'driver' : 'admin',
  role === 'driver' ? Number(driverId) : null,
  now(),
);
console.log(`Usuário "${username}" criado.`);
