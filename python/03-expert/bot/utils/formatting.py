"""Formatting helpers shared by commands and the audit log."""
import discord

PRIMARY = discord.Colour(0x5865F2)
SUCCESS = discord.Colour(0x57F287)
WARNING = discord.Colour(0xFEE75C)
DANGER = discord.Colour(0xED4245)
INFO = discord.Colour(0x3498DB)
NEUTRAL = discord.Colour(0x99AAB5)


def embed(colour: discord.Colour = PRIMARY, **kwargs) -> discord.Embed:
    return discord.Embed(colour=colour, timestamp=discord.utils.utcnow(), **kwargs)


def truncate(text: str | None, limit: int = 1024) -> str:
    """Embed fields max out at 1024 characters — always truncate user content."""
    if not text:
        return ""
    return text if len(text) <= limit else text[: limit - 1] + "…"


def user_label(user: discord.abc.User | None) -> str:
    """'<@id> `name`' — clickable mention plus a name that survives if they leave."""
    return f"{user.mention} `{user}`" if user else "Unknown"


def ts(seconds: int | float, style: str = "R") -> str:
    """Discord timestamp tag, rendered in each viewer's own timezone."""
    return f"<t:{int(seconds)}:{style}>"
