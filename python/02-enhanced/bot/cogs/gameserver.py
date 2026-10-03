"""Live game-server player counts: the /players command and a background status updater."""
import logging

import aiohttp
import discord
from discord import app_commands
from discord.ext import commands, tasks

from ..embeds import DANGER, SUCCESS, base_embed
from ..minecraft import fetch_minecraft_status

log = logging.getLogger(__name__)


class GameServer(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot
        self.config = bot.config
        self._last_channel_name: str | None = None

    async def cog_load(self) -> None:
        # Start the background loop only if a server address is configured.
        if self.config.game_server_address:
            self.update_status.change_interval(minutes=self.config.status_interval_minutes)
            self.update_status.start()
            log.info("Tracking %s every %d min", self.config.game_server_address, self.config.status_interval_minutes)

    async def cog_unload(self) -> None:
        self.update_status.cancel()

    @app_commands.command(description="Show the live player count of a Minecraft server")
    @app_commands.describe(address="Server address (default: the configured server)")
    @app_commands.checks.cooldown(1, 10.0, key=lambda i: i.user.id)
    async def players(self, interaction: discord.Interaction, address: app_commands.Range[str, 1, 100] | None = None) -> None:
        address = address or self.config.game_server_address
        if not address:
            await interaction.response.send_message("Please provide an `address` — no default server is configured.")
            return

        # HTTP calls can exceed Discord's 3-second limit, so defer first.
        await interaction.response.defer()
        try:
            status = await fetch_minecraft_status(self.bot.http_session, address)
        except (aiohttp.ClientError, TimeoutError) as error:
            await interaction.followup.send(f"⚠️ Could not reach the status API: {error}")
            return

        if not status.online:
            await interaction.followup.send(embed=base_embed(DANGER, title=f"🔴 {address} is offline"))
            return

        if status.player_names:
            names = ", ".join(status.player_names[:20]) + (" …" if len(status.player_names) > 20 else "")
        else:
            names = "*Player list hidden by the server*" if status.players else "*Nobody online*"

        embed = base_embed(SUCCESS, title=f"🟢 {address}")
        if status.motd:
            embed.description = f"```\n{status.motd}\n```"
        embed.add_field(name="👥 Players", value=f"{status.players}/{status.max_players}")
        embed.add_field(name="🧩 Version", value=status.version)
        embed.add_field(name="📋 Online now", value=names, inline=False)
        await interaction.followup.send(embed=embed)

    # tasks.loop runs this function repeatedly in the background.
    @tasks.loop(minutes=5)
    async def update_status(self) -> None:
        try:
            status = await fetch_minecraft_status(self.bot.http_session, self.config.game_server_address)
        except Exception as error:  # never let the loop die on a network hiccup
            log.warning("Could not update server status: %s", error)
            return

        label = f"{status.players}/{status.max_players} players" if status.online else "server offline"
        await self.bot.change_presence(activity=discord.Activity(type=discord.ActivityType.watching, name=label))

        if self.config.status_channel_id:
            name = f"🟢 Players: {status.players}/{status.max_players}" if status.online else "🔴 Server offline"
            # Only rename when something changed — renames are rate limited (2 / 10 min).
            if name != self._last_channel_name:
                channel = self.bot.get_channel(self.config.status_channel_id)
                if channel:
                    await channel.edit(name=name, reason="Player count update")
                    self._last_channel_name = name

    @update_status.before_loop
    async def before_update_status(self) -> None:
        await self.bot.wait_until_ready()


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(GameServer(bot))
