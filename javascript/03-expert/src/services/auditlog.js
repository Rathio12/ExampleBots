// The audit-log service: a readable, permanent replacement for Discord's
// built-in audit log (which only keeps 45 days and never shows message content).
//
// Event handlers in src/events/audit/ build embeds and call `send`.
// `findExecutor` looks up *who* performed an action (e.g. who banned someone)
// in Discord's own audit log — the bot needs the "View Audit Log" permission.

export function createAuditLog({ repos, logger }) {
  /** Is audit logging enabled for this guild? Cheap — settings are cached. */
  const isEnabled = (guildId) => Boolean(repos.settings.get(guildId).auditlogChannelId);

  /** The configured audit channel ID (used to avoid logging the log channel itself). */
  const channelIdFor = (guildId) => repos.settings.get(guildId).auditlogChannelId;

  /**
   * @param {import('discord.js').Guild} guild
   * @param {import('discord.js').EmbedBuilder} embed
   * @param {import('discord.js').AttachmentBuilder[]} [files]
   */
  async function send(guild, embed, files = []) {
    const channelId = channelIdFor(guild.id);
    if (!channelId) return;
    try {
      const channel = guild.channels.cache.get(channelId) ?? (await guild.channels.fetch(channelId));
      await channel.send({ embeds: [embed], files, allowedMentions: { parse: [] } });
    } catch (error) {
      logger.warn(`Could not write to audit log in ${guild.id}`, error);
    }
  }

  /**
   * Finds the most recent audit-log entry of `type` that targets `targetId`.
   * Audit log entries can arrive slightly after the gateway event, so we
   * accept entries from the last 15 seconds.
   * @returns {Promise<{executor: import('discord.js').User|null, reason: string|null}|null>}
   */
  async function findExecutor(guild, type, targetId) {
    try {
      const logs = await guild.fetchAuditLogs({ type, limit: 5 });
      const entry = logs.entries.find(
        (e) => (e.targetId ?? e.target?.id) === targetId && Date.now() - e.createdTimestamp < 15_000,
      );
      return entry ? { executor: entry.executor, reason: entry.reason } : null;
    } catch {
      return null; // missing View Audit Log permission — just skip the executor
    }
  }

  return { isEnabled, channelIdFor, send, findExecutor };
}
