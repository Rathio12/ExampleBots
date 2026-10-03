import { AuditLogEvent, Events } from 'discord.js';
import { Colors, embed, userLabel } from '../../lib/format.js';

export default {
  name: Events.GuildBanAdd,

  async execute({ audit }, ban) {
    if (!audit.isEnabled(ban.guild.id)) return;

    const info = await audit.findExecutor(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);

    const entry = embed(Colors.danger)
      .setTitle('🔨 Member banned')
      .setThumbnail(ban.user.displayAvatarURL())
      .addFields(
        { name: 'User', value: userLabel(ban.user), inline: true },
        { name: 'Banned by', value: info?.executor ? userLabel(info.executor) : 'Unknown', inline: true },
        { name: 'Reason', value: info?.reason ?? ban.reason ?? 'No reason provided' },
      )
      .setFooter({ text: `User ID: ${ban.user.id}` });

    await audit.send(ban.guild, entry);
  },
};
