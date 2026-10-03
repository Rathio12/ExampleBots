import { AuditLogEvent, Events } from 'discord.js';
import { Colors, embed, timestamp, truncate, userLabel } from '../../lib/format.js';

// Logs nickname changes, role changes and timeouts.
export default {
  name: Events.GuildMemberUpdate,

  async execute({ audit }, oldMember, newMember) {
    if (!audit.isEnabled(newMember.guild.id)) return;
    if (oldMember.partial) return; // nothing to compare against

    const changes = [];

    if (oldMember.nickname !== newMember.nickname) {
      changes.push({ name: 'Nickname', value: `\`${oldMember.nickname ?? 'none'}\` → \`${newMember.nickname ?? 'none'}\`` });
    }

    const added = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
    const removed = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));
    if (added.size) changes.push({ name: 'Roles added', value: truncate(added.map((r) => r.toString()).join(' ')) });
    if (removed.size) changes.push({ name: 'Roles removed', value: truncate(removed.map((r) => r.toString()).join(' ')) });

    const oldTimeout = oldMember.communicationDisabledUntilTimestamp ?? 0;
    const newTimeout = newMember.communicationDisabledUntilTimestamp ?? 0;
    if (oldTimeout !== newTimeout) {
      changes.push(
        newTimeout > Date.now()
          ? { name: 'Timed out', value: `Until ${timestamp(newTimeout / 1000, 'f')}` }
          : { name: 'Timeout removed', value: '✅' },
      );
    }

    if (changes.length === 0) return; // e.g. avatar or boost changes we don't log

    const auditType = added.size || removed.size ? AuditLogEvent.MemberRoleUpdate : AuditLogEvent.MemberUpdate;
    const info = await audit.findExecutor(newMember.guild, auditType, newMember.id);

    const entry = embed(Colors.info)
      .setTitle('👤 Member updated')
      .setThumbnail(newMember.user.displayAvatarURL())
      .addFields({ name: 'Member', value: userLabel(newMember.user), inline: true });
    if (info?.executor) entry.addFields({ name: 'By', value: userLabel(info.executor), inline: true });
    entry.addFields(...changes).setFooter({ text: `User ID: ${newMember.id}` });

    await audit.send(newMember.guild, entry);
  },
};
