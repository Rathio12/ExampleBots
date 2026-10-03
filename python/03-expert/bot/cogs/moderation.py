"""Moderation: warn, warnings, clearwarnings, timeout, untimeout, kick, ban, unban, purge.

`default_permissions` hides a command from members without that permission
(server admins can override this in Server Settings → Integrations).
`bot_has_permissions` makes sure the bot itself can perform the action.
"""
from datetime import timedelta

import discord
from discord import app_commands
from discord.ext import commands

from ..utils.checks import check_hierarchy
from ..utils.duration import format_duration, parse_duration
from ..utils.formatting import SUCCESS, WARNING, embed, truncate, ts, user_label

MAX_TIMEOUT = 28 * 86_400  # Discord's limit is 28 days


def audit_reason(interaction: discord.Interaction, reason: str) -> str:
    """Audit-log reasons show 'Moderator: reason' so the real moderator is visible."""
    return f"{interaction.user}: {reason}"[:512]


async def ensure_can_moderate(interaction: discord.Interaction, member: discord.Member) -> bool:
    problem = check_hierarchy(interaction.user, member)
    if problem:
        await interaction.response.send_message(f"❌ {problem}", ephemeral=True)
        return False
    return True


class Moderation(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    # ------------------------------------------------------------------ Warnings
    @app_commands.command(description="Warn a member (stored permanently)")
    @app_commands.guild_only()
    @app_commands.default_permissions(moderate_members=True)
    @app_commands.describe(member="Member to warn", reason="Why?")
    async def warn(self, interaction: discord.Interaction, member: discord.Member, reason: app_commands.Range[str, 1, 500]) -> None:
        if not await ensure_can_moderate(interaction, member):
            return

        warning_id = await self.bot.db.warnings.add(interaction.guild_id, member.id, interaction.user.id, reason)
        count = len(await self.bot.db.warnings.list(interaction.guild_id, member.id))

        dm_sent = await self.bot.modlog.notify(member, interaction.guild, f"You were warned: {reason}")
        await self.bot.modlog.log(
            interaction.guild, action="Warn", target=member, moderator=interaction.user,
            reason=reason, fields=[("Total warnings", str(count), True)],
        )

        result = embed(WARNING, description=f"⚠️ Warned {user_label(member)} (warning #{warning_id}, total {count}).")
        result.set_footer(text="The member was notified by DM." if dm_sent else "Could not DM the member.")
        await interaction.response.send_message(embed=result, ephemeral=True)

    @app_commands.command(description="List a member's warnings")
    @app_commands.guild_only()
    @app_commands.default_permissions(moderate_members=True)
    async def warnings(self, interaction: discord.Interaction, user: discord.User) -> None:
        rows = await self.bot.db.warnings.list(interaction.guild_id, user.id)
        lines = [
            f"**#{row['id']}** • {ts(row['created_at'])} by <@{row['moderator_id']}>\n> {truncate(row['reason'], 200)}"
            for row in rows[:15]
        ]
        result = embed(WARNING if rows else SUCCESS, description="\n\n".join(lines) or "No warnings. ✨")
        result.set_author(name=f"{user} — {len(rows)} warning(s)", icon_url=user.display_avatar.url)
        if len(rows) > 15:
            result.set_footer(text=f"Showing the 15 most recent of {len(rows)}")
        await interaction.response.send_message(embed=result, ephemeral=True, allowed_mentions=discord.AllowedMentions.none())

    @app_commands.command(description="Delete all warnings of a member")
    @app_commands.guild_only()
    @app_commands.default_permissions(manage_guild=True)
    async def clearwarnings(
        self, interaction: discord.Interaction, user: discord.User, reason: app_commands.Range[str, 1, 500] | None = None
    ) -> None:
        removed = await self.bot.db.warnings.clear(interaction.guild_id, user.id)
        if removed:
            await self.bot.modlog.log(
                interaction.guild, action="Clear warnings", target=user, moderator=interaction.user,
                reason=reason, fields=[("Removed", str(removed), True)],
            )
        text = f"🧹 Removed {removed} warning(s) from **{user}**." if removed else f"**{user}** has no warnings."
        await interaction.response.send_message(text, ephemeral=True)

    # ------------------------------------------------------------------ Timeouts
    @app_commands.command(description="Temporarily mute a member")
    @app_commands.guild_only()
    @app_commands.default_permissions(moderate_members=True)
    @app_commands.checks.bot_has_permissions(moderate_members=True)
    @app_commands.describe(duration="e.g. 10m, 1h, 1d12h (max 28d)")
    async def timeout(
        self, interaction: discord.Interaction, member: discord.Member, duration: str,
        reason: app_commands.Range[str, 1, 500] | None = None,
    ) -> None:
        seconds = parse_duration(duration)
        if not seconds or seconds > MAX_TIMEOUT:
            await interaction.response.send_message("❌ Use a duration like `10m`, `2h` or `1d` (max 28d).", ephemeral=True)
            return
        if not await ensure_can_moderate(interaction, member):
            return

        reason = reason or "No reason provided"
        await member.timeout(timedelta(seconds=seconds), reason=audit_reason(interaction, reason))

        ends_at = discord.utils.utcnow().timestamp() + seconds
        await self.bot.modlog.notify(member, interaction.guild, f"You were timed out for {format_duration(seconds)}: {reason}")
        await self.bot.modlog.log(
            interaction.guild, action="Timeout", target=member, moderator=interaction.user, reason=reason,
            fields=[("Duration", format_duration(seconds), True), ("Ends", ts(ends_at), True)],
        )
        await interaction.response.send_message(f"🔇 {user_label(member)} is timed out until {ts(ends_at, 'f')}.", ephemeral=True)

    @app_commands.command(description="Remove a member's timeout")
    @app_commands.guild_only()
    @app_commands.default_permissions(moderate_members=True)
    @app_commands.checks.bot_has_permissions(moderate_members=True)
    async def untimeout(
        self, interaction: discord.Interaction, member: discord.Member, reason: app_commands.Range[str, 1, 500] | None = None
    ) -> None:
        if not await ensure_can_moderate(interaction, member):
            return
        if not member.is_timed_out():
            await interaction.response.send_message("That member is not timed out.", ephemeral=True)
            return

        reason = reason or "No reason provided"
        await member.timeout(None, reason=audit_reason(interaction, reason))  # None = remove
        await self.bot.modlog.log(interaction.guild, action="Remove timeout", target=member, moderator=interaction.user, reason=reason)
        await interaction.response.send_message(f"🔊 Removed the timeout from {user_label(member)}.", ephemeral=True)

    # ------------------------------------------------------------- Kick and ban
    @app_commands.command(description="Kick a member from the server")
    @app_commands.guild_only()
    @app_commands.default_permissions(kick_members=True)
    @app_commands.checks.bot_has_permissions(kick_members=True)
    async def kick(
        self, interaction: discord.Interaction, member: discord.Member, reason: app_commands.Range[str, 1, 500] | None = None
    ) -> None:
        if not await ensure_can_moderate(interaction, member):
            return

        reason = reason or "No reason provided"
        # DM first — after the kick we may no longer share a server.
        await self.bot.modlog.notify(member, interaction.guild, f"You were kicked: {reason}")
        await member.kick(reason=audit_reason(interaction, reason))

        await self.bot.modlog.log(interaction.guild, action="Kick", target=member, moderator=interaction.user, reason=reason)
        await interaction.response.send_message(f"👢 Kicked {user_label(member)}.", ephemeral=True)

    @app_commands.command(description="Ban a user (works even if they already left)")
    @app_commands.guild_only()
    @app_commands.default_permissions(ban_members=True)
    @app_commands.checks.bot_has_permissions(ban_members=True)
    @app_commands.describe(delete_messages="Delete their recent messages")
    @app_commands.choices(
        delete_messages=[
            app_commands.Choice(name="Don't delete any", value=0),
            app_commands.Choice(name="Previous hour", value=3600),
            app_commands.Choice(name="Previous 24 hours", value=86_400),
            app_commands.Choice(name="Previous 7 days", value=604_800),
        ]
    )
    async def ban(
        self, interaction: discord.Interaction, user: discord.User,
        reason: app_commands.Range[str, 1, 500] | None = None,
        delete_messages: app_commands.Choice[int] | None = None,
    ) -> None:
        reason = reason or "No reason provided"
        member = interaction.guild.get_member(user.id)
        # Hierarchy only matters if they are still a member.
        if member:
            if not await ensure_can_moderate(interaction, member):
                return
            await self.bot.modlog.notify(member, interaction.guild, f"You were banned: {reason}")

        await interaction.guild.ban(
            user,
            reason=audit_reason(interaction, reason),
            delete_message_seconds=delete_messages.value if delete_messages else 0,
        )
        await self.bot.modlog.log(interaction.guild, action="Ban", target=user, moderator=interaction.user, reason=reason)
        await interaction.response.send_message(f"🔨 Banned {user_label(user)}.", ephemeral=True)

    @app_commands.command(description="Unban a user by ID")
    @app_commands.guild_only()
    @app_commands.default_permissions(ban_members=True)
    @app_commands.checks.bot_has_permissions(ban_members=True)
    @app_commands.describe(user_id="ID of the banned user")
    async def unban(
        self, interaction: discord.Interaction, user_id: str, reason: app_commands.Range[str, 1, 500] | None = None
    ) -> None:
        # Banned users aren't members, so a user option can't select them —
        # we accept the raw ID as text instead.
        if not user_id.strip().isdigit():
            await interaction.response.send_message("❌ That is not a valid user ID.", ephemeral=True)
            return

        reason = reason or "No reason provided"
        try:
            await interaction.guild.unban(discord.Object(id=int(user_id)), reason=audit_reason(interaction, reason))
        except discord.NotFound:
            await interaction.response.send_message("❌ That user is not banned.", ephemeral=True)
            return

        user = await self.bot.fetch_user(int(user_id))
        await self.bot.modlog.log(interaction.guild, action="Unban", target=user, moderator=interaction.user, reason=reason)
        await interaction.response.send_message(f"✅ Unbanned **{user}**.", ephemeral=True)

    # -------------------------------------------------------------------- Purge
    @app_commands.command(description="Bulk-delete recent messages in this channel")
    @app_commands.guild_only()
    @app_commands.default_permissions(manage_messages=True)
    @app_commands.checks.bot_has_permissions(manage_messages=True, read_message_history=True)
    @app_commands.checks.cooldown(1, 5.0, key=lambda i: i.user.id)
    @app_commands.describe(amount="How many messages to check (1-100)", user="Only delete messages from this user")
    async def purge(
        self, interaction: discord.Interaction, amount: app_commands.Range[int, 1, 100], user: discord.User | None = None
    ) -> None:
        await interaction.response.defer(ephemeral=True)

        # Discord can only bulk-delete messages younger than 14 days.
        cutoff = discord.utils.utcnow() - timedelta(days=14)
        deleted = await interaction.channel.purge(
            limit=amount,
            check=(lambda m: m.author.id == user.id) if user else None,
            after=cutoff,
            oldest_first=False,
            reason=audit_reason(interaction, "purge"),
        )

        fields = [("Channel", interaction.channel.mention, True), ("Deleted", str(len(deleted)), True)]
        if user:
            fields.append(("Filter", user.mention, True))
        await self.bot.modlog.log(interaction.guild, action="Purge", moderator=interaction.user, fields=fields)
        await interaction.followup.send(f"🧹 Deleted **{len(deleted)}** message(s).", ephemeral=True)


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Moderation(bot))
