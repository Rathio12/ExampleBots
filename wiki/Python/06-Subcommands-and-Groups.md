# Subcommands & Groups

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key classes** | `app_commands.Group`, `commands.GroupCog` |
| **Used in** | [03-expert tags.py](../../python/03-expert/bot/cogs/tags.py), [reminders.py](../../python/03-expert/bot/cogs/reminders.py), [settings.py](../../python/03-expert/bot/cogs/settings.py) |

A `Group` turns a command into a parent of subcommands: `/tag show`, `/tag create`.

## Group as a cog attribute (used in the examples)

```python
class Tags(commands.Cog):
    tag = app_commands.Group(name="tag", description="Saved text snippets", guild_only=True)

    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    @tag.command(name="show", description="Post a tag")
    async def show(self, interaction: discord.Interaction, name: str) -> None:
        ...

    @tag.command(name="create", description="Create a tag")
    async def create(self, interaction: discord.Interaction, name: str, content: str) -> None:
        ...

    @tag.command(name="list", description="List tags")
    async def list_tags(self, interaction: discord.Interaction) -> None:   # avoid shadowing list()
        ...
```

Group options: `name`, `description`, `guild_only`, `default_permissions=discord.Permissions(manage_guild=True)`, `nsfw`, `parent` (for nesting).

## GroupCog: the whole cog is one group

```python
class Settings(commands.GroupCog, group_name="settings", group_description="Configure the bot"):
    @app_commands.command(name="view")
    async def view(self, interaction: discord.Interaction) -> None:
        ...

    @app_commands.command(name="logchannel")
    async def log_channel(self, interaction: discord.Interaction, channel: discord.TextChannel) -> None:
        ...
```

## Nested groups (subcommand groups)

```python
class Config(commands.Cog):
    config = app_commands.Group(name="config", description="Server configuration")
    logs = app_commands.Group(name="logs", description="Log channels", parent=config)

    @logs.command(name="set")
    async def logs_set(self, interaction, channel: discord.TextChannel): ...   # /config logs set

    @logs.command(name="disable")
    async def logs_disable(self, interaction): ...                             # /config logs disable

    @config.command(name="view")
    async def view(self, interaction): ...                                      # /config view
```

## Standalone groups (outside cogs)

```python
class Fun(app_commands.Group):
    @app_commands.command()
    async def coin(self, interaction: discord.Interaction):
        await interaction.response.send_message(random.choice(["Heads", "Tails"]))

bot.tree.add_command(Fun(name="fun", description="Fun commands"))   # /fun coin
```

## Permissions per group

`default_permissions` on the group applies to all its subcommands:

```python
settings = app_commands.Group(
    name="settings", description="Configure the bot",
    guild_only=True, default_permissions=discord.Permissions(manage_guild=True),
)
```

For a single stricter subcommand, add a runtime check:

```python
@tag.command(name="delete")
async def delete(self, interaction, name: str):
    if not interaction.permissions.manage_messages:
        return await interaction.response.send_message("You need Manage Messages.", ephemeral=True)
```

## Limits

25 subcommands per group, two levels max (`group → subgroup → command`).

## See also
- [Slash Commands](04-Slash-Commands.md) · [Project Structure](38-Project-Structure.md)
