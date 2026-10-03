import { InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { auditReason } from '../../lib/moderation.js';

export default {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setContexts(InteractionContextType.Guild)
    // Banned users are not members, so a user option can't select them —
    // we take the raw ID as a string instead.
    .addStringOption((o) => o.setName('user_id').setDescription('ID of the banned user').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setMaxLength(500)),

  async execute(interaction, { modlog }) {
    const userId = interaction.options.getString('user_id', true).trim();
    if (!/^\d{17,20}$/.test(userId)) {
      await interaction.reply({ content: '❌ That is not a valid user ID.', flags: MessageFlags.Ephemeral });
      return;
    }

    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    try {
      const user = await interaction.guild.members.unban(userId, auditReason(interaction, reason));
      await modlog.log(interaction.guild, { action: 'Unban', target: user, moderator: interaction.user, reason });
      await interaction.reply({ content: `✅ Unbanned **${user.tag}**.`, flags: MessageFlags.Ephemeral });
    } catch {
      await interaction.reply({ content: '❌ That user is not banned.', flags: MessageFlags.Ephemeral });
    }
  },
};
