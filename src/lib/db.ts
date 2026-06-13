import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'geotask.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT,
    latitude    REAL    NOT NULL,
    longitude   REAL    NOT NULL,
    category    TEXT    NOT NULL DEFAULT 'other',
    priority    TEXT    NOT NULL DEFAULT 'medium',
    radius      INTEGER NOT NULL DEFAULT 200,
    completed   INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
  )
`);

export default db;
