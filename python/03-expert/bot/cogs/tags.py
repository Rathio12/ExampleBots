"""Tags: saved text snippets with autocomplete."""
import re

import discord
from discord import app_commands
from discord.ext import commands

from ..utils.formatting import INFO, embed

NAME_PATTERN = re.compile(r"^[a-z0-9_-]{1,32}$")


class Tags(commands.Cog):
    tag = app_commands.Group(name="tag", description="Saved text snippets for this server", guild_only=True)

    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    # Called on every keystroke in an autocomplete option. Must answer within
    # 3 seconds with up to 25 choices.
    async def tag_name_autocomplete(self, interaction: discord.Interaction, current: str) -> list[app_commands.Choice[str]]:
        names = await self.bot.db.tags.search(interaction.guild_id, current.lower(), 25)
        return [app_commands.Choice(name=name, value=name) for name in names]

    @tag.command(name="show", description="Post a tag")
    @app_commands.autocomplete(name=tag_name_autocomplete)
    async def show(self, interaction: discord.Interaction, name: str) -> None:
        name = name.lower()
        row = await self.bot.db.tags.get(interaction.guild_id, name)
        if row is None:
            await interaction.response.send_message(f"❌ No tag named `{name}`.", ephemeral=True)
            return
        await self.bot.db.tags.use(interaction.guild_id, name)
        # Tags are user content: never let them ping anyone.
        await interaction.response.send_message(row["content"], allowed_mentions=discord.AllowedMentions.none())

    @tag.command(name="create", description="Create a tag")
    @app_commands.describe(name="Lowercase letters, numbers, - and _", content="What the tag says")
    async def create(
        self, interaction: discord.Interaction,
        name: app_commands.Range[str, 1, 32], content: app_commands.Range[str, 1, 2000],
    ) -> None:
        name = name.lower()
        if not NAME_PATTERN.match(name):
            await interaction.response.send_message("❌ Names may only contain `a-z`, `0-9`, `-` and `_`.", ephemeral=True)
            return
        created = await self.bot.db.tags.create(interaction.guild_id, name, content, interaction.user.id)
        text = f"✅ Created tag `{name}`." if created else f"❌ A tag named `{name}` already exists."
        await interaction.response.send_message(text, ephemeral=True)

    @tag.command(name="delete", description="Delete a tag (author or Manage Messages)")
    @app_commands.autocomplete(name=tag_name_autocomplete)
    async def delete(self, interaction: discord.Interaction, name: str) -> None:
        name = name.lower()
        row = await self.bot.db.tags.get(interaction.guild_id, name)
        if row is None:
            await interaction.response.send_message(f"❌ No tag named `{name}`.", ephemeral=True)
            return
        can_manage = interaction.permissions.manage_messages
        if row["author_id"] != interaction.user.id and not can_manage:
            await interaction.response.send_message("❌ You can only delete your own tags.", ephemeral=True)
            return
        await self.bot.db.tags.remove(interaction.guild_id, name)
        await interaction.response.send_message(f"🗑️ Deleted tag `{name}`.", ephemeral=True)

    @tag.command(name="list", description="List all tags")
    async def list_tags(self, interaction: discord.Interaction) -> None:
        rows = await self.bot.db.tags.list(interaction.guild_id)
        text = ", ".join(f"`{r['name']}` ({r['uses']})" for r in rows)
        result = embed(INFO, title=f"🏷️ Tags ({len(rows)})", description=text[:4000] or "No tags yet. Create one with `/tag create`.")
        await interaction.response.send_message(embed=result, ephemeral=True)


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Tags(bot))
