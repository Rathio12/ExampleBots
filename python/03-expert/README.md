# Python · Expert Bot

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white)](https://discordpy.readthedocs.io)
[![SQLite](https://img.shields.io/badge/SQLite-aiosqlite-003B57?logo=sqlite&logoColor=white)](https://github.com/omnilib/aiosqlite)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](Dockerfile)
![Tier](https://img.shields.io/badge/tier-expert-ED4245)

A production-style moderation, audit-log and community bot. `ExpertBot` is the composition root. It owns the database, mod-log and audit-log services, and every cog reaches them through `self.bot`.

## Features

**Moderation**: `/warn`, `/warnings`, `/clearwarnings`, `/timeout`, `/untimeout`, `/kick`, `/ban`, `/unban`, `/purge`. Commands use `default_permissions`, `bot_has_permissions` and role-hierarchy checks, and write to a mod-log channel.

**Audit log** ([cogs/audit.py](bot/cogs/audit.py)): message edits/deletes with content (including uncached deletes via raw events), bulk deletes with a transcript file, joins with new-account warnings, leaves and kick detection, nickname/role/timeout changes with the moderator, bans/unbans, channel and role changes with permission diffs, and voice join/leave/move.

**Community**: XP and levels, `/rank`, a paginated `/leaderboard` (buttons), `/remind` (persistent, `tasks.loop` scheduler), and `/tag` with autocomplete.

**Context menus**: **Show Rank** (user) and **Bookmark** (message).

**Engineering**: aiosqlite with migrations, JSON logging in production, SIGTERM handling, and pytest suites (no plugins needed).

## Before you start

Enable **Server Members Intent** and **Message Content Intent** in the Developer Portal (your app → Bot → Privileged Gateway Intents). The bot needs View Audit Log, Kick/Ban/Moderate Members, Manage Messages, Read Message History, Send Messages, Embed Links and Attach Files.

## Run

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python -m bot
```

Then in Discord: `/settings modlog channel:#mod-log` and `/settings auditlog channel:#audit-log`.

### Docker

```bash
docker compose up -d --build
```

### Tests and lint

```bash
pip install -r requirements-dev.txt
pytest
ruff check .
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `DISCORD_TOKEN` | — | Bot token (required) |
| `GUILD_ID` | — | Sync commands to one server instantly |
| `DATABASE_PATH` | `./data/bot.db` | SQLite file location |
| `LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `ENVIRONMENT` | `development` | `production` switches to JSON logs |
| `XP_MIN` / `XP_MAX` | `15` / `25` | XP per message |
| `XP_COOLDOWN_SECONDS` | `60` | Minimum time between XP awards |

## Project structure

```
bot/
├── __main__.py          python -m bot
├── core.py              ExpertBot (composition root) + ExpertTree (errors)
├── config.py            validated, frozen config
├── logging_setup.py     coloured dev logs / JSON prod logs
├── database.py          aiosqlite, migrations, repositories
├── services/
│   ├── modlog.py
│   └── auditlog.py      send + find_executor
├── utils/               duration, levels, formatting, checks
└── cogs/
    ├── general.py       ping, help
    ├── leveling.py      XP listener, rank, leaderboard, Show Rank
    ├── moderation.py    warn … purge
    ├── reminders.py     /remind group + tasks.loop delivery
    ├── tags.py          /tag group + autocomplete
    ├── settings.py      /settings group
    ├── utility.py       Bookmark
    └── audit.py         all audit-log listeners
tests/                   duration, levels, database
```

## Design notes

- **Raw events for deletes.** `on_message_delete` only fires for cached messages. `on_raw_message_delete` always fires and carries the cached copy if there is one, so deletes of old messages are still logged.
- **`max_messages=5000`** keeps more messages in memory for edit/delete logs.
- **Context menus in cogs** can't use decorators, so they are created in `__init__` and added to the tree manually (and removed in `cog_unload`).
- **Settings cache.** Audit listeners read the guild's log channel on every event. `SettingsRepository` caches it and invalidates on change.

Deep dives: [Audit Log System](../../wiki/Audit-Log-System.md) · [Python Guide](../../wiki/Python/README.md)
