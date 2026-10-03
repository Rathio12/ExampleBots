"""Reminders that survive restarts.

Instead of one asyncio.sleep per reminder (lost on restart), a background task
polls the database every 15 seconds for reminders that are due.
"""
import logging
import time

import discord
from discord import app_commands
from discord.ext import commands, tasks

from ..utils.duration import format_duration, parse_duration
from ..utils.formatting import INFO, embed, truncate, ts

log = logging.getLogger(__name__)

MAX_SECONDS = 365 * 86_400
MAX_PER_USER = 25


class Reminders(commands.Cog):
    # A Group turns /remind into a parent command with subcommands.
    remind = app_commands.Group(name="remind", description="Reminders that survive bot restarts")

    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    async def cog_load(self) -> None:
        self.deliver_due.start()

    async def cog_unload(self) -> None:
        self.deliver_due.cancel()

    @remind.command(name="create", description="Create a reminder")
    @app_commands.describe(when="When? e.g. 10m, 2h, 1d12h, 2w", message="What should I remind you about?")
    @app_commands.rename(when="in")  # "in" is a Python keyword, so rename the option
    async def create(self, interaction: discord.Interaction, when: str, message: app_commands.Range[str, 1, 1000]) -> None:
        seconds = parse_duration(when)
        if not seconds or seconds > MAX_SECONDS:
            await interaction.response.send_message("❌ Use a duration like `30m`, `2h`, `1d` (max 365d).", ephemeral=True)
            return
        if await self.bot.db.reminders.count_for_user(interaction.user.id) >= MAX_PER_USER:
            await interaction.response.send_message(f"❌ You already have {MAX_PER_USER} reminders.", ephemeral=True)
            return

        remind_at = int(time.time()) + seconds
        reminder_id = await self.bot.db.reminders.add(interaction.user.id, interaction.channel_id, message, remind_at)
        await interaction.response.send_message(
            f"⏰ Reminder **#{reminder_id}** set for {ts(remind_at, 'f')} (in {format_duration(seconds)}).", ephemeral=True
        )

    @remind.command(name="list", description="List your reminders")
    async def list_reminders(self, interaction: discord.Interaction) -> None:
        rows = await self.bot.db.reminders.list_for_user(interaction.user.id)
        lines = [f"**#{r['id']}** • {ts(r['remind_at'])} — {truncate(r['message'], 80)}" for r in rows]
        result = embed(INFO, title="⏰ Your reminders", description="\n".join(lines) or "You have no reminders.")
        await interaction.response.send_message(embed=result, ephemeral=True)

    @remind.command(name="delete", description="Delete one of your reminders")
    @app_commands.describe(reminder_id="Reminder ID from /remind list")
    @app_commands.rename(reminder_id="id")
    async def delete(self, interaction: discord.Interaction, reminder_id: int) -> None:
        removed = await self.bot.db.reminders.remove_for_user(reminder_id, interaction.user.id)
        text = f"🗑️ Deleted reminder #{reminder_id}." if removed else f"❌ You have no reminder #{reminder_id}."
        await interaction.response.send_message(text, ephemeral=True)

    # ---------------------------------------------------------------- Delivery
    async def _deliver(self, row) -> None:
        reminder = embed(INFO, title="⏰ Reminder", description=truncate(row["message"], 4000))
        reminder.add_field(name="Set", value=ts(row["created_at"]))
        # Only ping the person who set the reminder.
        mentions = discord.AllowedMentions(everyone=False, roles=False, users=[discord.Object(id=row["user_id"])])

        channel = self.bot.get_channel(row["channel_id"])
        if channel is not None:
            try:
                await channel.send(f"<@{row['user_id']}>", embed=reminder, allowed_mentions=mentions)
                return
            except discord.HTTPException:
                pass  # no access any more — fall through to a DM

        # Channel deleted or not accessible? Fall back to a DM.
        try:
            user = await self.bot.fetch_user(row["user_id"])
            await user.send(embed=reminder)
        except discord.HTTPException as error:
            log.warning("Could not deliver reminder %s: %s", row["id"], error)

    @tasks.loop(seconds=15)
    async def deliver_due(self) -> None:
        for row in await self.bot.db.reminders.due():
            await self._deliver(row)
            await self.bot.db.reminders.remove(row["id"])

    @deliver_due.before_loop
    async def before_deliver_due(self) -> None:
        await self.bot.wait_until_ready()

    @deliver_due.error
    async def on_deliver_error(self, error: BaseException) -> None:
        log.exception("Reminder loop crashed — restarting", exc_info=error)
        self.deliver_due.restart()


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Reminders(bot))
