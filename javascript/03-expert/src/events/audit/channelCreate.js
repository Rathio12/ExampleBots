import { AuditLogEvent, ChannelType, Events } from 'discord.js';
import { Colors, embed, userLabel } from '../../lib/format.js';

export default {
  name: Events.ChannelCreate,

  async execute({ audit }, channel) {
    if (!channel.guild || !audit.isEnabled(channel.guild.id)) return;

    const info = await audit.findExecutor(channel.guild, AuditLogEvent.ChannelCreate, channel.id);

    const entry = embed(Colors.success)
      .setTitle('➕ Channel created')
      .addFields(
        { name: 'Channel', value: `${channel} \`${channel.name}\``, inline: true },
        { name: 'Type', value: ChannelType[channel.type] ?? 'Unknown', inline: true },
        { name: 'By', value: info?.executor ? userLabel(info.executor) : 'Unknown', inline: true },
      )
      .setFooter({ text: `Channel ID: ${channel.id}` });

    await audit.send(channel.guild, entry);
  },
};
