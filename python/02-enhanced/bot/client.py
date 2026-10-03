"""The bot class: loads cogs, syncs commands and handles command errors centrally."""
import logging

import aiohttp
import discord
from discord import app_commands
from discord.ext import commands

from .config import Config

log = logging.getLogger("bot")

# Every module in bot/cogs that should be loaded at startup.
EXTENSIONS = (
    "bot.cogs.general",
    "bot.cogs.interactive",
    "bot.cogs.gameserver",
    "bot.cogs.welcome",
)


class EnhancedTree(app_commands.CommandTree):
    """A CommandTree with one central error handler for every slash command."""

    async def on_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError) -> None:
        if isinstance(error, app_commands.CommandOnCooldown):
            message = f"⏳ Slow down! Try again in {error.retry_after:.0f}s."
        elif isinstance(error, app_commands.MissingPermissions):
            message = "🚫 You don't have permission to use this command."
        elif isinstance(error, app_commands.NoPrivateMessage):
            message = "This command only works inside a server."
        else:
            log.exception("Unhandled error in /%s", interaction.command.name if interaction.command else "?", exc_info=error)
            message = "⚠️ Something went wrong while running that command."

        if interaction.response.is_done():
            await interaction.followup.send(message, ephemeral=True)
        else:
            await interaction.response.send_message(message, ephemeral=True)


class EnhancedBot(commands.Bot):
    def __init__(self, config: Config) -> None:
        intents = discord.Intents.none()
        intents.guilds = True
        # Only request the privileged members intent when welcomes are enabled.
        # Requesting an intent you haven't enabled in the Developer Portal makes
        # login fail with PrivilegedIntentsRequired.
        if config.welcome_channel_id:
            intents.members = True

        # commands.Bot needs a prefix even if we only use slash commands.
        super().__init__(command_prefix=commands.when_mentioned, intents=intents, tree_cls=EnhancedTree)
        self.config = config
        self.http_session: aiohttp.ClientSession | None = None

    async def setup_hook(self) -> None:
        # One shared HTTP session for the whole bot (creating one per request is slow).
        self.http_session = aiohttp.ClientSession(headers={"User-Agent": "ExampleBots-DiscordBot/1.0"})

        for extension in EXTENSIONS:
            await self.load_extension(extension)
        log.info("Loaded %d extensions", len(EXTENSIONS))

        if self.config.guild_id:
            guild = discord.Object(id=self.config.guild_id)
            self.tree.copy_global_to(guild=guild)
            synced = await self.tree.sync(guild=guild)
            log.info("Synced %d commands to guild %s", len(synced), self.config.guild_id)
        else:
            synced = await self.tree.sync()
            log.info("Synced %d commands globally", len(synced))

    async def on_ready(self) -> None:
        log.info("✅ Logged in as %s — serving %d server(s)", self.user, len(self.guilds))

    async def close(self) -> None:
        if self.http_session:
            await self.http_session.close()
        await super().close()


def run() -> None:
    config = Config.from_env()
    bot = EnhancedBot(config)
    # log_level configures discord.py's default colourful logging handler.
    bot.run(config.token, log_level=getattr(logging, config.log_level, logging.INFO), root_logger=True)
