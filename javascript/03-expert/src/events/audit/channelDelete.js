import { AuditLogEvent, ChannelType, Events } from 'discord.js';
import { Colors, embed, userLabel } from '../../lib/format.js';

export default {
  name: Events.ChannelDelete,

  async execute({ audit }, channel) {
    if (!channel.guild || !audit.isEnabled(channel.guild.id)) return;

    const info = await audit.findExecutor(channel.guild, AuditLogEvent.ChannelDelete, channel.id);

    const entry = embed(Colors.danger)
      .setTitle('➖ Channel deleted')
      .addFields(
        { name: 'Name', value: `\`#${channel.name}\``, inline: true },
        { name: 'Type', value: ChannelType[channel.type] ?? 'Unknown', inline: true },
        { name: 'By', value: info?.executor ? userLabel(info.executor) : 'Unknown', inline: true },
      )
      .setFooter({ text: `Channel ID: ${channel.id}` });

    await audit.send(channel.guild, entry);
  },
};
