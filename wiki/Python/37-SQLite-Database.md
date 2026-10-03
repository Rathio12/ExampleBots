# SQLite Database

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square)

<sub>[Python portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Package** | [`aiosqlite`](https://github.com/omnilib/aiosqlite) |
| **Used in** | [03-expert database.py](../../python/03-expert/bot/database.py) |

Python's built-in `sqlite3` is blocking. `aiosqlite` wraps it in a background thread so queries don't freeze the bot.

```bash
pip install aiosqlite
```

## Connecting

```python
import aiosqlite
from pathlib import Path

Path("data").mkdir(exist_ok=True)
conn = await aiosqlite.connect("data/bot.db")
conn.row_factory = aiosqlite.Row          # rows behave like dicts: row["xp"]
await conn.execute("PRAGMA journal_mode = WAL")
await conn.execute("PRAGMA foreign_keys = ON")
```

Open it once in `setup_hook`, store it on the bot, and close it in `close()`.

## Queries

```python
await conn.execute("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, user_id INTEGER, text TEXT)")

cursor = await conn.execute("INSERT INTO notes (user_id, text) VALUES (?, ?)", (user_id, "Buy milk"))
await conn.commit()                                   # writes need a commit
new_id = cursor.lastrowid

async with conn.execute("SELECT * FROM notes WHERE id = ?", (new_id,)) as cur:
    row = await cur.fetchone()                        # Row or None

async with conn.execute("SELECT * FROM notes WHERE user_id = ?", (user_id,)) as cur:
    rows = await cur.fetchall()

async with conn.execute("SELECT COUNT(*) FROM notes") as cur:
    (count,) = await cur.fetchone()
```

**Always pass values as the second argument** (`?` placeholders). Never use f-strings with user input in SQL.

## Upsert

```python
await conn.execute(
    """INSERT INTO levels (guild_id, user_id, xp) VALUES (?, ?, ?)
       ON CONFLICT (guild_id, user_id) DO UPDATE SET xp = xp + excluded.xp""",
    (guild_id, user_id, 20),
)
await conn.commit()
```

## Transactions

```python
try:
    await conn.execute("UPDATE wallets SET coins = coins - ? WHERE user_id = ?", (50, sender))
    await conn.execute("UPDATE wallets SET coins = coins + ? WHERE user_id = ?", (50, receiver))
    await conn.commit()
except Exception:
    await conn.rollback()
    raise
```

## Migrations

```python
MIGRATIONS = [
    "CREATE TABLE levels (guild_id INTEGER, user_id INTEGER, xp INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (guild_id, user_id));",
    "ALTER TABLE levels ADD COLUMN last_message_at INTEGER;",
]

async def migrate(conn: aiosqlite.Connection) -> None:
    async with conn.execute("PRAGMA user_version") as cur:
        (current,) = await cur.fetchone()
    for version in range(current, len(MIGRATIONS)):
        await conn.executescript(f"BEGIN;\n{MIGRATIONS[version]}\nPRAGMA user_version = {version + 1};\nCOMMIT;")
```

## Repository pattern

```python
class WarningRepository:
    def __init__(self, conn: aiosqlite.Connection) -> None:
        self.conn = conn

    async def add(self, guild_id: int, user_id: int, moderator_id: int, reason: str) -> int:
        cursor = await self.conn.execute(
            "INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?)",
            (guild_id, user_id, moderator_id, reason, int(time.time())),
        )
        await self.conn.commit()
        return cursor.lastrowid

    async def list(self, guild_id: int, user_id: int) -> list[aiosqlite.Row]:
        async with self.conn.execute(
            "SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY id DESC", (guild_id, user_id)
        ) as cur:
            return list(await cur.fetchall())
```

The expert bot groups all repositories in one `Database` class: `bot.db.levels`, `bot.db.warnings`, `bot.db.tags`…

## Safe LIKE search (autocomplete)

```python
escaped = prefix.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
await conn.execute("SELECT name FROM tags WHERE guild_id = ? AND name LIKE ? ESCAPE '\\' LIMIT 25", (guild_id, escaped + "%"))
```

## Testing

```python
db = await Database.open(":memory:")   # fresh database per test
```

## Alternatives

| Need | Option |
|---|---|
| ORM | SQLAlchemy (async), Tortoise ORM, Piccolo |
| PostgreSQL | `asyncpg` |

## See also
- [Databases & Persistence](../Databases-and-Persistence.md) · [Testing](41-Testing.md)
