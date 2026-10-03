import { ApplicationCommandType, ContextMenuCommandBuilder, InteractionContextType, MessageFlags } from 'discord.js';
import { Colors, embed, truncate } from '../../lib/format.js';

// A MESSAGE context menu: right-click a message → Apps → "Bookmark".
// The bot DMs you a copy with a jump link.
export default {
  category: 'Utility',
  data: new ContextMenuCommandBuilder()
    .setName('Bookmark')
    .setType(ApplicationCommandType.Message)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const message = interaction.targetMessage;

    const bookmark = embed(Colors.info)
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
      .setDescription(truncate(message.content, 4000) || '*No text content*')
      .addFields({ name: 'Source', value: `[Jump to message](${message.url}) in ${message.channel}` });

    const image = message.attachments.find((a) => a.contentType?.startsWith('image/'));
    if (image) bookmark.setImage(image.url);

    try {
      await interaction.user.send({ content: '🔖 Bookmarked message:', embeds: [bookmark] });
      await interaction.reply({ content: '🔖 Sent to your DMs!', flags: MessageFlags.Ephemeral });
    } catch {
      await interaction.reply({ content: '❌ I could not DM you — check your privacy settings.', flags: MessageFlags.Ephemeral });
    }
  },
};
