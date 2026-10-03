# Discord Bot Examples: Wiki

This wiki teaches you how to build Discord bots from zero, in **JavaScript**, **Python** or **C#**. It covers how Discord works under the hood, every common feature (step by step, with code), and how to deploy and run a bot safely.

Every page links to working code in this repository, so you can read the explanation, then open the file and see it in a real bot.

## Start here

| If you… | Read |
|---|---|
| have never made a bot | [Getting Started](Getting-Started.md), then [How Discord Bots Work](How-Discord-Bots-Work.md) |
| can't decide on a language | [Choosing a Language](Choosing-a-Language.md) |
| know your language and want a full walkthrough | [JavaScript Guide](JavaScript/README.md) · [Python Guide](Python/README.md) · [C# Guide](CSharp/README.md) |
| have a specific bot idea | [Use-Case Recipes](Use-Case-Recipes.md) |
| want to know what's possible | [What Discord Bots Can Do](What-Discord-Bots-Can-Do.md) |
| are stuck on an error | [Troubleshooting & FAQ](Troubleshooting-and-FAQ.md) |

## All pages

### Foundations
- [Getting Started](Getting-Started.md): create an application, get a token, invite your bot, run it
- [How Discord Bots Work](How-Discord-Bots-Work.md): gateway, REST, events, interactions, caching, sharding
- [Choosing a Language](Choosing-a-Language.md): discord.js vs discord.py vs Discord.Net
- [What Discord Bots Can Do](What-Discord-Bots-Can-Do.md): a catalogue of everything the API offers today
- [Glossary](Glossary.md)
- [Limits Cheat Sheet](Limits-Cheat-Sheet.md): every number you'll eventually need

### Building features
- [Slash Commands & Interactions](Slash-Commands-and-Interactions.md): options, subcommands, choices, autocomplete, context menus
- [Components & Modals](Components-and-Modals.md): buttons, select menus, forms, custom IDs
- [Embeds & Messages](Embeds-and-Messages.md): rich embeds, mentions, files, timestamps
- [Events & Intents](Events-and-Intents.md): listening to what happens in a server
- [Permissions & Moderation](Permissions-and-Moderation.md): role hierarchy, command permissions, moderation actions
- [Databases & Persistence](Databases-and-Persistence.md): SQLite, migrations, repositories
- [Background Tasks](Background-Tasks.md): schedulers, status updaters, reminders
- [Audit Log System](Audit-Log-System.md): how the expert bots replace Discord's audit log
- [Use-Case Recipes](Use-Case-Recipes.md): tickets, reaction roles, starboards, giveaways, game-server status and more

### Language guides
- [JavaScript Guide](JavaScript/README.md): Node.js + discord.js v14
- [Python Guide](Python/README.md): discord.py 2.x
- [C# Guide](CSharp/README.md): .NET + Discord.Net 3.x

### Running your bot
- [Deployment & Hosting](Deployment-and-Hosting.md): Docker, VPS, systemd, pm2, backups
- [Security Best Practices](Security-Best-Practices.md)
- [Testing](Testing.md)
- [Troubleshooting & FAQ](Troubleshooting-and-FAQ.md)

## The three tiers

| Tier | What it teaches | Code |
|---|---|---|
| **Basic** | One file. Slash commands, options, replies, error handling. | [JS](../javascript/01-basic) · [Py](../python/01-basic) · [C#](../csharp/01-basic) |
| **Enhanced** | Modular structure, embeds, buttons, select menus, modals, cooldowns, events, a background job (game-server player count). | [JS](../javascript/02-enhanced) · [Py](../python/02-enhanced) · [C#](../csharp/02-enhanced) |
| **Expert** | Database, moderation, audit log, leveling, reminders, autocomplete, context menus, tests, Docker. | [JS](../javascript/03-expert) · [Py](../python/03-expert) · [C#](../csharp/03-expert) |

> **Using this as a GitHub Wiki:** these files work both inside the repository and as a GitHub Wiki. To publish them as the repo's Wiki tab, clone `<repo>.wiki.git` and copy the contents of this folder into it.
