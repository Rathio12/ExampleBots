import { InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { userLabel } from '../../lib/format.js';
import { auditReason, resolveModerationTarget } from '../../lib/moderation.js';

export default {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove a member\'s timeout')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setMaxLength(500)),

  async execute(interaction, { modlog }) {
    const member = await resolveModerationTarget(interaction);
    if (!member) return;

    if (!member.isCommunicationDisabled()) {
      await interaction.reply({ content: 'That member is not timed out.', flags: MessageFlags.Ephemeral });
      return;
    }

    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    await member.timeout(null, auditReason(interaction, reason)); // null = remove

    await modlog.log(interaction.guild, { action: 'Remove timeout', target: member.user, moderator: interaction.user, reason });
    await interaction.reply({ content: `🔊 Removed the timeout from ${userLabel(member.user)}.`, flags: MessageFlags.Ephemeral });
  },
};
