# Python Portal: discord.py 2.x

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![articles](https://img.shields.io/badge/articles-42-5865F2?style=flat-square)

<sub>[Wiki home](../Home.md) › Python</sub>

| | |
|---|---|
| **Library** | [discord.py](https://discordpy.readthedocs.io) 2.x |
| **Runtime** | Python 3.10 or newer |
| **Docs** | [discordpy.readthedocs.io](https://discordpy.readthedocs.io) · [examples](https://github.com/Rapptz/discord.py/tree/master/examples) |
| **Example bots** | [Basic](../../python/01-basic) · [Enhanced](../../python/02-enhanced) · [Expert](../../python/03-expert) |

**discord.py** is the most popular Python library for Discord. It's async (`asyncio`), uses decorators for commands, and turns type hints into slash command options. This portal explains how to do everything with it, one topic per article, with complete examples.

> New to bots? Read [Installation](01-Installation.md) → [Client & Intents](02-Client-and-Intents.md) → [Slash Commands](04-Slash-Commands.md) → [Responding to Interactions](10-Responding-to-Interactions.md) in that order.

## Articles

### Getting started
| # | Article | You'll learn |
|---|---|---|
| 01 | [Installation](01-Installation.md) | Python, virtual environments, pip |
| 02 | [Client & Intents](02-Client-and-Intents.md) | `Client` vs `commands.Bot`, intents, `setup_hook` |
| 03 | [Configuration & .env](03-Configuration-and-Env.md) | `python-dotenv`, validated dataclass config |

### Commands & interactions
| # | Article | You'll learn |
|---|---|---|
| 04 | [Slash Commands](04-Slash-Commands.md) | `app_commands`, the command tree, syncing |
| 05 | [Command Options](05-Command-Options.md) | Type hints as options, `Range`, `describe`, `rename` |
| 06 | [Subcommands & Groups](06-Subcommands-and-Groups.md) | `app_commands.Group`, `GroupCog` |
| 07 | [Choices](07-Choices.md) | `@choices`, `Literal`, enums |
| 08 | [Autocomplete](08-Autocomplete.md) | Autocomplete callbacks |
| 09 | [Context Menus](09-Context-Menus.md) | User/message commands, in cogs |
| 10 | [Responding to Interactions](10-Responding-to-Interactions.md) | `response`, `followup`, defer, ephemeral |

### Messages & components
| # | Article | You'll learn |
|---|---|---|
| 11 | [Embeds](11-Embeds.md) | `discord.Embed`, every field, limits |
| 12 | [Buttons](12-Buttons.md) | `discord.ui.View`, button callbacks, persistent views |
| 13 | [Select Menus](13-Select-Menus.md) | String, user, role, channel selects |
| 14 | [Modals](14-Modals.md) | `discord.ui.Modal`, `TextInput`, labels |
| 15 | [Components V2](15-Components-V2.md) | `LayoutView`, containers, sections |
| 16 | [Sending Messages](16-Sending-Messages.md) | send, reply, mentions, DMs, Markdown utils |
| 17 | [Editing, Deleting & Pinning](17-Editing-Deleting-Pinning.md) | History, edit, delete, purge |
| 18 | [Reactions](18-Reactions.md) | Adding, reading, events, waiting |
| 19 | [Files & Attachments](19-Files-and-Attachments.md) | `discord.File`, attachments |
| 20 | [Threads & Forums](20-Threads-and-Forums.md) | Threads, forum posts, tags |
| 21 | [Webhooks](21-Webhooks.md) | Creating and sending via webhooks |
| 22 | [Polls](22-Polls.md) | `discord.Poll` and vote events |

### Servers, members & moderation
| # | Article | You'll learn |
|---|---|---|
| 23 | [Members](23-Members.md) | `Member` vs `User`, fetching, editing |
| 24 | [Roles](24-Roles.md) | Creating, editing, assigning roles |
| 25 | [Moderation](25-Moderation.md) | Timeout, kick, ban, unban, purge |
| 26 | [Permissions](26-Permissions.md) | Checks, decorators, overwrites |
| 27 | [Channels](27-Channels.md) | Creating, editing, deleting channels |

### Events
| # | Article | You'll learn |
|---|---|---|
| 28 | [Events](28-Events.md) | Listeners, raw events, full list |
| 29 | [Message Events](29-Message-Events.md) | `on_message`, prefix commands, edits, deletes |
| 30 | [Member Events](30-Member-Events.md) | Joins, leaves, updates, presences |
| 31 | [Voice](31-Voice.md) | Voice states, connecting, playing audio |
| 32 | [Presence & Activity](32-Presence-and-Activity.md) | `change_presence`, activities |

### Building real bots
| # | Article | You'll learn |
|---|---|---|
| 33 | [Cooldowns](33-Cooldowns.md) | `checks.cooldown`, dynamic cooldowns |
| 34 | [Error Handling](34-Error-Handling.md) | Tree error handler, exceptions |
| 35 | [Background Tasks](35-Background-Tasks.md) | `discord.ext.tasks` |
| 36 | [HTTP Requests](36-HTTP-Requests.md) | `aiohttp` |
| 37 | [SQLite Database](37-SQLite-Database.md) | `aiosqlite`, migrations, repositories |
| 38 | [Project Structure](38-Project-Structure.md) | Cogs, extensions, packages |
| 39 | [Logging](39-Logging.md) | `logging`, JSON logs |
| 40 | [Sharding](40-Sharding.md) | `AutoShardedBot` |
| 41 | [Testing](41-Testing.md) | pytest, async tests |
| 42 | [Deployment](42-Deployment.md) | venv, systemd, Docker |

## Quick reference

```python
import discord
from discord import app_commands


class MyBot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.default())
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self):
        await self.tree.sync()


bot = MyBot()


@bot.tree.command(description="Replies with Pong!")
async def ping(interaction: discord.Interaction):
    await interaction.response.send_message("Pong!", ephemeral=True)


bot.run("TOKEN")
```

## See also
- Shared concepts: [How Discord Bots Work](../How-Discord-Bots-Work.md) · [Limits Cheat Sheet](../Limits-Cheat-Sheet.md)
- Other portals: [JavaScript](../JavaScript/README.md) · [C#](../CSharp/README.md)
