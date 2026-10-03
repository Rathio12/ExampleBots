// Parses human durations like "10m", "1h30m", "2d 12h" into seconds.
// Pure functions with no Discord dependency are easy to unit test — see test/.

const UNITS = { s: 1, m: 60, h: 3600, d: 86_400, w: 604_800 };

/**
 * @param {string} input e.g. "1h30m"
 * @returns {number|null} seconds, or null when the input is invalid or zero
 */
export function parseDuration(input) {
  const text = String(input ?? '').toLowerCase().replace(/\s+/g, '');
  if (!/^(\d+[smhdw])+$/.test(text)) return null;

  let seconds = 0;
  for (const [, amount, unit] of text.matchAll(/(\d+)([smhdw])/g)) {
    seconds += Number(amount) * UNITS[unit];
  }
  return seconds > 0 && Number.isSafeInteger(seconds) ? seconds : null;
}

/**
 * @param {number} totalSeconds
 * @returns {string} e.g. "1d 2h 5m"
 */
export function formatDuration(totalSeconds) {
  const parts = [];
  let remaining = Math.max(0, Math.floor(totalSeconds));
  for (const [unit, size] of [['w', 604_800], ['d', 86_400], ['h', 3600], ['m', 60], ['s', 1]]) {
    const amount = Math.floor(remaining / size);
    if (amount > 0) {
      parts.push(`${amount}${unit}`);
      remaining -= amount * size;
    }
  }
  return parts.join(' ') || '0s';
}
