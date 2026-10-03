// Shared steps for moderation commands: resolve the target member and make
// sure the moderator (and the bot) are allowed to act on them.
import { MessageFlags } from 'discord.js';
import { checkHierarchy } from './permissions.js';

/**
 * @returns {Promise<import('discord.js').GuildMember|null>} the member, or null
 *   after replying with an explanation.
 */
export async function resolveModerationTarget(interaction) {
  const member = interaction.options.getMember('user');
  if (!member) {
    await interaction.reply({ content: 'That user is not a member of this server.', flags: MessageFlags.Ephemeral });
    return null;
  }

  const problem = checkHierarchy(interaction.member, member);
  if (problem) {
    await interaction.reply({ content: `❌ ${problem}`, flags: MessageFlags.Ephemeral });
    return null;
  }
  return member;
}

/** Audit-log reasons show "Moderator: reason" so the real moderator is visible. */
export const auditReason = (interaction, reason) => `${interaction.user.tag}: ${reason}`.slice(0, 512);
