import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { baseEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder().setName('help').setDescription('List every command'),

  async execute(interaction) {
    // Built from the registry, so it never goes out of date.
    const lines = interaction.client.commands
      .map((command) => `**/${command.data.name}** — ${command.data.description}`)
      .sort();

    const embed = baseEmbed().setTitle('📖 Commands').setDescription(lines.join('\n'));
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
