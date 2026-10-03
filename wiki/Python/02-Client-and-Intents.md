# Client & Intents

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Getting_started-607D8B?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[Python portal](README.md) › Getting started</sub>

| | |
|---|---|
| **Key classes** | `discord.Client`, `commands.Bot`, `discord.Intents`, `app_commands.CommandTree` |
| **Used in** | [01-basic/bot.py](../../python/01-basic/bot.py) · [02-enhanced/bot/client.py](../../python/02-enhanced/bot/client.py) · [03-expert/bot/core.py](../../python/03-expert/bot/core.py) |

## Client vs Bot

| | `discord.Client` | `commands.Bot` |
|---|---|---|
| Slash commands | Add a `CommandTree` yourself | Has `bot.tree` built in |
| Cogs & extensions | ❌ | ✅ |
| Prefix commands | ❌ | ✅ |
| Used in | Basic bot | Enhanced & Expert bots |

```python
# Client + tree (Basic bot)
class BasicBot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.default())
        self.tree = app_commands.CommandTree(self)
```

```python
# commands.Bot (Enhanced/Expert)
from discord.ext import commands

class MyBot(commands.Bot):
    def __init__(self):
        super().__init__(
            command_prefix=commands.when_mentioned,   # required even if you only use slash commands
            intents=discord.Intents.default(),
        )
```

## Intents

```python
intents = discord.Intents.default()      # all non-privileged intents
intents.members = True                   # privileged: Server Members
intents.message_content = True           # privileged: Message Content
intents.presences = True                 # privileged: Presence

intents = discord.Intents.none()         # start from nothing
intents.guilds = True                    # enough for slash commands
```

| Attribute | Privileged | Gives you |
|---|---|---|
| `guilds` | | Servers, channels, roles, threads (**needed almost always**) |
| `members` | ✅ | Member join/leave/update, member cache |
| `moderation` (`bans`) | | Bans, audit-log entries |
| `emojis_and_stickers` | | Emoji/sticker updates |
| `voice_states` | | Voice changes (**needed for voice**) |
| `presences` | ✅ | Status/activities |
| `messages` / `guild_messages` / `dm_messages` | | Message events |
| `reactions` | | Reaction events |
| `typing` | | Typing events |
| `message_content` | ✅ | Message content |
| `invites`, `webhooks`, `integrations` | | Those events |
| `guild_scheduled_events` | | Scheduled events |
| `auto_moderation` | | AutoMod events |
| `polls` | | Poll vote events |

Enable privileged intents in the Developer Portal too, otherwise discord.py raises `PrivilegedIntentsRequired`.

## setup_hook: async startup work

`setup_hook` runs **once**, after login but before connecting to the gateway. Load extensions, open databases and sync commands there:

```python
class MyBot(commands.Bot):
    async def setup_hook(self) -> None:
        self.db = await Database.open("data/bot.db")
        await self.load_extension("bot.cogs.general")
        await self.tree.sync(guild=discord.Object(id=GUILD_ID))
```

Don't do this in `on_ready`. It fires again after reconnects.

## Useful bot options

```python
commands.Bot(
    command_prefix=commands.when_mentioned,
    intents=intents,
    tree_cls=MyTree,                         # custom CommandTree (error handling)
    allowed_mentions=discord.AllowedMentions(everyone=False, roles=False, users=True),
    max_messages=5000,                       # message cache size (default 1000, None disables)
    activity=discord.Game("/help"),          # initial presence
    status=discord.Status.online,
    member_cache_flags=discord.MemberCacheFlags.from_intents(intents),
    chunk_guilds_at_startup=True,            # download all members on startup (needs members intent)
)
```

## Running

```python
bot.run(token)                                   # sets up logging, handles Ctrl+C
bot.run(token, log_level=logging.DEBUG)          # more logs
bot.run(token, log_handler=None)                 # you configured logging yourself
```

For full control (e.g. running alongside a web server):

```python
async def main():
    async with bot:
        await bot.start(token)

asyncio.run(main())
```

## Useful properties

| Property | Meaning |
|---|---|
| `bot.user` | The bot's own user (None before login) |
| `bot.guilds` | Servers the bot is in |
| `bot.latency` | Gateway latency in **seconds** |
| `bot.get_guild(id)` / `get_channel(id)` / `get_user(id)` | Cache lookups (may return None) |
| `await bot.fetch_user(id)` / `fetch_channel(id)` | API lookups |
| `bot.is_ready()` | Has `on_ready` fired? |
| `await bot.wait_until_ready()` | Wait until the cache is filled |

## Closing cleanly

Override `close` to release resources:

```python
async def close(self) -> None:
    await super().close()
    await self.db.close()
```

## See also
- [Events](28-Events.md) · [Project Structure](38-Project-Structure.md) · [Events & Intents](../Events-and-Intents.md)
