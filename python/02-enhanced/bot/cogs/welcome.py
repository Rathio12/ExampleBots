"""Welcomes new members. Needs the privileged Server Members intent."""
import logging

import discord
from discord.ext import commands

from ..embeds import SUCCESS, base_embed, relative_time

log = logging.getLogger(__name__)


class Welcome(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    # @commands.Cog.listener() subscribes a method to a gateway event.
    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member) -> None:
        channel_id = self.bot.config.welcome_channel_id
        if not channel_id:
            return

        channel = member.guild.get_channel(channel_id)
        if channel is None:  # the channel belongs to another server
            return

        embed = base_embed(SUCCESS, title=f"👋 Welcome to {member.guild.name}!")
        embed.description = f"Hey {member.mention}, glad you're here! You are member **#{member.guild.member_count}**."
        embed.set_thumbnail(url=member.display_avatar.with_size(256).url)
        embed.add_field(name="Account created", value=relative_time(member.created_at))
        try:
            await channel.send(embed=embed)
        except discord.HTTPException:
            log.exception("Failed to send welcome message")


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Welcome(bot))
