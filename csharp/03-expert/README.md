# C# · Expert Bot

[![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com)
[![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white)](https://docs.discordnet.dev)
[![SQLite](https://img.shields.io/badge/SQLite-Microsoft.Data.Sqlite-003B57?logo=sqlite&logoColor=white)](https://learn.microsoft.com/dotnet/standard/data/sqlite/)
[![xUnit](https://img.shields.io/badge/tests-xUnit-5E1F87)](tests/ExpertBot.Tests)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](Dockerfile)
![Tier](https://img.shields.io/badge/tier-expert-ED4245)

A production-style moderation, audit-log and community bot on the **.NET Generic Host**, the same foundation ASP.NET Core uses. You get dependency injection, `ILogger`, hosted services and graceful shutdown out of the box.

## Features

**Moderation** ([ModerationModule](src/ExpertBot/Modules/ModerationModule.cs)): `/warn`, `/warnings`, `/clearwarnings`, `/timeout`, `/untimeout`, `/kick`, `/ban`, `/unban`, `/purge`, using `[DefaultMemberPermissions]`, `[RequireBotPermission]` and role-hierarchy checks. Every action is written to the mod log.

**Audit log** ([AuditEventHandlers](src/ExpertBot/Services/AuditEventHandlers.cs)): message edits/deletes with content, bulk deletes with a transcript file, joins with new-account warnings, leaves and kick detection, nickname/role/timeout changes with the moderator, bans/unbans, channel and role changes with permission diffs, and voice join/leave/move.

**Community**: XP and levels, `/rank`, a paginated `/leaderboard`, `/remind` (a persistent `BackgroundService`), and `/tag` with an `AutocompleteHandler`.

**Context menus**: **Show Rank** (`[UserCommand]`) and **Bookmark** (`[MessageCommand]`).

**Engineering**: SQLite migrations, repositories, JSON console logs in production, xUnit tests (including one that builds every module), and a multi-stage Dockerfile that runs the tests.

## Before you start

Enable **Server Members Intent** and **Message Content Intent** in the Developer Portal (your app → Bot → Privileged Gateway Intents). The bot needs View Audit Log, Kick/Ban/Moderate Members, Manage Messages, Read Message History, Send Messages, Embed Links and Attach Files.

## Run

```bash
cp .env.example .env
dotnet run --project src/ExpertBot     # run from this folder so .env is found
```

Then in Discord: `/settings modlog channel:#mod-log` and `/settings auditlog channel:#audit-log`.

### Tests

```bash
dotnet test
```

### Docker

```bash
docker compose up -d --build     # the build stage runs the tests first
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `DISCORD_TOKEN` | — | Bot token (required) |
| `GUILD_ID` | — | Register commands to one server instantly |
| `DATABASE_PATH` | `./data/bot.db` | SQLite file location |
| `LOG_LEVEL` | `Information` | `Trace`, `Debug`, `Information`, `Warning`, `Error` |
| `ENVIRONMENT` | `development` | `production` switches to JSON logs |
| `XP_MIN` / `XP_MAX` | `15` / `25` | XP per message |
| `XP_COOLDOWN_SECONDS` | `60` | Minimum time between XP awards |

## Project structure

```
ExpertBot.sln
src/ExpertBot/
├── Program.cs                 Generic Host: DI registrations, logging, hosted services
├── Configuration/             BotOptions (validated), DotEnv
├── Data/
│   ├── Database.cs            connections, migrations, query helpers
│   └── Repositories.cs        levels, warnings, reminders, tags, settings
├── Services/
│   ├── DiscordBotService.cs   IHostedService: login, register commands, route interactions
│   ├── ReminderService.cs     BackgroundService: delivers due reminders
│   ├── LevelingService.cs     XP on MessageReceived, rank embeds
│   ├── ModLogService.cs
│   ├── AuditLogService.cs     send + FindExecutorAsync
│   └── AuditEventHandlers.cs  all audit-log event handlers
├── Modules/                   General, Leveling, Moderation, Reminder, Tag, Settings, Utility
└── Utils/                     Duration, LevelMath, Display (formatting + hierarchy)
tests/ExpertBot.Tests/         Duration, LevelMath, Repository, Module tests
```

## Design notes

- **Don't block the gateway.** Discord.Net raises events on the gateway thread. The audit and leveling handlers hand work to the thread pool (`Task.Run`) so slow HTTP calls never stall the connection.
- **Connection per operation.** `SqliteConnection` isn't thread-safe. Pooling makes opening one per query cheap, and a keep-alive connection lets in-memory test databases persist.
- **`ModuleTests`** builds every module through `InteractionService` with real DI registrations. A typo in an attribute or a missing service fails the test instead of the bot.

Deep dives: [Audit Log System](../../wiki/Audit-Log-System.md) · [C# Guide](../../wiki/CSharp/README.md)
