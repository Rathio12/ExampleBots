"""General commands: /ping and /help."""
import time

import discord
from discord import app_commands
from discord.ext import commands

from ..utils.formatting import embed, ts


class General(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    @app_commands.command(description="Check latency and uptime")
    @app_commands.checks.cooldown(1, 5.0, key=lambda i: i.user.id)
    async def ping(self, interaction: discord.Interaction) -> None:
        started = time.perf_counter()
        await interaction.response.defer()
        round_trip = (time.perf_counter() - started) * 1000

        db_started = time.perf_counter()
        await self.bot.db.ping()  # proves the database is healthy
        db_ms = (time.perf_counter() - db_started) * 1000

        result = embed(title="🏓 Pong!")
        result.add_field(name="Gateway", value=f"{self.bot.latency * 1000:.0f}ms")
        result.add_field(name="Round-trip", value=f"{round_trip:.0f}ms")
        result.add_field(name="Database", value=f"{db_ms:.2f}ms")
        result.add_field(name="Online since", value=ts(self.bot.started_at))
        await interaction.followup.send(embed=result)

    @app_commands.command(description="List all commands by category")
    async def help(self, interaction: discord.Interaction) -> None:
        result = embed(title="📖 Help", description="Commands you lack permissions for are hidden by Discord.")

        # Each cog becomes one category.
        for cog_name, cog in self.bot.cogs.items():
            lines = [f"**/{cmd.name}** — {cmd.description}" for cmd in cog.get_app_commands()]
            if lines:
                result.add_field(name=cog_name, value="\n".join(lines), inline=False)

        menus = [cmd.name for cmd in self.bot.tree.get_commands(type=discord.AppCommandType.user)]
        menus += [cmd.name for cmd in self.bot.tree.get_commands(type=discord.AppCommandType.message)]
        if menus:
            result.add_field(name="Context menus (right-click → Apps)", value=", ".join(menus), inline=False)

        await interaction.response.send_message(embed=result, ephemeral=True)


async def setup(bot: commands.Bot) -> None:
    bot.started_at = time.time()
    await bot.add_cog(General(bot))
