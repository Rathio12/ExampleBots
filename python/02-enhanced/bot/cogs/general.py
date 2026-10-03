"""General commands: /ping, /help, /serverinfo, /userinfo.

A Cog is a class that groups related commands and listeners. Each cog lives in
its own module and is loaded with bot.load_extension().
"""
import time

import discord
from discord import app_commands
from discord.ext import commands

from ..embeds import base_embed, relative_time


class General(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    @app_commands.command(description="Check the bot latency")
    @app_commands.checks.cooldown(1, 5.0, key=lambda i: i.user.id)  # 1 use per 5s per user
    async def ping(self, interaction: discord.Interaction) -> None:
        started = time.perf_counter()
        # defer() acknowledges the interaction ("Bot is thinking…").
        await interaction.response.defer()
        round_trip = (time.perf_counter() - started) * 1000

        embed = base_embed(title="🏓 Pong!")
        embed.add_field(name="Gateway", value=f"{self.bot.latency * 1000:.0f}ms")
        embed.add_field(name="API round-trip", value=f"{round_trip:.0f}ms")
        await interaction.followup.send(embed=embed)

    @app_commands.command(description="List every command")
    async def help(self, interaction: discord.Interaction) -> None:
        # Built from the command tree, so it never goes out of date.
        lines = sorted(f"**/{cmd.name}** — {cmd.description}" for cmd in self.bot.tree.get_commands())
        embed = base_embed(title="📖 Commands", description="\n".join(lines))
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(description="Show information about this server")
    @app_commands.guild_only()
    async def serverinfo(self, interaction: discord.Interaction) -> None:
        guild = interaction.guild
        embed = base_embed(title=guild.name)
        if guild.icon:
            embed.set_thumbnail(url=guild.icon.url)
        embed.add_field(name="👑 Owner", value=f"<@{guild.owner_id}>")
        embed.add_field(name="👥 Members", value=str(guild.member_count))
        embed.add_field(name="🚀 Boosts", value=str(guild.premium_subscription_count))
        embed.add_field(name="💬 Channels", value=str(len(guild.channels)))
        embed.add_field(name="🎭 Roles", value=str(len(guild.roles)))
        embed.add_field(name="📅 Created", value=relative_time(guild.created_at))
        embed.set_footer(text=f"ID: {guild.id}")
        await interaction.response.send_message(embed=embed)

    @app_commands.command(description="Show information about a member")
    @app_commands.guild_only()
    @app_commands.describe(member="Who? (default: you)")
    async def userinfo(self, interaction: discord.Interaction, member: discord.Member | None = None) -> None:
        # Typing the option as discord.Member gives us server-specific data
        # (roles, nickname, join date) instead of a plain discord.User.
        member = member or interaction.user
        roles = [role.mention for role in reversed(member.roles) if role != interaction.guild.default_role]

        embed = base_embed(colour=member.colour if member.colour.value else discord.Colour.blurple())
        embed.set_author(name=str(member), icon_url=member.display_avatar.url)
        embed.set_thumbnail(url=member.display_avatar.with_size(256).url)
        embed.add_field(name="🆔 ID", value=str(member.id))
        embed.add_field(name="🤖 Bot", value="Yes" if member.bot else "No")
        embed.add_field(name="📅 Account created", value=relative_time(member.created_at))
        embed.add_field(name="📥 Joined server", value=relative_time(member.joined_at))
        value = " ".join(roles[:15]) + (" …" if len(roles) > 15 else "")
        embed.add_field(name=f"🎭 Roles ({len(roles)})", value=value or "None", inline=False)
        await interaction.response.send_message(embed=embed)


# Every extension module needs an async `setup` function.
async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(General(bot))
