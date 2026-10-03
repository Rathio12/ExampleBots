import { InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { userLabel } from '../../lib/format.js';
import { auditReason, resolveModerationTarget } from '../../lib/moderation.js';

export default {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setMaxLength(500)),

  async execute(interaction, { modlog }) {
    const member = await resolveModerationTarget(interaction);
    if (!member) return;
    if (!member.kickable) {
      await interaction.reply({ content: '❌ I cannot kick that member.', flags: MessageFlags.Ephemeral });
      return;
    }

    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    // DM first — once kicked, we may no longer share a server with them.
    await modlog.notify(member.user, interaction.guild, `You were kicked: ${reason}`);
    await member.kick(auditReason(interaction, reason));

    await modlog.log(interaction.guild, { action: 'Kick', target: member.user, moderator: interaction.user, reason });
    await interaction.reply({ content: `👢 Kicked ${userLabel(member.user)}.`, flags: MessageFlags.Ephemeral });
  },
};
