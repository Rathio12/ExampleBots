import { ActionRowBuilder, SlashCommandBuilder, StringSelectMenuBuilder } from 'discord.js';
import { TRIVIA_QUESTIONS } from '../data/trivia.js';
import { baseEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder().setName('trivia').setDescription('Answer a random trivia question'),
  cooldown: 10,

  async execute(interaction) {
    const index = Math.floor(Math.random() * TRIVIA_QUESTIONS.length);
    const { question, answers } = TRIVIA_QUESTIONS[index];

    const menu = new StringSelectMenuBuilder()
      // Encode the question index so the handler knows which question this is.
      .setCustomId(`trivia:${index}`)
      .setPlaceholder('Pick your answer…')
      .addOptions(answers.map((answer, i) => ({ label: answer, value: String(i) })));

    const embed = baseEmbed()
      .setTitle('🧠 Trivia time!')
      .setDescription(`**${question}**\n\nEveryone can answer — only you will see your result.`);

    await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
  },
};
