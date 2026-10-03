<div align="center">

# Discord Bot Wiki

**The encyclopedia for building Discord bots in JavaScript, Python and C#**

![Articles](https://img.shields.io/badge/articles-150%2B-5865F2?style=flat-square)
![Languages](https://img.shields.io/badge/languages-3-57F287?style=flat-square)
![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square)
![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square)
![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square)

</div>

Every article explains one topic, with complete examples and links to the working bots in this repository. Concept articles apply to every language. The three **language portals** show exactly how each library does it.

## Language portals

| | Portal | Library | Articles |
|---|---|---|---|
| ![JS](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black&style=flat-square) | **[JavaScript portal](JavaScript/README.md)** | discord.js v14 · Node.js 20+ | 42 |
| ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white&style=flat-square) | **[Python portal](Python/README.md)** | discord.py 2.x · Python 3.10+ | 42 |
| ![C#](https://img.shields.io/badge/-C%23-512BD4?logo=dotnet&logoColor=white&style=flat-square) | **[C# portal](CSharp/README.md)** | Discord.Net 3.x · .NET 10 | 42 |

Each portal covers the same 42 topics, so article 12 is always "Buttons" and article 25 is always "Moderation". You can switch languages without losing your place.

## Start here

| If you… | Read |
|---|---|
| have never made a bot | [Getting Started](Getting-Started.md) → [How Discord Bots Work](How-Discord-Bots-Work.md) → your language's *Installation* article |
| can't decide on a language | [Choosing a Language](Choosing-a-Language.md) |
| have a specific bot idea | [Use-Case Recipes](Use-Case-Recipes.md) |
| want to know what's possible | [What Discord Bots Can Do](What-Discord-Bots-Can-Do.md) |
| are stuck on an error | [Troubleshooting & FAQ](Troubleshooting-and-FAQ.md) |

## Concept articles

![category](https://img.shields.io/badge/category-Foundations-607D8B?style=flat-square)

- [Getting Started](Getting-Started.md): application, token, intents, invite link, first run
- [How Discord Bots Work](How-Discord-Bots-Work.md): gateway, REST, interactions, cache, rate limits, sharding
- [Choosing a Language](Choosing-a-Language.md): discord.js vs discord.py vs Discord.Net
- [What Discord Bots Can Do](What-Discord-Bots-Can-Do.md): everything the API offers today
- [Glossary](Glossary.md) · [Limits Cheat Sheet](Limits-Cheat-Sheet.md)

![category](https://img.shields.io/badge/category-Building-0A84FF?style=flat-square)

- [Slash Commands & Interactions](Slash-Commands-and-Interactions.md)
- [Components & Modals](Components-and-Modals.md)
- [Embeds & Messages](Embeds-and-Messages.md)
- [Events & Intents](Events-and-Intents.md)
- [Permissions & Moderation](Permissions-and-Moderation.md)
- [Databases & Persistence](Databases-and-Persistence.md)
- [Background Tasks](Background-Tasks.md)
- [Audit Log System](Audit-Log-System.md)
- [Use-Case Recipes](Use-Case-Recipes.md): player counts, tickets, roles, starboard, giveaways, AI chat and more

![category](https://img.shields.io/badge/category-Running-8E8E93?style=flat-square)

- [Deployment & Hosting](Deployment-and-Hosting.md)
- [Security Best Practices](Security-Best-Practices.md)
- [Testing](Testing.md)
- [Troubleshooting & FAQ](Troubleshooting-and-FAQ.md)

## Library articles (same topics in every portal)

| # | Topic | JavaScript | Python | C# |
|---|---|---|---|---|
| 01 | Installation | [JS](JavaScript/01-Installation.md) | [Py](Python/01-Installation.md) | [C#](CSharp/01-Installation.md) |
| 02 | Client & Intents | [JS](JavaScript/02-Client-and-Intents.md) | [Py](Python/02-Client-and-Intents.md) | [C#](CSharp/02-Client-and-Intents.md) |
| 03 | Configuration & .env | [JS](JavaScript/03-Configuration-and-Env.md) | [Py](Python/03-Configuration-and-Env.md) | [C#](CSharp/03-Configuration-and-Env.md) |
| 04 | Slash Commands | [JS](JavaScript/04-Slash-Commands.md) | [Py](Python/04-Slash-Commands.md) | [C#](CSharp/04-Slash-Commands.md) |
| 05 | Command Options | [JS](JavaScript/05-Command-Options.md) | [Py](Python/05-Command-Options.md) | [C#](CSharp/05-Command-Options.md) |
| 06 | Subcommands & Groups | [JS](JavaScript/06-Subcommands-and-Groups.md) | [Py](Python/06-Subcommands-and-Groups.md) | [C#](CSharp/06-Subcommands-and-Groups.md) |
| 07 | Choices | [JS](JavaScript/07-Choices.md) | [Py](Python/07-Choices.md) | [C#](CSharp/07-Choices.md) |
| 08 | Autocomplete | [JS](JavaScript/08-Autocomplete.md) | [Py](Python/08-Autocomplete.md) | [C#](CSharp/08-Autocomplete.md) |
| 09 | Context Menus | [JS](JavaScript/09-Context-Menus.md) | [Py](Python/09-Context-Menus.md) | [C#](CSharp/09-Context-Menus.md) |
| 10 | Responding to Interactions | [JS](JavaScript/10-Responding-to-Interactions.md) | [Py](Python/10-Responding-to-Interactions.md) | [C#](CSharp/10-Responding-to-Interactions.md) |
| 11 | Embeds | [JS](JavaScript/11-Embeds.md) | [Py](Python/11-Embeds.md) | [C#](CSharp/11-Embeds.md) |
| 12 | Buttons | [JS](JavaScript/12-Buttons.md) | [Py](Python/12-Buttons.md) | [C#](CSharp/12-Buttons.md) |
| 13 | Select Menus | [JS](JavaScript/13-Select-Menus.md) | [Py](Python/13-Select-Menus.md) | [C#](CSharp/13-Select-Menus.md) |
| 14 | Modals | [JS](JavaScript/14-Modals.md) | [Py](Python/14-Modals.md) | [C#](CSharp/14-Modals.md) |
| 15 | Components V2 | [JS](JavaScript/15-Components-V2.md) | [Py](Python/15-Components-V2.md) | [C#](CSharp/15-Components-V2.md) |
| 16 | Sending Messages | [JS](JavaScript/16-Sending-Messages.md) | [Py](Python/16-Sending-Messages.md) | [C#](CSharp/16-Sending-Messages.md) |
| 17 | Editing, Deleting & Pinning | [JS](JavaScript/17-Editing-Deleting-Pinning.md) | [Py](Python/17-Editing-Deleting-Pinning.md) | [C#](CSharp/17-Editing-Deleting-Pinning.md) |
| 18 | Reactions | [JS](JavaScript/18-Reactions.md) | [Py](Python/18-Reactions.md) | [C#](CSharp/18-Reactions.md) |
| 19 | Files & Attachments | [JS](JavaScript/19-Files-and-Attachments.md) | [Py](Python/19-Files-and-Attachments.md) | [C#](CSharp/19-Files-and-Attachments.md) |
| 20 | Threads & Forums | [JS](JavaScript/20-Threads-and-Forums.md) | [Py](Python/20-Threads-and-Forums.md) | [C#](CSharp/20-Threads-and-Forums.md) |
| 21 | Webhooks | [JS](JavaScript/21-Webhooks.md) | [Py](Python/21-Webhooks.md) | [C#](CSharp/21-Webhooks.md) |
| 22 | Polls | [JS](JavaScript/22-Polls.md) | [Py](Python/22-Polls.md) | [C#](CSharp/22-Polls.md) |
| 23 | Members | [JS](JavaScript/23-Members.md) | [Py](Python/23-Members.md) | [C#](CSharp/23-Members.md) |
| 24 | Roles | [JS](JavaScript/24-Roles.md) | [Py](Python/24-Roles.md) | [C#](CSharp/24-Roles.md) |
| 25 | Moderation | [JS](JavaScript/25-Moderation.md) | [Py](Python/25-Moderation.md) | [C#](CSharp/25-Moderation.md) |
| 26 | Permissions | [JS](JavaScript/26-Permissions.md) | [Py](Python/26-Permissions.md) | [C#](CSharp/26-Permissions.md) |
| 27 | Channels | [JS](JavaScript/27-Channels.md) | [Py](Python/27-Channels.md) | [C#](CSharp/27-Channels.md) |
| 28 | Events | [JS](JavaScript/28-Events.md) | [Py](Python/28-Events.md) | [C#](CSharp/28-Events.md) |
| 29 | Message Events | [JS](JavaScript/29-Message-Events.md) | [Py](Python/29-Message-Events.md) | [C#](CSharp/29-Message-Events.md) |
| 30 | Member Events | [JS](JavaScript/30-Member-Events.md) | [Py](Python/30-Member-Events.md) | [C#](CSharp/30-Member-Events.md) |
| 31 | Voice | [JS](JavaScript/31-Voice.md) | [Py](Python/31-Voice.md) | [C#](CSharp/31-Voice.md) |
| 32 | Presence & Activity | [JS](JavaScript/32-Presence-and-Activity.md) | [Py](Python/32-Presence-and-Activity.md) | [C#](CSharp/32-Presence-and-Activity.md) |
| 33 | Cooldowns | [JS](JavaScript/33-Cooldowns.md) | [Py](Python/33-Cooldowns.md) | [C#](CSharp/33-Cooldowns.md) |
| 34 | Error Handling | [JS](JavaScript/34-Error-Handling.md) | [Py](Python/34-Error-Handling.md) | [C#](CSharp/34-Error-Handling.md) |
| 35 | Background Tasks | [JS](JavaScript/35-Background-Tasks.md) | [Py](Python/35-Background-Tasks.md) | [C#](CSharp/35-Background-Tasks.md) |
| 36 | HTTP Requests | [JS](JavaScript/36-HTTP-Requests.md) | [Py](Python/36-HTTP-Requests.md) | [C#](CSharp/36-HTTP-Requests.md) |
| 37 | SQLite Database | [JS](JavaScript/37-SQLite-Database.md) | [Py](Python/37-SQLite-Database.md) | [C#](CSharp/37-SQLite-Database.md) |
| 38 | Project Structure | [JS](JavaScript/38-Project-Structure.md) | [Py](Python/38-Project-Structure.md) | [C#](CSharp/38-Project-Structure.md) |
| 39 | Logging | [JS](JavaScript/39-Logging.md) | [Py](Python/39-Logging.md) | [C#](CSharp/39-Logging.md) |
| 40 | Sharding | [JS](JavaScript/40-Sharding.md) | [Py](Python/40-Sharding.md) | [C#](CSharp/40-Sharding.md) |
| 41 | Testing | [JS](JavaScript/41-Testing.md) | [Py](Python/41-Testing.md) | [C#](CSharp/41-Testing.md) |
| 42 | Deployment | [JS](JavaScript/42-Deployment.md) | [Py](Python/42-Deployment.md) | [C#](CSharp/42-Deployment.md) |

## Reading the badges

Every library article starts with a row of badges:

| Badge | Meaning |
|---|---|
| ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square) | No prior bot experience needed |
| ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square) | Assumes you've built a basic bot |
| ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square) | Architecture, scaling or native dependencies |
| ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![category](https://img.shields.io/badge/category-Components-AF52DE?style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![category](https://img.shields.io/badge/category-Server-FF9F0A?style=flat-square) ![category](https://img.shields.io/badge/category-Moderation-FF453A?style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) | Topic area |

## The example bots

| Tier | Teaches | Code |
|---|---|---|
| **Basic** | One file: slash commands, options, replies, error handling | [JS](../javascript/01-basic) · [Py](../python/01-basic) · [C#](../csharp/01-basic) |
| **Enhanced** | Modules, embeds, buttons, selects, modals, cooldowns, events, game-server player counts | [JS](../javascript/02-enhanced) · [Py](../python/02-enhanced) · [C#](../csharp/02-enhanced) |
| **Expert** | SQLite, moderation, audit log, leveling, reminders, autocomplete, context menus, tests, Docker | [JS](../javascript/03-expert) · [Py](../python/03-expert) · [C#](../csharp/03-expert) |

## Accuracy

Library examples were checked against the versions this repository pins: discord.js 14.27, discord.py 2.7 and Discord.Net 3.20. The C# samples were compile-checked, and the Python and JavaScript APIs were verified by introspection. Discord changes fast. If something has drifted, please [open an issue](https://github.com/Rathio12/ExampleBots/issues).

> **Using this as a GitHub Wiki:** these pages also work in a repository's Wiki tab. Clone `<repo>.wiki.git` and copy this folder's contents into it.
