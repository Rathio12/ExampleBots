import { Events } from 'discord.js';
import { Colors, embed, truncate, userLabel } from '../../lib/format.js';

export default {
  name: Events.MessageUpdate,

  async execute({ audit }, oldMessage, newMessage) {
    if (!newMessage.guildId || !audit.isEnabled(newMessage.guildId)) return;

    // Make sure we have the full new message.
    if (newMessage.partial) {
      try {
        newMessage = await newMessage.fetch();
      } catch {
        return; // deleted in the meantime
      }
    }

    if (newMessage.author.bot) return;
    // Link previews (embeds) also fire "update" — real edits set editedTimestamp.
    if (!newMessage.editedTimestamp) return;
    if (!oldMessage.partial && oldMessage.content === newMessage.content) return;

    const before = oldMessage.partial ? '*Not cached*' : truncate(oldMessage.content) || '*Empty*';

    const entry = embed(Colors.warning)
      .setTitle('✏️ Message edited')
      .setDescription(`[Jump to message](${newMessage.url})`)
      .addFields(
        { name: 'Author', value: userLabel(newMessage.author), inline: true },
        { name: 'Channel', value: `<#${newMessage.channelId}>`, inline: true },
        { name: 'Before', value: before },
        { name: 'After', value: truncate(newMessage.content) || '*Empty*' },
      )
      .setFooter({ text: `Message ID: ${newMessage.id} • User ID: ${newMessage.author.id}` });

    await audit.send(newMessage.guild, entry);
  },
};
