// Role-hierarchy checks for moderation commands.
// Discord itself refuses actions on members with a higher role than the bot,
// but checking first lets us show a friendly message instead of an API error.

/**
 * @param {import('discord.js').GuildMember} moderator
 * @param {import('discord.js').GuildMember} target
 * @returns {string|null} an error message, or null if the action is allowed
 */
export function checkHierarchy(moderator, target) {
  const { guild } = target;
  const me = guild.members.me;

  if (target.id === moderator.id) return "You can't use this on yourself.";
  if (target.id === guild.ownerId) return "You can't moderate the server owner.";
  if (target.id === me.id) return "I won't moderate myself. 🙃";
  if (moderator.id !== guild.ownerId && moderator.roles.highest.position <= target.roles.highest.position) {
    return 'That member has an equal or higher role than you.';
  }
  if (me.roles.highest.position <= target.roles.highest.position) {
    return 'My highest role is not above that member — move my role higher in Server Settings → Roles.';
  }
  return null;
}
