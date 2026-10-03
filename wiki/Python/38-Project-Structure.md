# Project Structure

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key APIs** | `commands.Cog`, `bot.load_extension`, `async def setup(bot)` |
| **Used in** | [02-enhanced/bot/](../../python/02-enhanced/bot) · [03-expert/bot/](../../python/03-expert/bot) |

## Recommended layout

```
my-bot/
├── requirements.txt
├── .env
└── bot/                    a package: run with `python -m bot`
    ├── __init__.py
    ├── __main__.py         entry point
    ├── core.py             Bot subclass: setup_hook, close, error handling
    ├── config.py           frozen dataclass from .env
    ├── database.py         connection, migrations, repositories
    ├── services/           shared logic (mod log, audit log, API clients)
    ├── utils/              pure helpers (easy to test)
    └── cogs/               one file per feature
        ├── general.py
        ├── moderation.py
        └── tags.py
tests/
```

## Cogs and extensions

An **extension** is a module with an async `setup(bot)` function. A **cog** is a class that groups commands and listeners.

```python
# bot/cogs/general.py
import discord
from discord import app_commands
from discord.ext import commands


class General(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    @app_commands.command(description="Latency")
    async def ping(self, interaction: discord.Interaction) -> None:
        await interaction.response.send_message(f"{self.bot.latency * 1000:.0f} ms")

    @commands.Cog.listener()
    async def on_guild_join(self, guild: discord.Guild) -> None:
        print("Joined", guild.name)


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(General(bot))
```

## Loading extensions

```python
EXTENSIONS = ("bot.cogs.general", "bot.cogs.moderation", "bot.cogs.tags")

class MyBot(commands.Bot):
    async def setup_hook(self) -> None:
        for ext in EXTENSIONS:
            await self.load_extension(ext)
```

Or discover them automatically:

```python
import pkgutil
import bot.cogs as cogs_pkg

for module in pkgutil.iter_modules(cogs_pkg.__path__):
    await self.load_extension(f"bot.cogs.{module.name}")
```

Hot-reload while developing: `await bot.reload_extension("bot.cogs.tags")` (then re-sync if commands changed).

## Cog lifecycle hooks

| Hook | When |
|---|---|
| `async def cog_load(self)` | After the cog is added (start tasks, open resources) |
| `async def cog_unload(self)` | Before removal (cancel tasks, remove context menus) |
| `async def cog_app_command_error(self, interaction, error)` | Errors from this cog's slash commands |
| `async def interaction_check(self, interaction)` | Runs before every slash command in the cog |

## Sharing dependencies

Create shared objects once on the bot (the "composition root") and reach them from cogs:

```python
class ExpertBot(commands.Bot):
    async def setup_hook(self) -> None:
        self.db = await Database.open(self.config.database_path)
        self.modlog = ModLog(self.db)
        self.audit = AuditLog(self.db)
        ...

# in any cog
await self.bot.db.warnings.add(...)
await self.bot.modlog.log(...)
```

## `__main__.py`

```python
from .core import run
run()
```

Run with `python -m bot` from the project root, so imports like `from .config import Config` work.

## See also
- [Client & Intents](02-Client-and-Intents.md) · [Testing](41-Testing.md)
