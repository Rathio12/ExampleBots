import { InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Colors, embed, timestamp, truncate } from '../../lib/format.js';

export default {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('List a member\'s warnings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('Member to look up').setRequired(true)),

  async execute(interaction, { repos }) {
    const user = interaction.options.getUser('user', true);
    const warnings = repos.warnings.list(interaction.guildId, user.id);

    const lines = warnings
      .slice(0, 15)
      .map((w) => `**#${w.id}** • ${timestamp(w.createdAt)} by <@${w.moderatorId}>\n> ${truncate(w.reason, 200)}`);

    const result = embed(warnings.length ? Colors.warning : Colors.success)
      .setAuthor({ name: `${user.tag} — ${warnings.length} warning(s)`, iconURL: user.displayAvatarURL() })
      .setDescription(lines.join('\n\n') || 'No warnings. ✨');
    if (warnings.length > 15) result.setFooter({ text: `Showing the 15 most recent of ${warnings.length}` });

    await interaction.reply({ embeds: [result], flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
  },
};
