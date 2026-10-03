import { AttachmentBuilder, Events } from 'discord.js';
import { Colors, embed } from '../../lib/format.js';

// Fired by /purge and by Discord's "delete message history" on ban.
// Attaches a .txt transcript of every message that was still cached.
export default {
  name: Events.MessageBulkDelete,

  async execute({ audit }, messages, channel) {
    if (!channel.guild || !audit.isEnabled(channel.guild.id)) return;
    if (channel.id === audit.channelIdFor(channel.guild.id)) return;

    const cached = [...messages.values()]
      .filter((m) => !m.partial)
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const transcript = cached.map((m) => {
      const files = m.attachments.size ? ` [attachments: ${m.attachments.map((a) => a.url).join(', ')}]` : '';
      return `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag} (${m.author.id}): ${m.content}${files}`;
    });

    const files = transcript.length
      ? [new AttachmentBuilder(Buffer.from(transcript.join('\n'), 'utf8'), { name: `deleted-messages-${channel.id}.txt` })]
      : [];

    const entry = embed(Colors.danger)
      .setTitle('🧹 Messages bulk deleted')
      .addFields(
        { name: 'Channel', value: `${channel}`, inline: true },
        { name: 'Count', value: `${messages.size}`, inline: true },
        { name: 'Transcript', value: transcript.length ? `${transcript.length} cached message(s) attached` : 'No messages were cached', inline: true },
      );

    await audit.send(channel.guild, entry, files);
  },
};
