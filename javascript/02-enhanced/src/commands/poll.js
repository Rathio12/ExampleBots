import { SlashCommandBuilder } from 'discord.js';
import { buildPollMessage, polls } from '../state/polls.js';

export default {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Start a yes/no poll with buttons')
    .addStringOption((option) =>
      option.setName('question').setDescription('What should people vote on?').setRequired(true).setMaxLength(200),
    ),
  cooldown: 30,

  async execute(interaction) {
    // The interaction ID is unique — perfect as a poll ID.
    const pollId = interaction.id;
    polls.set(pollId, {
      question: interaction.options.getString('question', true),
      authorTag: interaction.user.tag,
      yes: new Set(),
      no: new Set(),
    });

    await interaction.reply(buildPollMessage(pollId));
  },
};
