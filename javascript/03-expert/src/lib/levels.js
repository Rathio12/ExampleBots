// Leveling math. The curve (5n² + 50n + 100) is the popular "MEE6" formula:
// level 1 needs 100 XP, level 2 another 155, level 10 another 1100, …

/** XP required to go from `level` to `level + 1`. */
export const xpForNextLevel = (level) => 5 * level * level + 50 * level + 100;

/**
 * Converts a total XP amount into a level and progress within that level.
 * @param {number} totalXp
 * @returns {{level: number, currentXp: number, neededXp: number}}
 */
export function levelFromXp(totalXp) {
  let level = 0;
  let remaining = totalXp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level++;
  }
  return { level, currentXp: remaining, neededXp: xpForNextLevel(level) };
}

/** Renders a text progress bar such as "▰▰▰▰▱▱▱▱▱▱". */
export function progressBar(current, total, length = 10) {
  const filled = total > 0 ? Math.min(length, Math.round((current / total) * length)) : 0;
  return '▰'.repeat(filled) + '▱'.repeat(length - filled);
}
