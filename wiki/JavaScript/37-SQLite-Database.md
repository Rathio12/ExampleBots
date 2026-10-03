# SQLite Database

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square)

<sub>[JavaScript portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Package** | [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) |
| **Used in** | [03-expert/src/database/](../../javascript/03-expert/src/database) |

`better-sqlite3` is the fastest SQLite driver for Node. It's **synchronous**: queries return values directly. With a local database that's faster and simpler than async.

```bash
npm install better-sqlite3
```

## Opening a database

```js
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';

mkdirSync('./data', { recursive: true });
const db = new Database('./data/bot.db');
db.pragma('journal_mode = WAL');    // better concurrency and crash safety
db.pragma('foreign_keys = ON');
```

## Queries

```js
db.exec(`CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, text TEXT NOT NULL)`);

const insert = db.prepare('INSERT INTO notes (user_id, text) VALUES (?, ?)');   // prepare once
const info = insert.run(userId, 'Buy milk');       // { changes: 1, lastInsertRowid: 1 }

const one = db.prepare('SELECT * FROM notes WHERE id = ?').get(1);          // object or undefined
const many = db.prepare('SELECT * FROM notes WHERE user_id = ?').all(userId);   // array
const count = db.prepare('SELECT COUNT(*) AS n FROM notes').get().n;

// Named parameters
db.prepare('UPDATE notes SET text = @text WHERE id = @id').run({ id: 1, text: 'Buy oat milk' });

// Single value
const total = db.prepare('SELECT SUM(xp) FROM levels WHERE guild_id = ?').pluck().get(guildId);
```

| Method | Returns |
|---|---|
| `.run(...)` | `{ changes, lastInsertRowid }` |
| `.get(...)` | First row or `undefined` |
| `.all(...)` | Array of rows |
| `.iterate(...)` | Iterator (large results) |
| `.pluck()` | Return only the first column |

**Always use `?` or named parameters.** Never build SQL with template strings containing user input.

## Upsert with RETURNING

```js
const addXp = db.prepare(`
  INSERT INTO levels (guild_id, user_id, xp) VALUES (?, ?, ?)
  ON CONFLICT (guild_id, user_id) DO UPDATE SET xp = xp + excluded.xp
  RETURNING xp`);
const newTotal = addXp.get(guildId, userId, 20).xp;
```

## Transactions

```js
const transfer = db.transaction((from, to, amount) => {
  db.prepare('UPDATE wallets SET coins = coins - ? WHERE user_id = ?').run(amount, from);
  db.prepare('UPDATE wallets SET coins = coins + ? WHERE user_id = ?').run(amount, to);
});
transfer(userA, userB, 50);   // all or nothing: an exception rolls back
```

Transactions also make bulk inserts dramatically faster.

## Migrations

```js
const MIGRATIONS = [
  `CREATE TABLE levels (guild_id TEXT, user_id TEXT, xp INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (guild_id, user_id));`,
  `ALTER TABLE levels ADD COLUMN last_message_at INTEGER;`,
];

const current = db.pragma('user_version', { simple: true });
for (let v = current; v < MIGRATIONS.length; v++) {
  db.transaction(() => {
    db.exec(MIGRATIONS[v]);
    db.pragma(`user_version = ${v + 1}`);
  })();
}
```

## Repository pattern

```js
export function createTagRepository(db) {
  const get = db.prepare('SELECT * FROM tags WHERE guild_id = ? AND name = ?');
  const create = db.prepare('INSERT INTO tags (guild_id, name, content) VALUES (?, ?, ?) ON CONFLICT DO NOTHING');
  return {
    get: (guildId, name) => get.get(guildId, name),
    create: (guildId, name, content) => create.run(guildId, name, content).changes > 0,
  };
}
```

See the expert bot's [`repositories.js`](../../javascript/03-expert/src/database/repositories.js) for the full set.

## Testing with an in-memory database

```js
const db = new Database(':memory:');   // fresh, empty, disappears when closed
```

## Store IDs as TEXT

Discord IDs exceed JavaScript's safe integer range (2⁵³). Store them as `TEXT`, which is how discord.js represents them anyway.

## Closing

```js
process.on('SIGTERM', () => { db.close(); process.exit(0); });
```

## Alternatives

| Need | Option |
|---|---|
| No native dependency | `node:sqlite` (built into recent Node versions) |
| ORM with migrations | Drizzle, Prisma, Kysely |
| PostgreSQL | `pg`, `postgres`, or an ORM |

## See also
- [Databases & Persistence](../Databases-and-Persistence.md) · [Autocomplete](08-Autocomplete.md) · [Testing](41-Testing.md)
