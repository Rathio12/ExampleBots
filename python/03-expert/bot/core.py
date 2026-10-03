"""The ExpertBot class — the composition root.

It creates every shared dependency once (database, mod log, audit log) and
exposes them as attributes, so any cog can use `self.bot.db`, `self.bot.modlog`…
"""
import asyncio
import logging
import signal

import discord
from discord import app_commands
from discord.ext import commands

from .config import Config
from .database import Database
from .logging_setup import setup_logging
from .services.auditlog import AuditLog
from .services.modlog import ModLog

log = logging.getLogger("bot")

EXTENSIONS = (
    "bot.cogs.general",
    "bot.cogs.leveling",
    "bot.cogs.moderation",
    "bot.cogs.reminders",
    "bot.cogs.tags",
    "bot.cogs.settings",
    "bot.cogs.utility",
    "bot.cogs.audit",
)


class ExpertTree(app_commands.CommandTree):
    """Central error handling for every slash command and context menu."""

    async def on_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError) -> None:
        if isinstance(error, app_commands.CommandOnCooldown):
            message = f"⏳ Try again in {error.retry_after:.0f}s."
        elif isinstance(error, app_commands.MissingPermissions):
            message = f"🚫 You need: {', '.join(error.missing_permissions)}"
        elif isinstance(error, app_commands.BotMissingPermissions):
            message = f"🚫 I need these permissions: {', '.join(error.missing_permissions)}"
        elif isinstance(error, app_commands.NoPrivateMessage):
            message = "This command only works inside a server."
        else:
            name = interaction.command.qualified_name if interaction.command else "?"
            log.exception("Command %s failed", name, exc_info=error)
            message = "⚠️ Something went wrong. The error has been logged."

        if interaction.response.is_done():
            await interaction.followup.send(message, ephemeral=True)
        else:
            await interaction.response.send_message(message, ephemeral=True)


class ExpertBot(commands.Bot):
    db: Database
    modlog: ModLog
    audit: AuditLog

    def __init__(self, config: Config) -> None:
        intents = discord.Intents.default()  # guilds, messages, bans/moderation, voice states…
        intents.members = True  # privileged: joins, leaves, role changes
        intents.message_content = True  # privileged: content in edit/delete logs

        super().__init__(
            command_prefix=commands.when_mentioned,
            intents=intents,
            tree_cls=ExpertTree,
            # Safety default: never ping @everyone/@here or roles unless explicitly allowed.
            allowed_mentions=discord.AllowedMentions(everyone=False, roles=False, users=True),
            # Messages kept in memory so edit/delete logs can show old content.
            max_messages=5000,
            activity=discord.Activity(type=discord.ActivityType.listening, name="/help"),
        )
        self.config = config

    async def setup_hook(self) -> None:
        self.db = await Database.open(self.config.database_path)
        self.modlog = ModLog(self.db)
        self.audit = AuditLog(self.db)

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

        # Graceful shutdown on SIGTERM (Docker, systemd). Ctrl+C is handled by run().
        try:
            asyncio.get_running_loop().add_signal_handler(signal.SIGTERM, lambda: asyncio.create_task(self.close()))
        except (NotImplementedError, AttributeError):
            pass  # Windows does not support add_signal_handler

    async def on_ready(self) -> None:
        log.info("Logged in as %s — %d guild(s)", self.user, len(self.guilds))

    async def close(self) -> None:
        log.info("Shutting down…")
        await super().close()
        if hasattr(self, "db"):
            await self.db.close()


def run() -> None:
    config = Config.from_env()
    setup_logging(config.log_level, config.json_logs)
    bot = ExpertBot(config)
    # log_handler=None: we already configured logging ourselves.
    bot.run(config.token, log_handler=None)
