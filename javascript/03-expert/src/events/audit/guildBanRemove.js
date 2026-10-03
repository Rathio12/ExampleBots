import { AuditLogEvent, Events } from 'discord.js';
import { Colors, embed, userLabel } from '../../lib/format.js';

export default {
  name: Events.GuildBanRemove,

  async execute({ audit }, ban) {
    if (!audit.isEnabled(ban.guild.id)) return;

    const info = await audit.findExecutor(ban.guild, AuditLogEvent.MemberBanRemove, ban.user.id);

    const entry = embed(Colors.success)
      .setTitle('🕊️ Member unbanned')
      .addFields(
        { name: 'User', value: userLabel(ban.user), inline: true },
        { name: 'Unbanned by', value: info?.executor ? userLabel(info.executor) : 'Unknown', inline: true },
      )
      .setFooter({ text: `User ID: ${ban.user.id}` });

    await audit.send(ban.guild, entry);
  },
};
