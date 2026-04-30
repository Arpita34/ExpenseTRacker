const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'expenses.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema migration
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    amount           INTEGER NOT NULL CHECK(amount > 0),
    category         TEXT    NOT NULL,
    description      TEXT    NOT NULL,
    date             TEXT    NOT NULL,
    client_request_id TEXT   UNIQUE NOT NULL,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_date       ON expenses(date DESC);
  CREATE INDEX IF NOT EXISTS idx_expenses_category   ON expenses(category);
  CREATE INDEX IF NOT EXISTS idx_expenses_client_req ON expenses(client_request_id);
`);

console.log(`✅ SQLite connected — DB at: ${DB_PATH}`);

module.exports = db;
