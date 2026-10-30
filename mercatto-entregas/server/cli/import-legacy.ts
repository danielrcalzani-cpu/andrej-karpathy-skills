// Uso: npm run import-legacy -- caminho/para/agenda-antiga.json
// Pode ser executado mais de uma vez: registros já importados são ignorados.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from '../db.ts';
import { importLegacy } from '../legacy.ts';
import { loadEnvFile } from '../env.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
loadEnvFile(path.join(root, '.env'));
const file = process.argv[2];
if (!file) {
  console.error('Uso: npm run import-legacy -- caminho/para/agenda-antiga.json');
  process.exit(1);
}
const db = openDatabase(path.resolve(root, process.env.DATA_DIR || './data'));
const result = importLegacy(db, JSON.parse(fs.readFileSync(file, 'utf8')), null);
console.log(JSON.stringify(result, null, 2));
