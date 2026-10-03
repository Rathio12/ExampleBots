import { ApplicationCommandType, ContextMenuCommandBuilder, InteractionContextType, MessageFlags } from 'discord.js';

// A USER context menu: right-click a member → Apps → "Show Rank".
export default {
  category: 'Leveling',
  data: new ContextMenuCommandBuilder()
    .setName('Show Rank')
    .setType(ApplicationCommandType.User)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction, { leveling }) {
    const user = interaction.targetUser;
    await interaction.reply({
      embeds: [leveling.buildRankEmbed(interaction.guildId, user)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
