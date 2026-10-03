// Sends a record of every moderation action to the server's mod-log channel
// (configured with /settings modlog).
import { Colors, embed, userLabel } from '../lib/format.js';

const ACTION_COLORS = {
  Warn: Colors.warning,
  'Clear warnings': Colors.neutral,
  Timeout: Colors.warning,
  'Remove timeout': Colors.success,
  Kick: Colors.danger,
  Ban: Colors.danger,
  Unban: Colors.success,
  Purge: Colors.neutral,
};

export function createModLog({ repos, logger }) {
  /**
   * @param {import('discord.js').Guild} guild
   * @param {{action: string, target?: import('discord.js').User, moderator: import('discord.js').User,
   *          reason?: string, fields?: {name: string, value: string, inline?: boolean}[]}} entry
   */
  async function log(guild, { action, target, moderator, reason, fields = [] }) {
    const channelId = repos.settings.get(guild.id).modlogChannelId;
    if (!channelId) return;

    const message = embed(ACTION_COLORS[action] ?? Colors.primary)
      .setTitle(`🛡️ ${action}`)
      .addFields(
        ...(target ? [{ name: 'Member', value: userLabel(target), inline: true }] : []),
        { name: 'Moderator', value: userLabel(moderator), inline: true },
        ...fields,
        { name: 'Reason', value: reason || 'No reason provided' },
      );
    if (target) message.setFooter({ text: `User ID: ${target.id}` });

    try {
      const channel = await guild.channels.fetch(channelId);
      await channel.send({ embeds: [message], allowedMentions: { parse: [] } });
    } catch (error) {
      logger.warn(`Could not write to mod-log in ${guild.id}`, error);
    }
  }

  /** Tries to DM the member before an action. Failing (DMs closed) is fine. */
  async function notify(user, guild, text) {
    try {
      await user.send(`**${guild.name}:** ${text}`);
      return true;
    } catch {
      return false;
    }
  }

  return { log, notify };
}
