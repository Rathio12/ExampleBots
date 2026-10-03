import { Events } from 'discord.js';
import { Colors, embed, truncate, userLabel } from '../../lib/format.js';

export default {
  name: Events.MessageDelete,

  async execute({ audit }, message) {
    if (!message.guildId || !audit.isEnabled(message.guildId)) return;
    if (message.author?.bot) return;
    // Never log the log channel itself (avoids loops when someone cleans it up).
    if (message.channelId === audit.channelIdFor(message.guildId)) return;

    // A "partial" message was sent before the bot started (or fell out of the
    // cache), so Discord only tells us its ID — the content is gone.
    const content = message.partial
      ? '*Not cached — the message was sent before the bot started.*'
      : truncate(message.content) || '*No text content*';

    const entry = embed(Colors.danger)
      .setTitle('🗑️ Message deleted')
      .addFields(
        { name: 'Author', value: message.author ? userLabel(message.author) : 'Unknown', inline: true },
        { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
        { name: 'Content', value: content },
      )
      .setFooter({ text: `Message ID: ${message.id}${message.author ? ` • User ID: ${message.author.id}` : ''}` });

    if (message.attachments?.size) {
      entry.addFields({ name: 'Attachments', value: truncate(message.attachments.map((a) => a.name).join('\n')) });
    }

    await audit.send(message.guild, entry);
  },
};
