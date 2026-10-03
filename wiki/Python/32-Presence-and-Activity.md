# Presence & Activity

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[Python portal](README.md) › Events</sub>

| | |
|---|---|
| **Key APIs** | `change_presence`, `discord.Game`, `discord.Activity`, `discord.Streaming`, `discord.CustomActivity`, `discord.Status` |
| **Used in** | [02-enhanced gameserver.py](../../python/02-enhanced/bot/cogs/gameserver.py) · [03-expert core.py](../../python/03-expert/bot/core.py) |

## Setting the activity

```python
await bot.change_presence(activity=discord.Game("Minecraft"))                                       # Playing Minecraft
await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.watching, name="12/100 players"))
await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.listening, name="/help"))
await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.competing, name="the tournament"))
await bot.change_presence(activity=discord.Streaming(name="Live coding", url="https://twitch.tv/yourchannel"))
await bot.change_presence(activity=discord.CustomActivity(name="🛠️ Under maintenance"))           # custom status text
```

## Status

```python
await bot.change_presence(status=discord.Status.idle, activity=discord.Game("AFK"))
# online, idle, dnd (do_not_disturb), invisible
```

`change_presence` replaces both values, so pass the activity again if you only want to change the status.

## Presence at startup

```python
bot = commands.Bot(
    command_prefix=commands.when_mentioned,
    intents=intents,
    activity=discord.Activity(type=discord.ActivityType.listening, name="/help"),
    status=discord.Status.online,
)
```

This is also re-applied automatically after reconnects.

## Rotating status with tasks

```python
from discord.ext import tasks
import itertools

class Status(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot
        self.messages = itertools.cycle([
            lambda: f"{len(self.bot.guilds)} servers",
            lambda: "/help",
        ])

    async def cog_load(self) -> None:
        self.rotate.start()

    @tasks.loop(minutes=1)
    async def rotate(self) -> None:
        text = next(self.messages)()
        await self.bot.change_presence(activity=discord.Activity(type=discord.ActivityType.watching, name=text))

    @rotate.before_loop
    async def before(self) -> None:
        await self.bot.wait_until_ready()
```

## Live game-server data (Enhanced bot)

```python
label = f"{status.players}/{status.max_players} players" if status.online else "server offline"
await self.bot.change_presence(activity=discord.Activity(type=discord.ActivityType.watching, name=label))
```

## See also
- [Background Tasks](35-Background-Tasks.md) · [Use-Case Recipes → Game-server player count](../Use-Case-Recipes.md#game-server-player-count)
