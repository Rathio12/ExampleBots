"""Audit log: a readable, permanent replacement for Discord's built-in audit log.

Logs message edits/deletes (with content), bulk deletes (with a transcript),
joins/leaves/kicks, nickname/role/timeout changes, bans/unbans, channel and role
changes, and voice activity. Configure the channel with /settings auditlog.

Raw events (on_raw_*) fire even for messages that are not in the cache; the
cached copy — if any — is attached to the payload.
"""
import io
from datetime import timedelta

import discord
from discord.ext import commands

from ..utils.formatting import DANGER, INFO, NEUTRAL, SUCCESS, WARNING, embed, truncate, user_label

NEW_ACCOUNT_DAYS = 7


class Audit(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    async def _enabled(self, guild: discord.Guild | None) -> bool:
        return guild is not None and (await self.bot.db.settings.get(guild.id))["auditlog_channel_id"] is not None

    async def _is_log_channel(self, guild: discord.Guild, channel_id: int) -> bool:
        return (await self.bot.db.settings.get(guild.id))["auditlog_channel_id"] == channel_id

    @staticmethod
    def _by(entry: discord.AuditLogEntry | None) -> str:
        return user_label(entry.user) if entry and entry.user else "Unknown"

    # ------------------------------------------------------------------ Messages
    @commands.Cog.listener()
    async def on_raw_message_delete(self, payload: discord.RawMessageDeleteEvent) -> None:
        guild = self.bot.get_guild(payload.guild_id) if payload.guild_id else None
        if not await self._enabled(guild) or await self._is_log_channel(guild, payload.channel_id):
            return

        message = payload.cached_message
        if message and message.author.bot:
            return

        if message is None:
            content = "*Not cached — the message was sent before the bot started.*"
        else:
            content = truncate(message.content) or "*No text content*"

        entry = embed(DANGER, title="🗑️ Message deleted")
        entry.add_field(name="Author", value=user_label(message.author) if message else "Unknown")
        entry.add_field(name="Channel", value=f"<#{payload.channel_id}>")
        entry.add_field(name="Content", value=content, inline=False)
        if message and message.attachments:
            entry.add_field(name="Attachments", value=truncate("\n".join(a.filename for a in message.attachments)), inline=False)
        footer = f"Message ID: {payload.message_id}"
        if message:
            footer += f" • User ID: {message.author.id}"
        entry.set_footer(text=footer)
        await self.bot.audit.send(guild, entry)

    @commands.Cog.listener()
    async def on_message_edit(self, before: discord.Message, after: discord.Message) -> None:
        # Fires only for cached messages, which gives us the "before" content.
        if not await self._enabled(after.guild) or after.author.bot:
            return
        # Link previews also trigger edits; real edits change the content.
        if before.content == after.content:
            return

        entry = embed(WARNING, title="✏️ Message edited", description=f"[Jump to message]({after.jump_url})")
        entry.add_field(name="Author", value=user_label(after.author))
        entry.add_field(name="Channel", value=after.channel.mention)
        entry.add_field(name="Before", value=truncate(before.content) or "*Empty*", inline=False)
        entry.add_field(name="After", value=truncate(after.content) or "*Empty*", inline=False)
        entry.set_footer(text=f"Message ID: {after.id} • User ID: {after.author.id}")
        await self.bot.audit.send(after.guild, entry)

    @commands.Cog.listener()
    async def on_raw_bulk_message_delete(self, payload: discord.RawBulkMessageDeleteEvent) -> None:
        guild = self.bot.get_guild(payload.guild_id) if payload.guild_id else None
        if not await self._enabled(guild) or await self._is_log_channel(guild, payload.channel_id):
            return

        cached = sorted(payload.cached_messages, key=lambda m: m.created_at)
        lines = []
        for m in cached:
            files = f" [attachments: {', '.join(a.url for a in m.attachments)}]" if m.attachments else ""
            lines.append(f"[{m.created_at.isoformat()}] {m.author} ({m.author.id}): {m.content}{files}")

        file = None
        if lines:
            data = io.BytesIO("\n".join(lines).encode("utf-8"))
            file = discord.File(data, filename=f"deleted-messages-{payload.channel_id}.txt")

        entry = embed(DANGER, title="🧹 Messages bulk deleted")
        entry.add_field(name="Channel", value=f"<#{payload.channel_id}>")
        entry.add_field(name="Count", value=str(len(payload.message_ids)))
        entry.add_field(name="Transcript", value=f"{len(lines)} cached message(s) attached" if lines else "No messages were cached")
        await self.bot.audit.send(guild, entry, file)

    # ------------------------------------------------------------------- Members
    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member) -> None:
        if not await self._enabled(member.guild):
            return

        entry = embed(SUCCESS, title="📥 Member joined")
        entry.set_thumbnail(url=member.display_avatar.url)
        entry.add_field(name="Member", value=user_label(member))
        entry.add_field(name="Account created", value=discord.utils.format_dt(member.created_at, "R"))
        entry.add_field(name="Member count", value=str(member.guild.member_count))
        # A classic anti-raid signal: brand-new accounts.
        if discord.utils.utcnow() - member.created_at < timedelta(days=NEW_ACCOUNT_DAYS):
            entry.colour = WARNING
            entry.add_field(name="⚠️ New account", value=f"Created less than {NEW_ACCOUNT_DAYS} days ago.", inline=False)
        entry.set_footer(text=f"User ID: {member.id}")
        await self.bot.audit.send(member.guild, entry)

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member) -> None:
        if not await self._enabled(member.guild):
            return

        # Discord has no "kick" event — a kick looks like a leave, so we check the audit log.
        kick = await self.bot.audit.find_executor(member.guild, discord.AuditLogAction.kick, member.id)

        entry = embed(DANGER if kick else NEUTRAL, title="👢 Member kicked" if kick else "📤 Member left")
        entry.set_thumbnail(url=member.display_avatar.url)
        entry.add_field(name="Member", value=user_label(member))
        if kick:
            entry.add_field(name="Kicked by", value=self._by(kick))
            entry.add_field(name="Reason", value=kick.reason or "No reason provided", inline=False)
        entry.add_field(name="Joined", value=discord.utils.format_dt(member.joined_at, "R") if member.joined_at else "Unknown")
        roles = [r.mention for r in member.roles if r != member.guild.default_role]
        entry.add_field(name=f"Roles ({len(roles)})", value=truncate(" ".join(roles)) or "None", inline=False)
        entry.set_footer(text=f"User ID: {member.id}")
        await self.bot.audit.send(member.guild, entry)

    @commands.Cog.listener()
    async def on_member_update(self, before: discord.Member, after: discord.Member) -> None:
        if not await self._enabled(after.guild):
            return

        changes: list[tuple[str, str]] = []
        if before.nick != after.nick:
            changes.append(("Nickname", f"`{before.nick or 'none'}` → `{after.nick or 'none'}`"))

        added = [r for r in after.roles if r not in before.roles]
        removed = [r for r in before.roles if r not in after.roles]
        if added:
            changes.append(("Roles added", truncate(" ".join(r.mention for r in added))))
        if removed:
            changes.append(("Roles removed", truncate(" ".join(r.mention for r in removed))))

        if before.timed_out_until != after.timed_out_until:
            if after.timed_out_until and after.timed_out_until > discord.utils.utcnow():
                changes.append(("Timed out", f"Until {discord.utils.format_dt(after.timed_out_until, 'f')}"))
            else:
                changes.append(("Timeout removed", "✅"))

        if not changes:
            return  # avatar, boost or pending changes we don't log

        action = discord.AuditLogAction.member_role_update if added or removed else discord.AuditLogAction.member_update
        executor = await self.bot.audit.find_executor(after.guild, action, after.id)

        entry = embed(INFO, title="👤 Member updated")
        entry.set_thumbnail(url=after.display_avatar.url)
        entry.add_field(name="Member", value=user_label(after))
        if executor:
            entry.add_field(name="By", value=self._by(executor))
        for name, value in changes:
            entry.add_field(name=name, value=value, inline=False)
        entry.set_footer(text=f"User ID: {after.id}")
        await self.bot.audit.send(after.guild, entry)

    @commands.Cog.listener()
    async def on_member_ban(self, guild: discord.Guild, user: discord.User | discord.Member) -> None:
        if not await self._enabled(guild):
            return
        executor = await self.bot.audit.find_executor(guild, discord.AuditLogAction.ban, user.id)

        entry = embed(DANGER, title="🔨 Member banned")
        entry.set_thumbnail(url=user.display_avatar.url)
        entry.add_field(name="User", value=user_label(user))
        entry.add_field(name="Banned by", value=self._by(executor))
        entry.add_field(name="Reason", value=(executor.reason if executor else None) or "No reason provided", inline=False)
        entry.set_footer(text=f"User ID: {user.id}")
        await self.bot.audit.send(guild, entry)

    @commands.Cog.listener()
    async def on_member_unban(self, guild: discord.Guild, user: discord.User) -> None:
        if not await self._enabled(guild):
            return
        executor = await self.bot.audit.find_executor(guild, discord.AuditLogAction.unban, user.id)

        entry = embed(SUCCESS, title="🕊️ Member unbanned")
        entry.add_field(name="User", value=user_label(user))
        entry.add_field(name="Unbanned by", value=self._by(executor))
        entry.set_footer(text=f"User ID: {user.id}")
        await self.bot.audit.send(guild, entry)

    # ------------------------------------------------------------------ Channels
    @commands.Cog.listener()
    async def on_guild_channel_create(self, channel: discord.abc.GuildChannel) -> None:
        if not await self._enabled(channel.guild):
            return
        executor = await self.bot.audit.find_executor(channel.guild, discord.AuditLogAction.channel_create, channel.id)

        entry = embed(SUCCESS, title="➕ Channel created")
        entry.add_field(name="Channel", value=f"{channel.mention} `{channel.name}`")
        entry.add_field(name="Type", value=str(channel.type))
        entry.add_field(name="By", value=self._by(executor))
        entry.set_footer(text=f"Channel ID: {channel.id}")
        await self.bot.audit.send(channel.guild, entry)

    @commands.Cog.listener()
    async def on_guild_channel_delete(self, channel: discord.abc.GuildChannel) -> None:
        if not await self._enabled(channel.guild):
            return
        executor = await self.bot.audit.find_executor(channel.guild, discord.AuditLogAction.channel_delete, channel.id)

        entry = embed(DANGER, title="➖ Channel deleted")
        entry.add_field(name="Name", value=f"`#{channel.name}`")
        entry.add_field(name="Type", value=str(channel.type))
        entry.add_field(name="By", value=self._by(executor))
        entry.set_footer(text=f"Channel ID: {channel.id}")
        await self.bot.audit.send(channel.guild, entry)

    @commands.Cog.listener()
    async def on_guild_channel_update(self, before: discord.abc.GuildChannel, after: discord.abc.GuildChannel) -> None:
        if not await self._enabled(after.guild):
            return

        changes: list[tuple[str, str]] = []
        if before.name != after.name:
            changes.append(("Name", f"`{before.name}` → `{after.name}`"))
        if getattr(before, "topic", None) != getattr(after, "topic", None):
            changes.append(("Topic", truncate(f"{before.topic or '*none*'} → {after.topic or '*none*'}")))
        if getattr(before, "nsfw", None) != getattr(after, "nsfw", None):
            changes.append(("NSFW", f"{before.nsfw} → {after.nsfw}"))
        if getattr(before, "slowmode_delay", None) != getattr(after, "slowmode_delay", None):
            changes.append(("Slowmode", f"{before.slowmode_delay}s → {after.slowmode_delay}s"))
        if before.category_id != after.category_id:
            changes.append(("Category", f"{before.category or 'none'} → {after.category or 'none'}"))
        if before.overwrites != after.overwrites:
            changes.append(("Permissions", "Permission overwrites were changed"))

        if not changes:
            return  # position-only changes happen whenever channels are reordered

        executor = await self.bot.audit.find_executor(after.guild, discord.AuditLogAction.channel_update, after.id)
        entry = embed(INFO, title="🔧 Channel updated")
        entry.add_field(name="Channel", value=after.mention)
        entry.add_field(name="By", value=self._by(executor))
        for name, value in changes:
            entry.add_field(name=name, value=value, inline=False)
        entry.set_footer(text=f"Channel ID: {after.id}")
        await self.bot.audit.send(after.guild, entry)

    # --------------------------------------------------------------------- Roles
    @commands.Cog.listener()
    async def on_guild_role_create(self, role: discord.Role) -> None:
        if not await self._enabled(role.guild):
            return
        executor = await self.bot.audit.find_executor(role.guild, discord.AuditLogAction.role_create, role.id)
        entry = embed(SUCCESS, title="➕ Role created")
        entry.add_field(name="Role", value=f"{role.mention} `{role.name}`")
        entry.add_field(name="By", value=self._by(executor))
        entry.set_footer(text=f"Role ID: {role.id}")
        await self.bot.audit.send(role.guild, entry)

    @commands.Cog.listener()
    async def on_guild_role_delete(self, role: discord.Role) -> None:
        if not await self._enabled(role.guild):
            return
        executor = await self.bot.audit.find_executor(role.guild, discord.AuditLogAction.role_delete, role.id)
        entry = embed(DANGER, title="➖ Role deleted")
        entry.add_field(name="Name", value=f"`{role.name}`")
        entry.add_field(name="By", value=self._by(executor))
        entry.set_footer(text=f"Role ID: {role.id}")
        await self.bot.audit.send(role.guild, entry)

    @commands.Cog.listener()
    async def on_guild_role_update(self, before: discord.Role, after: discord.Role) -> None:
        if not await self._enabled(after.guild):
            return

        changes: list[tuple[str, str]] = []
        if before.name != after.name:
            changes.append(("Name", f"`{before.name}` → `{after.name}`"))
        if before.colour != after.colour:
            changes.append(("Color", f"{before.colour} → {after.colour}"))
        if before.hoist != after.hoist:
            changes.append(("Displayed separately", f"{before.hoist} → {after.hoist}"))
        if before.mentionable != after.mentionable:
            changes.append(("Mentionable", f"{before.mentionable} → {after.mentionable}"))

        # Permission diffs are the most security-relevant part of role changes.
        if before.permissions != after.permissions:
            granted = [name for name, value in after.permissions if value and not getattr(before.permissions, name)]
            revoked = [name for name, value in before.permissions if value and not getattr(after.permissions, name)]
            if granted:
                changes.append(("✅ Permissions granted", truncate(", ".join(granted))))
            if revoked:
                changes.append(("❌ Permissions revoked", truncate(", ".join(revoked))))

        if not changes:
            return  # position-only change

        executor = await self.bot.audit.find_executor(after.guild, discord.AuditLogAction.role_update, after.id)
        entry = embed(INFO, title="🔧 Role updated")
        entry.add_field(name="Role", value=after.mention)
        entry.add_field(name="By", value=self._by(executor))
        for name, value in changes:
            entry.add_field(name=name, value=value, inline=False)
        entry.set_footer(text=f"Role ID: {after.id}")
        await self.bot.audit.send(after.guild, entry)

    # --------------------------------------------------------------------- Voice
    @commands.Cog.listener()
    async def on_voice_state_update(self, member: discord.Member, before: discord.VoiceState, after: discord.VoiceState) -> None:
        # Mute/deafen/stream changes keep the same channel — only log movement.
        if before.channel == after.channel or member.bot or not await self._enabled(member.guild):
            return

        if before.channel is None:
            entry = embed(SUCCESS, title="🔊 Joined voice")
            entry.add_field(name="Channel", value=after.channel.mention)
        elif after.channel is None:
            entry = embed(NEUTRAL, title="🔇 Left voice")
            entry.add_field(name="Channel", value=before.channel.mention)
        else:
            entry = embed(INFO, title="🔀 Moved voice channel")
            entry.add_field(name="From", value=before.channel.mention)
            entry.add_field(name="To", value=after.channel.mention)

        entry.add_field(name="Member", value=user_label(member))
        entry.set_footer(text=f"User ID: {member.id}")
        await self.bot.audit.send(member.guild, entry)


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Audit(bot))
