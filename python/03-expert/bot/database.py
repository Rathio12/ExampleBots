"""SQLite persistence with aiosqlite.

`Database.open()` connects, applies migrations and exposes one repository per
table. Commands never write SQL — they call e.g. `db.warnings.add(...)`.
Values are always bound with `?` placeholders, never formatted into SQL,
which prevents SQL injection.
"""
import logging
import time
from pathlib import Path

import aiosqlite

log = logging.getLogger(__name__)

# Each entry is one migration. NEVER edit a migration that already shipped —
# append a new one. SQLite's `user_version` pragma remembers which ones ran.
MIGRATIONS = [
    # 1: initial schema
    """
    CREATE TABLE levels (
        guild_id INTEGER NOT NULL,
        user_id  INTEGER NOT NULL,
        xp       INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE warnings (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id     INTEGER NOT NULL,
        user_id      INTEGER NOT NULL,
        moderator_id INTEGER NOT NULL,
        reason       TEXT    NOT NULL,
        created_at   INTEGER NOT NULL
    );
    CREATE INDEX idx_warnings_member ON warnings (guild_id, user_id);

    CREATE TABLE reminders (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER NOT NULL,
        channel_id INTEGER NOT NULL,
        message    TEXT    NOT NULL,
        remind_at  INTEGER NOT NULL,
        created_at INTEGER NOT NULL
    );
    CREATE INDEX idx_reminders_due ON reminders (remind_at);

    CREATE TABLE tags (
        guild_id   INTEGER NOT NULL,
        name       TEXT    NOT NULL,
        content    TEXT    NOT NULL,
        author_id  INTEGER NOT NULL,
        uses       INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (guild_id, name)
    );

    CREATE TABLE guild_settings (
        guild_id            INTEGER PRIMARY KEY,
        modlog_channel_id   INTEGER,
        auditlog_channel_id INTEGER
    );
    """,
]


def _now() -> int:
    return int(time.time())


async def _migrate(conn: aiosqlite.Connection) -> None:
    async with conn.execute("PRAGMA user_version") as cursor:
        (current,) = await cursor.fetchone()
    for version in range(current, len(MIGRATIONS)):
        # executescript runs the whole migration; BEGIN/COMMIT make it atomic.
        await conn.executescript(f"BEGIN;\n{MIGRATIONS[version]}\nPRAGMA user_version = {version + 1};\nCOMMIT;")
        log.info("Applied database migration %d", version + 1)


class LevelRepository:
    def __init__(self, conn: aiosqlite.Connection) -> None:
        self.conn = conn

    async def add_xp(self, guild_id: int, user_id: int, amount: int) -> int:
        """Adds XP and returns the new total."""
        await self.conn.execute(
            """INSERT INTO levels (guild_id, user_id, xp) VALUES (?, ?, ?)
               ON CONFLICT (guild_id, user_id) DO UPDATE SET xp = xp + excluded.xp""",
            (guild_id, user_id, amount),
        )
        await self.conn.commit()
        return await self.get_xp(guild_id, user_id)

    async def get_xp(self, guild_id: int, user_id: int) -> int:
        async with self.conn.execute("SELECT xp FROM levels WHERE guild_id = ? AND user_id = ?", (guild_id, user_id)) as cur:
            row = await cur.fetchone()
        return row["xp"] if row else 0

    async def get_rank(self, guild_id: int, xp: int) -> int:
        async with self.conn.execute("SELECT COUNT(*) + 1 FROM levels WHERE guild_id = ? AND xp > ?", (guild_id, xp)) as cur:
            (rank,) = await cur.fetchone()
        return rank

    async def get_top(self, guild_id: int, limit: int, offset: int = 0) -> list[aiosqlite.Row]:
        async with self.conn.execute(
            "SELECT user_id, xp FROM levels WHERE guild_id = ? ORDER BY xp DESC LIMIT ? OFFSET ?",
            (guild_id, limit, offset),
        ) as cur:
            return list(await cur.fetchall())

    async def count(self, guild_id: int) -> int:
        async with self.conn.execute("SELECT COUNT(*) FROM levels WHERE guild_id = ?", (guild_id,)) as cur:
            (total,) = await cur.fetchone()
        return total


class WarningRepository:
    def __init__(self, conn: aiosqlite.Connection) -> None:
        self.conn = conn

    async def add(self, guild_id: int, user_id: int, moderator_id: int, reason: str) -> int:
        cursor = await self.conn.execute(
            "INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?)",
            (guild_id, user_id, moderator_id, reason, _now()),
        )
        await self.conn.commit()
        return cursor.lastrowid

    async def list(self, guild_id: int, user_id: int) -> list[aiosqlite.Row]:
        async with self.conn.execute(
            "SELECT id, moderator_id, reason, created_at FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY id DESC",
            (guild_id, user_id),
        ) as cur:
            return list(await cur.fetchall())

    async def clear(self, guild_id: int, user_id: int) -> int:
        cursor = await self.conn.execute("DELETE FROM warnings WHERE guild_id = ? AND user_id = ?", (guild_id, user_id))
        await self.conn.commit()
        return cursor.rowcount


