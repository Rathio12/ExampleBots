import { AuditLogEvent, Events } from 'discord.js';
import { Colors, embed, truncate, userLabel } from '../../lib/format.js';

export default {
  name: Events.GuildRoleUpdate,

  async execute({ audit }, oldRole, newRole) {
    if (!audit.isEnabled(newRole.guild.id)) return;

    const changes = [];
    if (oldRole.name !== newRole.name) changes.push({ name: 'Name', value: `\`${oldRole.name}\` → \`${newRole.name}\`` });
    if (oldRole.color !== newRole.color) changes.push({ name: 'Color', value: `${oldRole.hexColor} → ${newRole.hexColor}`, inline: true });
    if (oldRole.hoist !== newRole.hoist) changes.push({ name: 'Displayed separately', value: `${oldRole.hoist} → ${newRole.hoist}`, inline: true });
    if (oldRole.mentionable !== newRole.mentionable) changes.push({ name: 'Mentionable', value: `${oldRole.mentionable} → ${newRole.mentionable}`, inline: true });

    // Permission diffs are the most security-relevant part of role changes.
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      const before = new Set(oldRole.permissions.toArray());
      const after = new Set(newRole.permissions.toArray());
      const granted = [...after].filter((p) => !before.has(p));
      const revoked = [...before].filter((p) => !after.has(p));
      if (granted.length) changes.push({ name: '✅ Permissions granted', value: truncate(granted.join(', ')) });
      if (revoked.length) changes.push({ name: '❌ Permissions revoked', value: truncate(revoked.join(', ')) });
    }

    if (changes.length === 0) return; // position-only change

    const info = await audit.findExecutor(newRole.guild, AuditLogEvent.RoleUpdate, newRole.id);

    const entry = embed(Colors.info)
      .setTitle('🔧 Role updated')
      .addFields(
        { name: 'Role', value: `${newRole}`, inline: true },
        { name: 'By', value: info?.executor ? userLabel(info.executor) : 'Unknown', inline: true },
        ...changes,
      )
      .setFooter({ text: `Role ID: ${newRole.id}` });

    await audit.send(newRole.guild, entry);
  },
};
