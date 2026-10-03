// Opens the SQLite database and applies migrations.
//
// Why better-sqlite3? It is synchronous, which sounds bad but is actually the
// fastest option for SQLite in Node: queries take microseconds and never wait
// on the network, so there is nothing to gain from async here.
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';

// Each entry is one migration. NEVER edit an old migration once it shipped —
// append a new one instead. SQLite's `user_version` remembers which ran.
const MIGRATIONS = [
  // 1: initial schema
  `
  CREATE TABLE levels (
    guild_id TEXT    NOT NULL,
    user_id  TEXT    NOT NULL,
    xp       INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE warnings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id     TEXT    NOT NULL,
    user_id      TEXT    NOT NULL,
    moderator_id TEXT    NOT NULL,
    reason       TEXT    NOT NULL,
    created_at   INTEGER NOT NULL
  );
  CREATE INDEX idx_warnings_member ON warnings (guild_id, user_id);

  CREATE TABLE reminders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT    NOT NULL,
    channel_id TEXT    NOT NULL,
    message    TEXT    NOT NULL,
    remind_at  INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_reminders_due ON reminders (remind_at);

  CREATE TABLE tags (
    guild_id   TEXT    NOT NULL,
    name       TEXT    NOT NULL,
    content    TEXT    NOT NULL,
    author_id  TEXT    NOT NULL,
    uses       INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, name)
  );

  CREATE TABLE guild_settings (
    guild_id            TEXT PRIMARY KEY,
    modlog_channel_id   TEXT,
    auditlog_channel_id TEXT
  );
  `,
];

function migrate(db, logger) {
  const current = db.pragma('user_version', { simple: true });
  for (let version = current; version < MIGRATIONS.length; version++) {
    // A transaction makes each migration all-or-nothing.
    db.transaction(() => {
      db.exec(MIGRATIONS[version]);
      db.pragma(`user_version = ${version + 1}`);
    })();
    logger.info(`Applied database migration ${version + 1}`);
  }
}

export function openDatabase(path, logger) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL'); // better concurrency + crash safety
  db.pragma('foreign_keys = ON');
  migrate(db, logger);
  return db;
}
