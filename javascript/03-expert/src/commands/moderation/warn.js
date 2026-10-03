import { InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Colors, embed, userLabel } from '../../lib/format.js';
import { resolveModerationTarget } from '../../lib/moderation.js';

export default {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member (stored permanently)')
    // Hidden from members without this permission. Server admins can still
    // change who sees it under Server Settings → Integrations.
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setRequired(true).setMaxLength(500)),

  async execute(interaction, { repos, modlog }) {
    const member = await resolveModerationTarget(interaction);
    if (!member) return;

    const reason = interaction.options.getString('reason', true);
    const id = repos.warnings.add(interaction.guildId, member.id, interaction.user.id, reason);
    const count = repos.warnings.list(interaction.guildId, member.id).length;

    const dmSent = await modlog.notify(member.user, interaction.guild, `You were warned: ${reason}`);
    await modlog.log(interaction.guild, {
      action: 'Warn',
      target: member.user,
      moderator: interaction.user,
      reason,
      fields: [{ name: 'Total warnings', value: `${count}`, inline: true }],
    });

    await interaction.reply({
      embeds: [
        embed(Colors.warning)
          .setDescription(`⚠️ Warned ${userLabel(member.user)} (warning #${id}, total ${count}).`)
          .setFooter({ text: dmSent ? 'The member was notified by DM.' : 'Could not DM the member.' }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
