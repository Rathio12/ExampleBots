# Slash Commands

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[Python portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key APIs** | `app_commands.command`, `CommandTree`, `tree.sync()`, `discord.Interaction` |
| **Used in** | [01-basic/bot.py](../../python/01-basic/bot.py) · [02-enhanced cogs](../../python/02-enhanced/bot/cogs) |

In discord.py, slash commands live in `discord.app_commands`. A **CommandTree** holds them, and `tree.sync()` uploads them to Discord.

## Defining a command

```python
@bot.tree.command(name="ping", description="Replies with Pong!")
async def ping(interaction: discord.Interaction) -> None:
    await interaction.response.send_message("Pong!")
```

- `name` defaults to the function name, and `description` to the docstring (or "…").
- The first parameter is always the `Interaction`.
- Additional parameters become **options** ([Command Options](05-Command-Options.md)).

```python
@bot.tree.command()
async def hello(interaction: discord.Interaction) -> None:
    """Say hello."""        # ← used as the description
    await interaction.response.send_message(f"Hi {interaction.user.mention}!")
```

## Commands in a cog

```python
from discord import app_commands
from discord.ext import commands


class General(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    @app_commands.command(description="Check latency")
    async def ping(self, interaction: discord.Interaction) -> None:
        await interaction.response.send_message(f"{self.bot.latency * 1000:.0f} ms")


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(General(bot))
```

Cog commands are added to `bot.tree` automatically when the cog loads.

## Decorators

| Decorator | Effect |
|---|---|
| `@app_commands.describe(param="…")` | Option descriptions |
| `@app_commands.rename(param="name")` | Option display name (e.g. Python keywords) |
| `@app_commands.guild_only()` | Not usable in DMs |
| `@app_commands.default_permissions(ban_members=True)` | Hidden from members without the permission |
| `@app_commands.checks.has_permissions(...)` | Runtime permission check |
| `@app_commands.checks.bot_has_permissions(...)` | Bot permission check |
| `@app_commands.checks.cooldown(1, 5.0)` | Cooldown ([article](33-Cooldowns.md)) |
| `@app_commands.guilds(discord.Object(id=…))` | Register only in specific guilds |
| `@app_commands.allowed_installs(guilds=True, users=True)` | User-installable apps |
| `@app_commands.allowed_contexts(guilds=True, dms=True, private_channels=True)` | Where it can be used |
| `@app_commands.choices(...)` | [Choices](07-Choices.md) |
| `@app_commands.autocomplete(...)` | [Autocomplete](08-Autocomplete.md) |

## Syncing

Commands must be **synced** to appear in Discord.

```python
class MyBot(commands.Bot):
    async def setup_hook(self) -> None:
        await self.load_extension("bot.cogs.general")

        if GUILD_ID:
            guild = discord.Object(id=GUILD_ID)
            self.tree.copy_global_to(guild=guild)   # copy global commands to the test guild
            synced = await self.tree.sync(guild=guild)   # instant
        else:
            synced = await self.tree.sync()              # global
        print(f"Synced {len(synced)} commands")
```

| | `tree.sync(guild=...)` | `tree.sync()` |
|---|---|---|
| Scope | One server | All servers |
| Appears | Instantly | Can take up to ~1 hour |

**Removing guild copies** after switching to global: `bot.tree.clear_commands(guild=guild)` then `await bot.tree.sync(guild=guild)`.

### Sync command (alternative to syncing on startup)

Many bots sync on demand with an owner-only prefix command:

```python
@commands.command()
@commands.is_owner()
async def sync(self, ctx: commands.Context) -> None:
    synced = await self.bot.tree.sync()
    await ctx.send(f"Synced {len(synced)} commands")
```

(Needs the message content intent, or invoke it by mentioning the bot.)

## The Interaction object

| Attribute | Meaning |
|---|---|
| `interaction.user` | Who ran it (`Member` in servers, `User` in DMs) |
| `interaction.guild` / `guild_id` | Server or None |
| `interaction.channel` / `channel_id` | Channel |
| `interaction.command` | The command object |
| `interaction.namespace` | Option values by name |
| `interaction.permissions` | The user's permissions in this channel |
| `interaction.app_permissions` | The bot's permissions in this channel |
| `interaction.locale` | User's language |
| `interaction.client` | The bot |
| `interaction.response` | Initial response methods |
| `interaction.followup` | Follow-up webhook |

## Full example

```python
import os
import discord
from discord import app_commands

GUILD = discord.Object(id=int(os.environ["GUILD_ID"]))


class Bot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.default())
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self):
        self.tree.copy_global_to(guild=GUILD)
        await self.tree.sync(guild=GUILD)


bot = Bot()


@bot.tree.command(description="Server info")
@app_commands.guild_only()
async def server(interaction: discord.Interaction):
    g = interaction.guild
    await interaction.response.send_message(f"**{g.name}** has {g.member_count} members.")


bot.run(os.environ["DISCORD_TOKEN"])
```

## Common mistakes

| Problem | Cause |
|---|---|
| Command not visible | Not synced, synced to another guild, or bot invited without `applications.commands` |
| Duplicate commands | Synced both globally and to the guild |
| `CommandSignatureMismatch` | Code changed but commands weren't re-synced |
| `CommandAlreadyRegistered` | Two commands with the same name |

## See also
- [Command Options](05-Command-Options.md) · [Responding to Interactions](10-Responding-to-Interactions.md) · [Slash Commands & Interactions](../Slash-Commands-and-Interactions.md)
