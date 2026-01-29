import Database from "better-sqlite3";
import path from "path";

let db: Database.Database;

export function getDB() {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "user_data.db");
  db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        identifier TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_category_identifier ON records(category, identifier);
  `);

  return db;
}
