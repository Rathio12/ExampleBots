import { ActionRowBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('feedback').setDescription('Send feedback to the server team'),
  cooldown: 60,

  async execute(interaction) {
    const modal = new ModalBuilder().setCustomId('feedback').setTitle('Send feedback');

    const subject = new TextInputBuilder()
      .setCustomId('subject')
      .setLabel('Subject')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    const message = new TextInputBuilder()
      .setCustomId('message')
      .setLabel('Your feedback')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('What do you like? What could be better?')
      .setMinLength(10)
      .setMaxLength(1000)
      .setRequired(true);

    // Each text input goes in its own action row.
    modal.addComponents(
      new ActionRowBuilder().addComponents(subject),
      new ActionRowBuilder().addComponents(message),
    );

    // Showing a modal IS the response — you cannot defer before it.
    await interaction.showModal(modal);
  },
};
