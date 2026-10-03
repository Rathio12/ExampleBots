<div align="center">

# Discord Bot Examples

**Learn to build Discord bots in JavaScript, Python and C#: from a 100-line starter to a production-ready moderation and audit-log bot.**

[![CI](https://github.com/Rathio12/ExampleBots/actions/workflows/ci.yml/badge.svg)](https://github.com/Rathio12/ExampleBots/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-support-FF5E5B?logo=kofi&logoColor=white)](https://ko-fi.com/derechtealec)

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](javascript)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](python)
[![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white)](https://discordpy.readthedocs.io)
[![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)](csharp)
[![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white)](https://docs.discordnet.dev)

[Wiki](wiki/Home.md) · [Getting Started](wiki/Getting-Started.md) · [Use-Case Recipes](wiki/Use-Case-Recipes.md) · [Troubleshooting](wiki/Troubleshooting-and-FAQ.md)

</div>

---

## What's inside

Nine complete, runnable bots: **three tiers in three languages**. Every tier has the same features in every language, so you can learn in the language you know and compare it with the others.

| | Basic | Enhanced | Expert |
|---|---|---|---|
| **Goal** | Your first working bot | A real community bot | Production-grade architecture |
| **Structure** | One file | Modular (commands, components, events) | Layered (config, data, services, commands) |
| **JavaScript** | [`javascript/01-basic`](javascript/01-basic) | [`javascript/02-enhanced`](javascript/02-enhanced) | [`javascript/03-expert`](javascript/03-expert) |
| **Python** | [`python/01-basic`](python/01-basic) | [`python/02-enhanced`](python/02-enhanced) | [`python/03-expert`](python/03-expert) |
| **C#** | [`csharp/01-basic`](csharp/01-basic) | [`csharp/02-enhanced`](csharp/02-enhanced) | [`csharp/03-expert`](csharp/03-expert) |

### Features by tier

<table>
<tr><th>Basic: fun bot</th><th>Enhanced: community bot</th><th>Expert: moderation & audit bot</th></tr>
<tr valign="top"><td>

- `/ping` latency
- `/hello` greeting
- `/roll` dice with min/max
- `/avatar` user options
- `/8ball` magic answers
- `/coinflip`
- Error handling

</td><td>

- Auto-loaded commands
- Rich **embeds**
- `/poll` with **buttons**
- `/trivia` with **select menus**
- `/feedback` **modal** form
- `/players`: live **game-server player count**
- Background **status updater**
- Welcome messages
- Per-user **cooldowns**

</td><td>

- **SQLite** with migrations
- **Moderation**: warn, timeout, kick, ban, unban, purge
- **Mod-log** channel
- **Audit-log replacement**: edits, deletes, joins, roles, bans, channels, voice
- **XP & levels** with paginated leaderboard
- **Reminders** that survive restarts
- **Tags** with autocomplete
- **Context menus**
- Tests, structured logs, Docker

</td></tr>
</table>

## Quick start

You need a bot token first. The [Getting Started](wiki/Getting-Started.md) guide walks through creating an application, enabling intents and inviting the bot.

<details open>
<summary><b>JavaScript</b></summary>

```bash
cd javascript/01-basic
npm install
cp .env.example .env        # paste your token into .env
npm start
```

</details>

<details>
<summary><b>Python</b></summary>

```bash
cd python/01-basic
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # paste your token into .env
python bot.py
```

</details>

<details>
<summary><b>C#</b></summary>

```bash
cd csharp/01-basic
cp .env.example .env        # paste your token into .env
dotnet run
```

</details>

Set `GUILD_ID` in `.env` to your test server's ID so commands appear instantly instead of after up to an hour.

## Learning path

1. **Read the concepts.** [How Discord Bots Work](wiki/How-Discord-Bots-Work.md) explains the gateway, intents, and interactions in plain language.
2. **Run a Basic bot.** It's one file, top to bottom, with every line explained.
3. **Move to Enhanced.** Learn to split a bot into modules and use buttons, menus, and modals.
4. **Study Expert.** See how real bots handle databases, permissions, background jobs, and tests.
5. **Build your own.** Pick a recipe from [Use-Case Recipes](wiki/Use-Case-Recipes.md): tickets, reaction roles, starboards, giveaways, and more.

Each language has a long step-by-step guide:
[JavaScript Guide](wiki/JavaScript/README.md) · [Python Guide](wiki/Python/README.md) · [C# Guide](wiki/CSharp/README.md)

## Wiki

The [wiki](wiki/Home.md) is an encyclopedia of **150+ articles**: shared concepts plus a portal per language that covers the same 42 topics in each library.

| Portal | Library | Articles |
|---|---|---|
| [![JavaScript](https://img.shields.io/badge/-JavaScript_portal-F7DF1E?logo=javascript&logoColor=black&style=flat-square)](wiki/JavaScript/README.md) | discord.js v14 | 42 |
| [![Python](https://img.shields.io/badge/-Python_portal-3776AB?logo=python&logoColor=white&style=flat-square)](wiki/Python/README.md) | discord.py 2.x | 42 |
| [![C#](https://img.shields.io/badge/-C%23_portal-512BD4?logo=dotnet&logoColor=white&style=flat-square)](wiki/CSharp/README.md) | Discord.Net 3.x | 42 |

Concept articles:

| Basics | Building | Running |
|---|---|---|
| [Getting Started](wiki/Getting-Started.md) | [Slash Commands & Interactions](wiki/Slash-Commands-and-Interactions.md) | [Deployment & Hosting](wiki/Deployment-and-Hosting.md) |
| [How Discord Bots Work](wiki/How-Discord-Bots-Work.md) | [Components & Modals](wiki/Components-and-Modals.md) | [Security Best Practices](wiki/Security-Best-Practices.md) |
| [Choosing a Language](wiki/Choosing-a-Language.md) | [Embeds & Messages](wiki/Embeds-and-Messages.md) | [Testing](wiki/Testing.md) |
| [What Discord Bots Can Do](wiki/What-Discord-Bots-Can-Do.md) | [Events & Intents](wiki/Events-and-Intents.md) | [Troubleshooting & FAQ](wiki/Troubleshooting-and-FAQ.md) |
| [Glossary](wiki/Glossary.md) | [Permissions & Moderation](wiki/Permissions-and-Moderation.md) | [Limits Cheat Sheet](wiki/Limits-Cheat-Sheet.md) |
| | [Databases & Persistence](wiki/Databases-and-Persistence.md) | |
| | [Background Tasks](wiki/Background-Tasks.md) | |
| | [Audit Log System](wiki/Audit-Log-System.md) | |
| | [Use-Case Recipes](wiki/Use-Case-Recipes.md) | |

## Repository layout

```
.
├── javascript/        discord.js v14  — 01-basic, 02-enhanced, 03-expert
├── python/            discord.py 2.x  — 01-basic, 02-enhanced, 03-expert
├── csharp/            Discord.Net 3.x — 01-basic, 02-enhanced, 03-expert
├── wiki/              the full guide (also works as a GitHub Wiki)
└── .github/           CI, issue templates, Dependabot
```

## Contributing

Contributions are welcome, especially new recipes and wiki improvements. Please read [CONTRIBUTING.md](CONTRIBUTING.md). The main rule: keep the three languages in sync.

## Support the project

If these examples helped you build your bot, you can support further work (new recipes, more languages, keeping everything up to date with Discord's API) here:

<a href="https://ko-fi.com/derechtealec"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support me on Ko-fi" height="36"></a>

## License

[MIT](LICENSE). Use these examples in your own bots, commercial or not.

<sub>Not affiliated with Discord Inc. "Discord" is a trademark of Discord Inc.</sub>
