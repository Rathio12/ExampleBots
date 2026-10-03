// Per-user, per-command cooldowns (in memory).
const cooldowns = new Map();

/** @returns {number} 0 when allowed, otherwise the seconds left. */
export function checkCooldown(commandName, userId, seconds) {
  if (!seconds) return 0;
  const key = `${commandName}:${userId}`;
  const now = Date.now();
  const expiresAt = cooldowns.get(key) ?? 0;
  if (now < expiresAt) return Math.ceil((expiresAt - now) / 1000);

  cooldowns.set(key, now + seconds * 1000);
  setTimeout(() => cooldowns.delete(key), seconds * 1000).unref();
  return 0;
}
