"""Utility: the "Bookmark" message context menu."""
import discord
from discord import app_commands
from discord.ext import commands

from ..utils.formatting import INFO, embed, truncate


class Utility(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot
        # Right-click a message → Apps → Bookmark
        self.bookmark_menu = app_commands.ContextMenu(name="Bookmark", callback=self.bookmark)
        self.bookmark_menu.guild_only = True
        self.bot.tree.add_command(self.bookmark_menu)

    async def cog_unload(self) -> None:
        self.bot.tree.remove_command(self.bookmark_menu.name, type=self.bookmark_menu.type)

    async def bookmark(self, interaction: discord.Interaction, message: discord.Message) -> None:
        saved = embed(INFO, description=truncate(message.content, 4000) or "*No text content*")
        saved.set_author(name=str(message.author), icon_url=message.author.display_avatar.url)
        saved.add_field(name="Source", value=f"[Jump to message]({message.jump_url}) in {message.channel.mention}")

        image = next((a for a in message.attachments if (a.content_type or "").startswith("image/")), None)
        if image:
            saved.set_image(url=image.url)

        try:
            await interaction.user.send("🔖 Bookmarked message:", embed=saved)
            await interaction.response.send_message("🔖 Sent to your DMs!", ephemeral=True)
        except discord.HTTPException:
            await interaction.response.send_message("❌ I could not DM you — check your privacy settings.", ephemeral=True)


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Utility(bot))
