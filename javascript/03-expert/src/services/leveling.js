// Awards XP for chatting and builds rank cards.
import { Colors, embed } from '../lib/format.js';
import { levelFromXp, progressBar } from '../lib/levels.js';

export function createLevelingService({ repos, config, logger }) {
  // "guildId:userId" -> timestamp (ms) when the user may earn XP again.
  const cooldowns = new Map();

  /**
   * Called for every guild message. Returns the new level if the user levelled up.
   * @returns {number|null}
   */
  function handleMessage(guildId, userId) {
    const key = `${guildId}:${userId}`;
    const now = Date.now();
    if ((cooldowns.get(key) ?? 0) > now) return null;
    cooldowns.set(key, now + config.xp.cooldownSeconds * 1000);

    const gained = config.xp.min + Math.floor(Math.random() * (config.xp.max - config.xp.min + 1));
    const total = repos.levels.addXp(guildId, userId, gained);
    const before = levelFromXp(total - gained).level;
    const after = levelFromXp(total).level;

    logger.debug(`+${gained} XP for ${userId} in ${guildId} (total ${total})`);
    return after > before ? after : null;
  }

  /** Builds the embed used by /rank and the "Show Rank" context menu. */
  function buildRankEmbed(guildId, user) {
    const xp = repos.levels.getXp(guildId, user.id);
    const { level, currentXp, neededXp } = levelFromXp(xp);
    const rank = xp > 0 ? repos.levels.getRank(guildId, xp) : null;

    return embed(Colors.primary)
      .setAuthor({ name: user.tag ?? user.username, iconURL: user.displayAvatarURL() })
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'Level', value: `**${level}**`, inline: true },
        { name: 'Rank', value: rank ? `#${rank}` : 'Unranked', inline: true },
        { name: 'Total XP', value: `${xp}`, inline: true },
        { name: `Progress — ${currentXp}/${neededXp} XP`, value: progressBar(currentXp, neededXp, 20) },
      );
  }

  // Forget expired cooldowns every 10 minutes so memory stays flat.
  const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [key, until] of cooldowns) if (until <= now) cooldowns.delete(key);
  }, 600_000);
  sweeper.unref();

  return { handleMessage, buildRankEmbed, stop: () => clearInterval(sweeper) };
}
