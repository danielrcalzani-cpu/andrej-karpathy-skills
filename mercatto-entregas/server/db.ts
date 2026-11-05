import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export type DB = DatabaseSync;
export type Row = Record<string, any>;

/** Migrações em ordem. Nunca altere uma migração já publicada; acrescente uma nova. */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

  CREATE TABLE vehicles (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    plate TEXT,
    type TEXT,
    capacity_kg REAL CHECK (capacity_kg IS NULL OR capacity_kg >= 0),
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE drivers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
    driver_id INTEGER REFERENCES drivers(id),
    active INTEGER NOT NULL DEFAULT 1,
    last_seen_event_id INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    CHECK (role = 'admin' OR driver_id IS NOT NULL)
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE deliveries (
    id INTEGER PRIMARY KEY,
    customer_name TEXT NOT NULL,
    receiver_whatsapp TEXT,
    salesperson TEXT,
    order_number TEXT,
    postal_code TEXT,
    street TEXT,
    address_number TEXT,
    address_complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    reference_point TEXT,
    address_text TEXT,
    materials_notes TEXT,
    delivery_date TEXT,
    delivery_period TEXT CHECK (delivery_period IS NULL OR delivery_period IN ('manha','tarde','noite','combinado','a_definir')),
    scheduled_start_time TEXT,
    scheduled_end_time TEXT,
    driver_id INTEGER REFERENCES drivers(id),
    urgency TEXT CHECK (urgency IS NULL OR urgency IN ('alta','media','baixa')),
    material_separated INTEGER NOT NULL DEFAULT 0,
    -- Derivado dos itens/flag; mantido pelo servidor para permitir filtros.
    is_prepared INTEGER NOT NULL DEFAULT 0,
    prep_exception_reason TEXT,
    prepared_by INTEGER REFERENCES users(id),
    prepared_at TEXT,
    exec_status TEXT NOT NULL DEFAULT 'pendente' CHECK (exec_status IN ('pendente','em_rota','entregue','problema','cancelada')),
    status TEXT NOT NULL,
    driver_notes TEXT,
    internal_notes TEXT,
    route_position INTEGER,
    legacy_situacao TEXT,
    legacy_data TEXT,
    client_request_id TEXT UNIQUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT
  );
  CREATE INDEX idx_deliveries_date ON deliveries(delivery_date);
  CREATE INDEX idx_deliveries_driver_date ON deliveries(driver_id, delivery_date);
  CREATE INDEX idx_deliveries_status ON deliveries(status);
  CREATE INDEX idx_deliveries_order ON deliveries(order_number);

  CREATE TABLE delivery_items (
    id INTEGER PRIMARY KEY,
    delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
    position INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    quantity REAL NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL,
    package_count INTEGER CHECK (package_count IS NULL OR package_count >= 0),
    weight_kg REAL CHECK (weight_kg IS NULL OR weight_kg >= 0),
    prepared INTEGER NOT NULL DEFAULT 0,
    prepared_by INTEGER REFERENCES users(id),
    prepared_at TEXT,
    checked INTEGER NOT NULL DEFAULT 0,
    checked_by INTEGER REFERENCES users(id),
    checked_at TEXT,
    loaded INTEGER NOT NULL DEFAULT 0,
    loaded_by INTEGER REFERENCES users(id),
    loaded_at TEXT
  );
  CREATE INDEX idx_items_delivery ON delivery_items(delivery_id);

  CREATE TABLE photos (
    id INTEGER PRIMARY KEY,
    delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
    file_name TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    uploaded_at TEXT NOT NULL
  );

  CREATE TABLE delivery_proofs (
    id INTEGER PRIMARY KEY,
    delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
    receiver_name TEXT NOT NULL,
    photo_id INTEGER REFERENCES photos(id),
    notes TEXT,
    completed_by INTEGER NOT NULL REFERENCES users(id),
    completed_at TEXT NOT NULL
  );
  CREATE INDEX idx_proofs_delivery ON delivery_proofs(delivery_id);

  CREATE TABLE delivery_problems (
    id INTEGER PRIMARY KEY,
    delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
    problem_type TEXT NOT NULL,
    description TEXT,
    reported_by INTEGER NOT NULL REFERENCES users(id),
    reported_at TEXT NOT NULL,
    admin_notes TEXT,
    resolved_at TEXT,
    resolved_by INTEGER REFERENCES users(id),
    resolution_notes TEXT
  );
  CREATE INDEX idx_problems_delivery ON delivery_problems(delivery_id);

  -- Histórico completo: mudanças de status, reagendamentos, conferências, exceções, etc.
  CREATE TABLE delivery_events (
    id INTEGER PRIMARY KEY,
    delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
    type TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    details TEXT,
    reason TEXT,
    changed_by INTEGER REFERENCES users(id),
    changed_at TEXT NOT NULL
  );
  CREATE INDEX idx_events_delivery ON delivery_events(delivery_id);
  `,
  `
  -- Várias fotos por comprovante. A coluna photo_id de delivery_proofs continua com a primeira foto.
  CREATE TABLE proof_photos (
    proof_id INTEGER NOT NULL REFERENCES delivery_proofs(id),
    photo_id INTEGER NOT NULL REFERENCES photos(id),
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (proof_id, photo_id)
  );
  INSERT INTO proof_photos (proof_id, photo_id, position) SELECT id, photo_id, 0 FROM delivery_proofs WHERE photo_id IS NOT NULL;
  `,
];

export function openDatabase(dataDir: string): DB {
  fs.mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, 'mercatto.sqlite');
  const existed = fs.existsSync(file);
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  migrate(db, dataDir, existed);
  return db;
}

export function openMemoryDatabase(): DB {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  migrate(db, null, false);
  return db;
}

function migrate(db: DB, dataDir: string | null, existed: boolean) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
  const current = (db.prepare('SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations').get() as Row).v as number;
  if (current >= MIGRATIONS.length) return;
  // Cópia de segurança antes de alterar um banco que já tem dados.
  if (dataDir && existed && current > 0) {
    const dir = path.join(dataDir, 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, `antes-migracao-${current + 1}-${Date.now()}.sqlite`);
    db.prepare('VACUUM INTO ?').run(target);
  }
  for (let v = current + 1; v <= MIGRATIONS.length; v++) {
    transaction(db, () => {
      db.exec(MIGRATIONS[v - 1]!);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(v, new Date().toISOString());
    });
  }
}

export function transaction<T>(db: DB, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export const now = () => new Date().toISOString();
