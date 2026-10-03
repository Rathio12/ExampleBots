import { InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { checkHierarchy } from '../../lib/permissions.js';
import { userLabel } from '../../lib/format.js';
import { auditReason } from '../../lib/moderation.js';

export default {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user (works even if they already left)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setMaxLength(500))
    .addIntegerOption((o) =>
      o
        .setName('delete_messages')
        .setDescription('Delete their recent messages')
        .addChoices(
          { name: "Don't delete any", value: 0 },
          { name: 'Previous hour', value: 3600 },
          { name: 'Previous 24 hours', value: 86_400 },
          { name: 'Previous 7 days', value: 604_800 },
        ),
    ),

  async execute(interaction, { modlog }) {
    const user = interaction.options.getUser('user', true);
    const member = interaction.options.getMember('user'); // null if not in the server
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const deleteMessageSeconds = interaction.options.getInteger('delete_messages') ?? 0;

    // Hierarchy only matters if they are still a member.
    if (member) {
      const problem = checkHierarchy(interaction.member, member);
      if (problem) {
        await interaction.reply({ content: `❌ ${problem}`, flags: MessageFlags.Ephemeral });
        return;
      }
      await modlog.notify(user, interaction.guild, `You were banned: ${reason}`);
    }

    await interaction.guild.members.ban(user, { reason: auditReason(interaction, reason), deleteMessageSeconds });

    await modlog.log(interaction.guild, { action: 'Ban', target: user, moderator: interaction.user, reason });
    await interaction.reply({ content: `🔨 Banned ${userLabel(user)}.`, flags: MessageFlags.Ephemeral });
  },
};
