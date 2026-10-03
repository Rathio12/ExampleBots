import { AuditLogEvent, Events } from 'discord.js';
import { Colors, embed, userLabel } from '../../lib/format.js';

export default {
  name: Events.GuildRoleCreate,

  async execute({ audit }, role) {
    if (!audit.isEnabled(role.guild.id)) return;

    const info = await audit.findExecutor(role.guild, AuditLogEvent.RoleCreate, role.id);

    const entry = embed(Colors.success)
      .setTitle('➕ Role created')
      .addFields(
        { name: 'Role', value: `${role} \`${role.name}\``, inline: true },
        { name: 'By', value: info?.executor ? userLabel(info.executor) : 'Unknown', inline: true },
      )
      .setFooter({ text: `Role ID: ${role.id}` });

    await audit.send(role.guild, entry);
  },
};
