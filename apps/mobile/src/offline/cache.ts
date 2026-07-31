import * as SQLite from 'expo-sqlite';

/**
 * Lightweight key/value cache on expo-sqlite (NOT for tokens — those live in
 * the secure enclave). Used to serve last-known menu data when offline.
 */
let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('foodstra.db');
    db.execSync(
      'CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at INTEGER NOT NULL);',
    );
  }
  return db;
}

export function cacheSet(key: string, value: unknown): void {
  try {
    getDb().runSync(
      'INSERT OR REPLACE INTO kv (key, value, updated_at) VALUES (?, ?, ?);',
      key,
      JSON.stringify(value),
      Date.now(),
    );
  } catch {
    // best-effort cache
  }
}

export function cacheGet<T>(key: string): T | null {
  try {
    const row = getDb().getFirstSync<{ value: string }>(
      'SELECT value FROM kv WHERE key = ?;',
      key,
    );
    return row ? (JSON.parse(row.value) as T) : null;
  } catch {
    return null;
  }
}
