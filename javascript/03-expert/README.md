# JavaScript · Expert Bot

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite&logoColor=white)](https://github.com/WiseLibs/better-sqlite3)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](Dockerfile)
![Tier](https://img.shields.io/badge/tier-expert-ED4245)

A production-style moderation, audit-log and community bot. It shows how larger bots are structured: one composition root, a shared context object, repositories over SQL, services for background work, and tests for pure logic and database code.

## Features

**Moderation**: `/warn`, `/warnings`, `/clearwarnings`, `/timeout`, `/untimeout`, `/kick`, `/ban`, `/unban`, `/purge`. Every command checks the role hierarchy and writes to a configurable mod-log channel.

**Audit log**: a permanent, readable replacement for Discord's 45-day audit log.

| Event | Logged details |
|---|---|
| Message deleted | Author, channel, **full content**, attachments |
| Message edited | Before and after content, jump link |
| Bulk delete | Count plus a **.txt transcript** of cached messages |
| Member joined | Account age, **new-account warning** |
| Member left / kicked | Kick detection and moderator (via audit log), roles they had |
| Member updated | Nickname, roles added/removed, timeouts, and who did it |
| Ban / unban | Moderator and reason |
| Channel created / deleted / updated | Name, topic, slowmode, NSFW, category, permission changes |
| Role created / deleted / updated | Name, color, hoist, mentionable, **permission diff** |
| Voice | Join, leave, move |

**Community**: XP for chatting with level-up messages, `/rank`, a paginated `/leaderboard`, `/remind` (stored in SQLite, survives restarts), and `/tag` snippets with autocomplete.

**Context menus**: right-click a user for **Show Rank**, or a message for **Bookmark**.

**Engineering**: SQLite migrations, prepared statements, structured JSON logs in production, graceful shutdown, `node:test` suites, and a multi-stage Dockerfile.

## Before you start

This bot uses two **privileged intents**. Enable both in the [Developer Portal](https://discord.com/developers/applications) under your app → **Bot** → **Privileged Gateway Intents**:

- **Server Members Intent**: joins, leaves, role changes
- **Message Content Intent**: content in edit/delete logs

The bot also needs these permissions: View Audit Log, Kick Members, Ban Members, Moderate Members, Manage Messages, Read Message History, Send Messages, Embed Links, Attach Files. Invite link generator: [Getting Started](../../wiki/Getting-Started.md#4-invite-the-bot).

## Run

```bash
npm install
cp .env.example .env
npm run deploy
npm start
```

Then, in your server:

```
/settings modlog channel:#mod-log
/settings auditlog channel:#audit-log
```

### Docker

```bash
cp .env.example .env
docker compose up -d --build
docker compose logs -f
```

The database is stored in the `bot-data` volume, so it survives rebuilds.

### Tests

```bash
npm test
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `DISCORD_TOKEN` | — | Bot token (required) |
| `GUILD_ID` | — | Deploy commands to one server instantly |
| `DATABASE_PATH` | `./data/bot.db` | SQLite file location |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `XP_MIN` / `XP_MAX` | `15` / `25` | XP awarded per message |
| `XP_COOLDOWN_SECONDS` | `60` | Minimum time between XP awards per user |
| `NODE_ENV` | — | Set to `production` for JSON logs (Docker does this) |

## Project structure

```
src/
├── index.js               composition root: builds ctx, loads handlers, shutdown
├── deploy-commands.js
├── config.js              validated config (fails fast)
├── logger.js              pretty logs in dev, JSON in production
├── loaders.js             recursive module loader
├── database/
│   ├── index.js           connection + migrations (PRAGMA user_version)
│   └── repositories.js    levels, warnings, reminders, tags, settings
├── lib/                   pure helpers: duration, levels, format, permissions
├── services/              leveling, reminders, modlog, auditlog
├── commands/
│   ├── general/           ping, help
│   ├── leveling/          rank, leaderboard
│   ├── moderation/        warn, warnings, clearwarnings, timeout, untimeout, kick, ban, unban, purge
│   ├── utility/           remind, tag, settings
│   └── context/           Show Rank, Bookmark
├── components/            leaderboard pagination buttons
└── events/
    ├── ready.js, interactionCreate.js, messageCreate.js
    └── audit/             one file per audited event
test/                      duration, levels, repositories
```

## Design notes

- **Shared context.** Every handler receives `ctx` (`{ client, config, logger, db, repos, leveling, modlog, audit, reminders }`) instead of importing singletons. Swapping a dependency in tests is trivial.
- **Synchronous SQLite.** `better-sqlite3` is the fastest SQLite driver for Node. Queries take microseconds, so async would add overhead without benefit.
- **Polling scheduler.** Reminders are stored with a due timestamp and polled every 15 seconds, so they survive restarts and can be months away (`setTimeout` can't do either).
- **Safe mentions.** `allowedMentions: { parse: ['users'] }` is the client default, and tag content and logs use `parse: []`, so user content can never ping `@everyone`.

Deep dives: [Audit Log System](../../wiki/Audit-Log-System.md) · [Databases & Persistence](../../wiki/Databases-and-Persistence.md) · [JavaScript Guide](../../wiki/JavaScript/README.md)
