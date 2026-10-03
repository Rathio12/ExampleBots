// Centralised configuration. Every other file imports `config` from here
// instead of reading process.env directly — one place to validate everything.
import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Missing required environment variable ${name}. See .env.example`);
    process.exit(1);
  }
  return value;
}

// Empty strings in .env should behave like "not set".
const optional = (name) => process.env[name]?.trim() || null;

export const config = Object.freeze({
  token: required('DISCORD_TOKEN'),
  guildId: optional('GUILD_ID'),
  welcomeChannelId: optional('WELCOME_CHANNEL_ID'),
  feedbackChannelId: optional('FEEDBACK_CHANNEL_ID'),
  gameServerAddress: optional('GAME_SERVER_ADDRESS'),
  statusChannelId: optional('STATUS_CHANNEL_ID'),
  // Never go below 5 minutes: channel renames are heavily rate limited.
  statusIntervalMinutes: Math.max(5, Number(process.env.STATUS_INTERVAL_MINUTES) || 5),
  logLevel: optional('LOG_LEVEL') ?? 'info',
  defaultCooldownSeconds: 3,
});
