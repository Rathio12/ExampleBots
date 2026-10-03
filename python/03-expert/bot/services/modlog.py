"""Sends a record of every moderation action to the server's mod-log channel."""
import logging

import discord

from ..database import Database
from ..utils.formatting import DANGER, NEUTRAL, PRIMARY, SUCCESS, WARNING, embed, user_label

log = logging.getLogger(__name__)

ACTION_COLOURS = {
    "Warn": WARNING,
    "Clear warnings": NEUTRAL,
    "Timeout": WARNING,
    "Remove timeout": SUCCESS,
    "Kick": DANGER,
    "Ban": DANGER,
    "Unban": SUCCESS,
    "Purge": NEUTRAL,
}


class ModLog:
    def __init__(self, db: Database) -> None:
        self.db = db

    async def log(
        self,
        guild: discord.Guild,
        *,
        action: str,
        moderator: discord.abc.User,
        target: discord.abc.User | None = None,
        reason: str | None = None,
        fields: list[tuple[str, str, bool]] | None = None,
    ) -> None:
        channel_id = (await self.db.settings.get(guild.id))["modlog_channel_id"]
        channel = guild.get_channel(channel_id) if channel_id else None
        if channel is None:
            return

        entry = embed(ACTION_COLOURS.get(action, PRIMARY), title=f"🛡️ {action}")
        if target:
            entry.add_field(name="Member", value=user_label(target))
            entry.set_footer(text=f"User ID: {target.id}")
        entry.add_field(name="Moderator", value=user_label(moderator))
        for name, value, inline in fields or []:
            entry.add_field(name=name, value=value, inline=inline)
        entry.add_field(name="Reason", value=reason or "No reason provided", inline=False)

        try:
            await channel.send(embed=entry, allowed_mentions=discord.AllowedMentions.none())
        except discord.HTTPException as error:
            log.warning("Could not write to mod-log in %s: %s", guild.id, error)

    @staticmethod
    async def notify(user: discord.abc.User, guild: discord.Guild, text: str) -> bool:
        """DM the member before an action. Failing (DMs closed) is fine."""
        try:
            await user.send(f"**{guild.name}:** {text}")
            return True
        except discord.HTTPException:
            return False
