import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

export default {
  category: 'Leveling',
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Show your (or someone else\'s) level and XP')
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('Whose rank? (default: you)')),

  async execute(interaction, { leveling }) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    if (user.bot) {
      await interaction.reply('🤖 Bots do not earn XP.');
      return;
    }
    await interaction.reply({ embeds: [leveling.buildRankEmbed(interaction.guildId, user)] });
  },
};
