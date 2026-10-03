import { InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { formatDuration, parseDuration } from '../../lib/duration.js';
import { timestamp, userLabel } from '../../lib/format.js';
import { auditReason, resolveModerationTarget } from '../../lib/moderation.js';

const MAX_TIMEOUT_SECONDS = 28 * 86_400; // Discord's limit is 28 days

export default {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Temporarily mute a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('Member to time out').setRequired(true))
    .addStringOption((o) => o.setName('duration').setDescription('e.g. 10m, 1h, 1d12h (max 28d)').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setMaxLength(500)),

  async execute(interaction, { modlog }) {
    const seconds = parseDuration(interaction.options.getString('duration', true));
    if (!seconds || seconds > MAX_TIMEOUT_SECONDS) {
      await interaction.reply({ content: '❌ Use a duration like `10m`, `2h` or `1d` (max 28d).', flags: MessageFlags.Ephemeral });
      return;
    }

    const member = await resolveModerationTarget(interaction);
    if (!member) return;
    if (!member.moderatable) {
      await interaction.reply({ content: '❌ I cannot time out that member (missing permission or role too low).', flags: MessageFlags.Ephemeral });
      return;
    }

    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    await member.timeout(seconds * 1000, auditReason(interaction, reason));

    const endsAt = Math.floor(Date.now() / 1000) + seconds;
    await modlog.notify(member.user, interaction.guild, `You were timed out for ${formatDuration(seconds)}: ${reason}`);
    await modlog.log(interaction.guild, {
      action: 'Timeout',
      target: member.user,
      moderator: interaction.user,
      reason,
      fields: [
        { name: 'Duration', value: formatDuration(seconds), inline: true },
        { name: 'Ends', value: timestamp(endsAt), inline: true },
      ],
    });

    await interaction.reply({
      content: `🔇 ${userLabel(member.user)} is timed out until ${timestamp(endsAt, 'f')}.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
