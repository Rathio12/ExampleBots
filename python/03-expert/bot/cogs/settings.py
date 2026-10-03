"""Per-server settings: mod-log and audit-log channels."""
import discord
from discord import app_commands
from discord.ext import commands

from ..utils.formatting import embed

# Permissions the bot needs in a log channel.
REQUIRED = ("view_channel", "send_messages", "embed_links", "attach_files")


class Settings(commands.Cog):
    settings = app_commands.Group(
        name="settings",
        description="Configure the bot for this server",
        guild_only=True,
        default_permissions=discord.Permissions(manage_guild=True),
    )

    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    async def _check_channel(self, interaction: discord.Interaction, channel: discord.TextChannel) -> bool:
        perms = channel.permissions_for(interaction.guild.me)
        missing = [name for name in REQUIRED if not getattr(perms, name)]
        if missing:
            await interaction.response.send_message(f"❌ I need these permissions in {channel.mention}: {', '.join(missing)}", ephemeral=True)
            return False
        return True

    @settings.command(name="modlog", description="Set (or clear) the moderation log channel")
    @app_commands.describe(channel="Leave empty to disable")
    async def modlog(self, interaction: discord.Interaction, channel: discord.TextChannel | None = None) -> None:
        if channel and not await self._check_channel(interaction, channel):
            return
        await self.bot.db.settings.set_modlog_channel(interaction.guild_id, channel.id if channel else None)
        text = f"✅ Mod log will be sent to {channel.mention}." if channel else "✅ Mod log disabled."
        await interaction.response.send_message(text, ephemeral=True)

    @settings.command(name="auditlog", description="Set (or clear) the audit log channel (edits, deletes, joins, roles…)")
    @app_commands.describe(channel="Leave empty to disable")
    async def auditlog(self, interaction: discord.Interaction, channel: discord.TextChannel | None = None) -> None:
        if channel and not await self._check_channel(interaction, channel):
            return
        await self.bot.db.settings.set_auditlog_channel(interaction.guild_id, channel.id if channel else None)
        text = f"✅ Audit log will be sent to {channel.mention}." if channel else "✅ Audit log disabled."
        await interaction.response.send_message(text, ephemeral=True)

    @settings.command(name="view", description="Show current settings")
    async def view(self, interaction: discord.Interaction) -> None:
        current = await self.bot.db.settings.get(interaction.guild_id)

        def show(channel_id: int | None) -> str:
            return f"<#{channel_id}>" if channel_id else "*not set*"

        result = embed(title="⚙️ Settings")
        result.add_field(name="Mod log", value=show(current["modlog_channel_id"]))
        result.add_field(name="Audit log", value=show(current["auditlog_channel_id"]))
        await interaction.response.send_message(embed=result, ephemeral=True)


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Settings(bot))
