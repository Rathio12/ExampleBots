# JavaScript Portal: discord.js v14

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![articles](https://img.shields.io/badge/articles-42-5865F2?style=flat-square)

<sub>[Wiki home](../Home.md) › JavaScript</sub>

| | |
|---|---|
| **Library** | [discord.js](https://discord.js.org) v14 |
| **Runtime** | Node.js 20 or newer |
| **Docs** | [discord.js.org/docs](https://discord.js.org/docs) · [Guide](https://discordjs.guide) |
| **Example bots** | [Basic](../../javascript/01-basic) · [Enhanced](../../javascript/02-enhanced) · [Expert](../../javascript/03-expert) |

**discord.js** is the most widely used Discord library. It's object-oriented, fully typed (great with TypeScript), and maps closely to the Discord API. This portal is an encyclopedia of how to do everything with it. Each article explains one topic with complete, runnable examples.

> New to bots? Read [Installation](01-Installation.md) → [Client & Intents](02-Client-and-Intents.md) → [Slash Commands](04-Slash-Commands.md) → [Responding to Interactions](10-Responding-to-Interactions.md) in that order.

## Articles

### Getting started
| # | Article | You'll learn |
|---|---|---|
| 01 | [Installation](01-Installation.md) | Node.js, npm, ESM, project setup |
| 02 | [Client & Intents](02-Client-and-Intents.md) | Creating the client, intents, partials, logging in |
| 03 | [Configuration & .env](03-Configuration-and-Env.md) | Tokens, `dotenv`, validated config |

### Commands & interactions
| # | Article | You'll learn |
|---|---|---|
| 04 | [Slash Commands](04-Slash-Commands.md) | Defining, registering and handling commands |
| 05 | [Command Options](05-Command-Options.md) | Every option type, constraints, reading values |
| 06 | [Subcommands & Groups](06-Subcommands-and-Groups.md) | `/tag create`, `/config log set` |
| 07 | [Choices](07-Choices.md) | Fixed dropdown values |
| 08 | [Autocomplete](08-Autocomplete.md) | Dynamic suggestions while typing |
| 09 | [Context Menus](09-Context-Menus.md) | Right-click user/message commands |
| 10 | [Responding to Interactions](10-Responding-to-Interactions.md) | reply, defer, edit, follow-up, ephemeral |

### Messages & components
| # | Article | You'll learn |
|---|---|---|
| 11 | [Embeds](11-Embeds.md) | Rich embeds, every field, limits |
| 12 | [Buttons](12-Buttons.md) | Styles, custom IDs, handlers, collectors |
| 13 | [Select Menus](13-Select-Menus.md) | String, user, role, channel selects |
| 14 | [Modals](14-Modals.md) | Pop-up forms, labels, reading input |
| 15 | [Components V2](15-Components-V2.md) | Containers, sections, text displays, galleries |
| 16 | [Sending Messages](16-Sending-Messages.md) | send, reply, mentions, DMs, Markdown helpers |
| 17 | [Editing, Deleting & Pinning](17-Editing-Deleting-Pinning.md) | Fetching and changing messages |
| 18 | [Reactions](18-Reactions.md) | Adding, reading, removing, collecting reactions |
| 19 | [Files & Attachments](19-Files-and-Attachments.md) | Uploading, attachment options, images in embeds |
| 20 | [Threads & Forums](20-Threads-and-Forums.md) | Public/private threads, forum posts, tags |
| 21 | [Webhooks](21-Webhooks.md) | Creating webhooks, custom names/avatars |
| 22 | [Polls](22-Polls.md) | Native Discord polls and vote events |

### Servers, members & moderation
| # | Article | You'll learn |
|---|---|---|
| 23 | [Members](23-Members.md) | Fetching, nicknames, searching, member data |
| 24 | [Roles](24-Roles.md) | Creating, editing, assigning roles |
| 25 | [Moderation](25-Moderation.md) | Timeout, kick, ban, unban, purge |
| 26 | [Permissions](26-Permissions.md) | Checking permissions, overwrites, hierarchy |
| 27 | [Channels](27-Channels.md) | Creating, editing, deleting channels and categories |

### Events
| # | Article | You'll learn |
|---|---|---|
| 28 | [Events](28-Events.md) | Listening to events, event handler pattern, full list |
| 29 | [Message Events](29-Message-Events.md) | messageCreate/Update/Delete, prefix commands |
| 30 | [Member Events](30-Member-Events.md) | Joins, leaves, updates, presences |
| 31 | [Voice](31-Voice.md) | Voice states, joining channels, playing audio |
| 32 | [Presence & Activity](32-Presence-and-Activity.md) | Status, "Playing …", custom status |

### Building real bots
| # | Article | You'll learn |
|---|---|---|
| 33 | [Cooldowns](33-Cooldowns.md) | Per-user rate limits |
| 34 | [Error Handling](34-Error-Handling.md) | API errors, error codes, crash safety |
| 35 | [Background Tasks](35-Background-Tasks.md) | Intervals, schedulers, cron |
| 36 | [HTTP Requests](36-HTTP-Requests.md) | `fetch`, timeouts, external APIs |
| 37 | [SQLite Database](37-SQLite-Database.md) | better-sqlite3, migrations, repositories |
| 38 | [Project Structure](38-Project-Structure.md) | Command/event handlers, folders, deploy script |
| 39 | [Logging](39-Logging.md) | Levels, JSON logs, pino |
| 40 | [Sharding](40-Sharding.md) | ShardingManager, cross-shard data |
| 41 | [Testing](41-Testing.md) | node:test, fakes, CI |
| 42 | [Deployment](42-Deployment.md) | pm2, Docker, production settings |

## Quick reference

```js
import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => console.log(`Ready as ${c.user.tag}`));

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'ping') {
    await interaction.reply({ content: 'Pong!', flags: MessageFlags.Ephemeral });
  }
});

client.login(process.env.DISCORD_TOKEN);
```

## See also
- Concepts shared by all languages: [How Discord Bots Work](../How-Discord-Bots-Work.md) · [Limits Cheat Sheet](../Limits-Cheat-Sheet.md)
- Other portals: [Python](../Python/README.md) · [C#](../CSharp/README.md)
