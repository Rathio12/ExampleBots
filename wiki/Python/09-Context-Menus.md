# Context Menus

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key APIs** | `@tree.context_menu`, `app_commands.ContextMenu` |
| **Used in** | [03-expert leveling.py](../../python/03-expert/bot/cogs/leveling.py) (Show Rank), [utility.py](../../python/03-expert/bot/cogs/utility.py) (Bookmark) |

Context menus appear under right-click → **Apps** on a user or message. The parameter type decides which kind it is.

## Outside a cog

```python
@bot.tree.context_menu(name="Show Avatar")
async def show_avatar(interaction: discord.Interaction, member: discord.Member) -> None:   # Member/User → user menu
    await interaction.response.send_message(member.display_avatar.url, ephemeral=True)


@bot.tree.context_menu(name="Bookmark")
async def bookmark(interaction: discord.Interaction, message: discord.Message) -> None:     # Message → message menu
    await interaction.user.send(f"🔖 {message.jump_url}\n{message.content}")
    await interaction.response.send_message("Sent to your DMs!", ephemeral=True)
```

## Inside a cog

The decorator doesn't work on cog methods. Create the menu in `__init__` and add it to the tree, as the expert bot does:

```python
class Leveling(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot
        self.rank_menu = app_commands.ContextMenu(name="Show Rank", callback=self.show_rank)
        self.rank_menu.guild_only = True
        self.bot.tree.add_command(self.rank_menu)

    async def cog_unload(self) -> None:
        self.bot.tree.remove_command(self.rank_menu.name, type=self.rank_menu.type)

    async def show_rank(self, interaction: discord.Interaction, member: discord.Member) -> None:
        embed = await self.build_rank_embed(interaction.guild_id, member)
        await interaction.response.send_message(embed=embed, ephemeral=True)
```

Removing it in `cog_unload` lets you reload the cog without "already registered" errors.

## Permissions and contexts

```python
@bot.tree.context_menu(name="Quick Timeout")
@app_commands.default_permissions(moderate_members=True)
@app_commands.guild_only()
async def quick_timeout(interaction: discord.Interaction, member: discord.Member):
    await member.timeout(datetime.timedelta(minutes=10), reason=f"Quick timeout by {interaction.user}")
    await interaction.response.send_message(f"Timed out {member.mention} for 10 minutes.", ephemeral=True)
```

## Opening a modal from a context menu

```python
@bot.tree.context_menu(name="Report Message")
async def report(interaction: discord.Interaction, message: discord.Message):
    await interaction.response.send_modal(ReportModal(message))
```

## Rules

- Names: 1–32 characters, spaces and capitals allowed, no description and no options.
- Only a few context menus per type per app. Choose wisely.
- Sync the tree after adding them, like slash commands.

## See also
- [Slash Commands](04-Slash-Commands.md) · [Modals](14-Modals.md)
