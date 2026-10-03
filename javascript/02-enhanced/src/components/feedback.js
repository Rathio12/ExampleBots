import { MessageFlags } from 'discord.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { baseEmbed } from '../utils/embeds.js';

// Handles the modal submitted from /feedback (custom ID "feedback").
export default {
  id: 'feedback',

  async execute(interaction) {
    const subject = interaction.fields.getTextInputValue('subject');
    const message = interaction.fields.getTextInputValue('message');

    logger.info(`Feedback from ${interaction.user.tag}: ${subject}`);

    if (config.feedbackChannelId) {
      const channel = await interaction.client.channels.fetch(config.feedbackChannelId);
      const embed = baseEmbed()
        .setTitle(`💡 ${subject}`)
        .setDescription(message)
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setFooter({ text: `User ID: ${interaction.user.id}` });
      await channel.send({ embeds: [embed] });
    }

    await interaction.reply({ content: '🙏 Thanks! Your feedback was sent.', flags: MessageFlags.Ephemeral });
  },
};
