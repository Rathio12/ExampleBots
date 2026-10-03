// Per-user, per-command cooldowns stored in memory.
// Map<commandName, Map<userId, expiresAtMs>>
const cooldowns = new Map();

/**
 * Check and start a cooldown.
 * @returns {number} 0 if the user may run the command, otherwise seconds left.
 */
export function checkCooldown(commandName, userId, seconds) {
  const now = Date.now();
  if (!cooldowns.has(commandName)) cooldowns.set(commandName, new Map());
  const users = cooldowns.get(commandName);

  const expiresAt = users.get(userId) ?? 0;
  if (now < expiresAt) return Math.ceil((expiresAt - now) / 1000);

  users.set(userId, now + seconds * 1000);
  // Clean up after ourselves so the map does not grow forever.
  setTimeout(() => users.delete(userId), seconds * 1000).unref();
  return 0;
}
