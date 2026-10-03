import { AuditLogEvent, Events } from 'discord.js';
import { Colors, embed, timestamp, truncate, userLabel } from '../../lib/format.js';

// Discord has no separate "kick" event — a kick looks like a leave. We check
// the audit log to tell them apart.
export default {
  name: Events.GuildMemberRemove,

  async execute({ audit }, member) {
    if (!audit.isEnabled(member.guild.id)) return;

    const kick = await audit.findExecutor(member.guild, AuditLogEvent.MemberKick, member.id);

    const entry = embed(kick ? Colors.danger : Colors.neutral)
      .setTitle(kick ? '👢 Member kicked' : '📤 Member left')
      .setThumbnail(member.user.displayAvatarURL())
      .addFields({ name: 'Member', value: userLabel(member.user), inline: true })
      .setFooter({ text: `User ID: ${member.id}` });

    if (kick) {
      entry.addFields(
        { name: 'Kicked by', value: userLabel(kick.executor), inline: true },
        { name: 'Reason', value: kick.reason ?? 'No reason provided' },
      );
    }

    // Partial members (not cached) don't have join date or roles.
    if (!member.partial) {
      const roles = member.roles.cache.filter((r) => r.id !== member.guild.id).map((r) => r.toString());
      entry.addFields(
        { name: 'Joined', value: member.joinedTimestamp ? timestamp(member.joinedTimestamp / 1000) : 'Unknown', inline: true },
        { name: `Roles (${roles.length})`, value: truncate(roles.join(' ')) || 'None' },
      );
    }

    await audit.send(member.guild, entry);
  },
};
