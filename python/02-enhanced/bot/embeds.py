"""Shared embed colours and helpers so every reply looks consistent."""
from datetime import datetime

import discord

PRIMARY = discord.Colour(0x5865F2)
SUCCESS = discord.Colour(0x57F287)
WARNING = discord.Colour(0xFEE75C)
DANGER = discord.Colour(0xED4245)


def base_embed(colour: discord.Colour = PRIMARY, **kwargs) -> discord.Embed:
    return discord.Embed(colour=colour, timestamp=discord.utils.utcnow(), **kwargs)


def relative_time(moment: datetime | None) -> str:
    """Render a Discord timestamp like "3 days ago" (shown in each user's timezone)."""
    return discord.utils.format_dt(moment, "R") if moment else "Unknown"
