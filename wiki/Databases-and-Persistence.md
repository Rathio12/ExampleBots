# Databases & Persistence

Everything in memory disappears when the bot restarts. As soon as you store warnings, XP, settings or reminders, you need a database.

## Which database?

| Option | Good for | Notes |
|---|---|---|
| JSON file | Toy projects | Corrupts on concurrent writes or crashes. **Avoid** past the first week. |
| **SQLite** | Almost every bot (used by the examples) | A single file, no server, transactional, handles thousands of writes per second |
| PostgreSQL | Big or sharded bots, multiple processes | Needs a server, but scales very far |
| Redis | Caches, cooldowns, cross-process state | In-memory. Pair it with a real database. |
| MongoDB | Document-shaped data | Popular in tutorials. A relational DB is usually simpler for bot data. |

Start with SQLite. Moving to PostgreSQL later is mostly a driver change if you keep SQL in repositories.

## Drivers used in the examples

| Language | Library | Style |
|---|---|---|
| JavaScript | [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) | Synchronous (fastest for SQLite) |
| Python | [`aiosqlite`](https://github.com/omnilib/aiosqlite) | Async wrapper around `sqlite3` |
| C# | [`Microsoft.Data.Sqlite`](https://learn.microsoft.com/dotnet/standard/data/sqlite/) | ADO.NET, async methods |

## The schema

All three expert bots share this schema:

```sql
CREATE TABLE levels         (guild_id, user_id, xp, PRIMARY KEY (guild_id, user_id));
CREATE TABLE warnings       (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id, user_id, moderator_id, reason, created_at);
CREATE TABLE reminders      (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id, channel_id, message, remind_at, created_at);
CREATE TABLE tags           (guild_id, name, content, author_id, uses, created_at, PRIMARY KEY (guild_id, name));
CREATE TABLE guild_settings (guild_id PRIMARY KEY, modlog_channel_id, auditlog_channel_id);
```

Notice that **everything is scoped by `guild_id`**. A bot is in many servers, and data from one must never leak into another.

## Migrations

Your schema will change. Migrations are numbered scripts that run once, in order. SQLite has a built-in counter, `PRAGMA user_version`, which the examples use:

```js
const MIGRATIONS = [
  `CREATE TABLE levels (...); CREATE TABLE warnings (...);`,   // version 1
  `ALTER TABLE warnings ADD COLUMN expires_at INTEGER;`,       // version 2 (future)
];

const current = db.pragma('user_version', { simple: true });
for (let v = current; v < MIGRATIONS.length; v++) {
  db.transaction(() => {
    db.exec(MIGRATIONS[v]);
    db.pragma(`user_version = ${v + 1}`);
  })();
}
```

Rule: **never edit a migration that has already run anywhere.** Append a new one.

## Repositories

Keep SQL out of commands. A repository exposes intention-revealing methods:

```js
repos.warnings.add(guildId, userId, moderatorId, reason);
repos.levels.addXp(guildId, userId, 20);
repos.tags.search(guildId, 'ru');
```

Benefits: commands stay readable, SQL lives in one place, and you can test repositories against an in-memory database (all three expert bots do).

## Upserts

"Insert, or update if it exists" in one statement:

```sql
INSERT INTO levels (guild_id, user_id, xp) VALUES (?, ?, ?)
ON CONFLICT (guild_id, user_id) DO UPDATE SET xp = xp + excluded.xp
RETURNING xp;
```

`excluded` refers to the row you tried to insert. `RETURNING` gives back the new total without a second query.

## Never build SQL with string concatenation

```js
// ❌ SQL injection: a tag named  x'; DROP TABLE tags; --  ruins your day
db.exec(`SELECT * FROM tags WHERE name = '${name}'`);

// ✅ parameters are sent separately from the SQL
db.prepare('SELECT * FROM tags WHERE name = ?').get(name);
```

```python
await conn.execute("SELECT * FROM tags WHERE name = ?", (name,))
```

```csharp
command.CommandText = "SELECT * FROM tags WHERE name = $name";
command.Parameters.AddWithValue("$name", name);
```

**`LIKE` wildcards:** even with parameters, `%` and `_` in user input act as wildcards inside `LIKE`. The tag search escapes them (`ESCAPE '\'`), and a test checks that searching for `%` returns nothing.

## Storing Discord IDs

| Language | Store as | Why |
|---|---|---|
| JavaScript | `TEXT` | JS numbers lose precision above 2⁵³, and snowflakes are bigger |
| Python | `INTEGER` | Python ints are arbitrary-precision |
| C# | `INTEGER`, cast `(long)ulong` | SQLite integers are signed 64-bit. Snowflakes fit for decades. |

## Timestamps

Store **Unix seconds** (UTC). They sort correctly, compare cheaply (`remind_at <= ?`), and plug straight into Discord's `<t:...>` tags.

## Caching hot data

The audit log reads guild settings on **every** event. The expert bots cache settings in memory and invalidate on change:

```js
get(guildId) {
  if (!cache.has(guildId)) cache.set(guildId, stmt.get(guildId) ?? defaults);
  return cache.get(guildId);
},
setAuditlogChannel(guildId, channelId) {
  upsert.run(guildId, channelId);
  cache.delete(guildId);   // next read reloads it
},
```

## SQLite settings worth knowing

- `PRAGMA journal_mode = WAL`: readers don't block writers, and it's safer on crashes. Enabled in all examples.
- `PRAGMA foreign_keys = ON`: enforce foreign keys (off by default in SQLite).
- Indexes: add one for every column you filter on a lot (`idx_reminders_due ON reminders(remind_at)`).

## Backups

The database file **is** your data. Back it up:

```bash
sqlite3 data/bot.db ".backup 'backups/bot-$(date +%F).db'"
```

`.backup` is safe while the bot is running (copying the file directly during a write is not). See [Deployment & Hosting](Deployment-and-Hosting.md#backups).

## When to move to PostgreSQL

- You run more than one bot process (shards in separate processes, a web dashboard writing data).
- Data grows into many gigabytes.
- You need advanced queries or full-text search at scale.

Popular choices: `pg`/Prisma/Drizzle (JS), `asyncpg`/SQLAlchemy (Python), Npgsql/EF Core/Dapper (C#).
