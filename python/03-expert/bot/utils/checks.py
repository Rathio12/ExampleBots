"""Role-hierarchy checks for moderation commands.

Discord refuses actions on members above the bot anyway, but checking first lets
us show a friendly message instead of an API error.
"""
import discord


def check_hierarchy(moderator: discord.Member, target: discord.Member) -> str | None:
    """Return an error message, or None if the action is allowed."""
    guild = target.guild
    me = guild.me

    if target.id == moderator.id:
        return "You can't use this on yourself."
    if target.id == guild.owner_id:
        return "You can't moderate the server owner."
    if target.id == me.id:
        return "I won't moderate myself. 🙃"
    if moderator.id != guild.owner_id and moderator.top_role <= target.top_role:
        return "That member has an equal or higher role than you."
    if me.top_role <= target.top_role:
        return "My highest role is not above that member — move my role higher in Server Settings → Roles."
    return None