class ReminderRepository:
    def __init__(self, conn: aiosqlite.Connection) -> None:
        self.conn = conn

    async def add(self, user_id: int, channel_id: int, message: str, remind_at: int) -> int:
        cursor = await self.conn.execute(
            "INSERT INTO reminders (user_id, channel_id, message, remind_at, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, channel_id, message, remind_at, _now()),
        )
        await self.conn.commit()
        return cursor.lastrowid

    async def due(self, timestamp: int | None = None) -> list[aiosqlite.Row]:
        async with self.conn.execute(
            "SELECT id, user_id, channel_id, message, created_at FROM reminders WHERE remind_at <= ? ORDER BY remind_at LIMIT 50",
            (timestamp if timestamp is not None else _now(),),
        ) as cur:
            return list(await cur.fetchall())

    async def list_for_user(self, user_id: int) -> list[aiosqlite.Row]:
        async with self.conn.execute(
            "SELECT id, message, remind_at FROM reminders WHERE user_id = ? ORDER BY remind_at", (user_id,)
        ) as cur:
            return list(await cur.fetchall())

    async def count_for_user(self, user_id: int) -> int:
        async with self.conn.execute("SELECT COUNT(*) FROM reminders WHERE user_id = ?", (user_id,)) as cur:
            (total,) = await cur.fetchone()
        return total

    async def remove(self, reminder_id: int) -> None:
        await self.conn.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
        await self.conn.commit()

    async def remove_for_user(self, reminder_id: int, user_id: int) -> bool:
        """Only deletes the reminder if it belongs to the user."""
        cursor = await self.conn.execute("DELETE FROM reminders WHERE id = ? AND user_id = ?", (reminder_id, user_id))
        await self.conn.commit()
        return cursor.rowcount > 0


class TagRepository:
    def __init__(self, conn: aiosqlite.Connection) -> None:
        self.conn = conn

    async def get(self, guild_id: int, name: str) -> aiosqlite.Row | None:
        async with self.conn.execute(
            "SELECT name, content, author_id, uses FROM tags WHERE guild_id = ? AND name = ?", (guild_id, name)
        ) as cur:
            return await cur.fetchone()

    async def create(self, guild_id: int, name: str, content: str, author_id: int) -> bool:
        """Returns False if a tag with that name already exists."""
        cursor = await self.conn.execute(
            "INSERT INTO tags (guild_id, name, content, author_id, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
            (guild_id, name, content, author_id, _now()),
        )
        await self.conn.commit()
        return cursor.rowcount > 0

    async def remove(self, guild_id: int, name: str) -> bool:
        cursor = await self.conn.execute("DELETE FROM tags WHERE guild_id = ? AND name = ?", (guild_id, name))
        await self.conn.commit()
        return cursor.rowcount > 0

    async def use(self, guild_id: int, name: str) -> None:
        await self.conn.execute("UPDATE tags SET uses = uses + 1 WHERE guild_id = ? AND name = ?", (guild_id, name))
        await self.conn.commit()

    async def search(self, guild_id: int, prefix: str, limit: int = 25) -> list[str]:
        """Prefix search for autocomplete. LIKE wildcards in user input are escaped."""
        escaped = prefix.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        async with self.conn.execute(
            "SELECT name FROM tags WHERE guild_id = ? AND name LIKE ? ESCAPE '\\' ORDER BY uses DESC LIMIT ?",
            (guild_id, f"{escaped}%", limit),
        ) as cur:
            return [row["name"] for row in await cur.fetchall()]

    async def list(self, guild_id: int) -> list[aiosqlite.Row]:
        async with self.conn.execute("SELECT name, uses FROM tags WHERE guild_id = ? ORDER BY name", (guild_id,)) as cur:
            return list(await cur.fetchall())


class SettingsRepository:
    """Guild settings, cached in memory because the audit log reads them on every event."""

    def __init__(self, conn: aiosqlite.Connection) -> None:
        self.conn = conn
        self._cache: dict[int, dict[str, int | None]] = {}

    async def get(self, guild_id: int) -> dict[str, int | None]:
        if guild_id not in self._cache:
            async with self.conn.execute(
                "SELECT modlog_channel_id, auditlog_channel_id FROM guild_settings WHERE guild_id = ?", (guild_id,)
            ) as cur:
                row = await cur.fetchone()
            self._cache[guild_id] = {
                "modlog_channel_id": row["modlog_channel_id"] if row else None,
                "auditlog_channel_id": row["auditlog_channel_id"] if row else None,
            }
        return self._cache[guild_id]

    async def _set(self, column: str, guild_id: int, channel_id: int | None) -> None:
        # `column` comes from our own code (never from users), so formatting it is safe.
        await self.conn.execute(
            f"""INSERT INTO guild_settings (guild_id, {column}) VALUES (?, ?)
                ON CONFLICT (guild_id) DO UPDATE SET {column} = excluded.{column}""",
            (guild_id, channel_id),
        )
        await self.conn.commit()
        self._cache.pop(guild_id, None)

    async def set_modlog_channel(self, guild_id: int, channel_id: int | None) -> None:
        await self._set("modlog_channel_id", guild_id, channel_id)

    async def set_auditlog_channel(self, guild_id: int, channel_id: int | None) -> None:
        await self._set("auditlog_channel_id", guild_id, channel_id)


class Database:
    def __init__(self, conn: aiosqlite.Connection) -> None:
        self.conn = conn
        self.levels = LevelRepository(conn)
        self.warnings = WarningRepository(conn)
        self.reminders = ReminderRepository(conn)
        self.tags = TagRepository(conn)
        self.settings = SettingsRepository(conn)

    @classmethod
    async def open(cls, path: str) -> "Database":
        if path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        conn = await aiosqlite.connect(path)
        conn.row_factory = aiosqlite.Row  # rows behave like dicts: row["xp"]
        await conn.execute("PRAGMA journal_mode = WAL")
        await conn.execute("PRAGMA foreign_keys = ON")
        await _migrate(conn)
        return cls(conn)

    async def ping(self) -> None:
        async with self.conn.execute("SELECT 1"):
            pass

    async def close(self) -> None:
        await self.conn.close()
