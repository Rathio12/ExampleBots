"""The audit-log service: a readable, permanent replacement for Discord's audit log.

Discord's built-in audit log only keeps 45 days and never shows message content.
Listeners in cogs/audit.py build embeds and call `send`. `find_executor` asks
Discord's own audit log *who* did something (e.g. who banned someone) — the bot
needs the "View Audit Log" permission for that.
"""
import logging

import discord

from ..database import Database

log = logging.getLogger(__name__)


class AuditLog:
    def __init__(self, db: Database) -> None:
        self.db = db

    async def channel_for(self, guild: discord.Guild) -> discord.TextChannel | None:
        channel_id = (await self.db.settings.get(guild.id))["auditlog_channel_id"]
        return guild.get_channel(channel_id) if channel_id else None

    async def send(self, guild: discord.Guild, entry: discord.Embed, file: discord.File | None = None) -> None:
        channel = await self.channel_for(guild)
        if channel is None:
            return
        try:
            kwargs = {"embed": entry, "allowed_mentions": discord.AllowedMentions.none()}
            if file:
                kwargs["file"] = file
            await channel.send(**kwargs)
        except discord.HTTPException as error:
            log.warning("Could not write to audit log in %s: %s", guild.id, error)

    @staticmethod
    async def find_executor(
        guild: discord.Guild, action: discord.AuditLogAction, target_id: int
    ) -> discord.AuditLogEntry | None:
        """Most recent matching audit-log entry from the last 15 seconds, if any."""
        try:
            async for entry in guild.audit_logs(limit=5, action=action):
                recent = (discord.utils.utcnow() - entry.created_at).total_seconds() < 15
                if entry.target is not None and entry.target.id == target_id and recent:
                    return entry
        except discord.HTTPException:
            pass  # missing View Audit Log permission — skip the executor
        return None
