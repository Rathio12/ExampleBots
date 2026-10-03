import { InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Delete all warnings of a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setMaxLength(500)),

  async execute(interaction, { repos, modlog }) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? undefined;
    const removed = repos.warnings.clear(interaction.guildId, user.id);

    if (removed > 0) {
      await modlog.log(interaction.guild, {
        action: 'Clear warnings',
        target: user,
        moderator: interaction.user,
        reason,
        fields: [{ name: 'Removed', value: `${removed}`, inline: true }],
      });
    }

    await interaction.reply({
      content: removed ? `🧹 Removed ${removed} warning(s) from **${user.tag}**.` : `**${user.tag}** has no warnings.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
