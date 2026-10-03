// Loads and validates configuration once at startup. Failing fast with a clear
// message beats a confusing crash ten minutes later.
import 'dotenv/config';

const optional = (name) => process.env[name]?.trim() || null;

function integer(name, fallback, { min = -Infinity, max = Infinity } = {}) {
  const raw = optional(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max} (got "${raw}")`);
  }
  return value;
}

export function loadConfig() {
  const token = optional('DISCORD_TOKEN');
  if (!token) throw new Error('DISCORD_TOKEN is required. Copy .env.example to .env and fill it in.');

  const xpMin = integer('XP_MIN', 15, { min: 1, max: 1000 });
  const xpMax = integer('XP_MAX', 25, { min: xpMin, max: 1000 });

  return Object.freeze({
    token,
    guildId: optional('GUILD_ID'),
    databasePath: optional('DATABASE_PATH') ?? './data/bot.db',
    logLevel: optional('LOG_LEVEL') ?? 'info',
    xp: Object.freeze({
      min: xpMin,
      max: xpMax,
      cooldownSeconds: integer('XP_COOLDOWN_SECONDS', 60, { min: 0, max: 3600 }),
    }),
  });
}
