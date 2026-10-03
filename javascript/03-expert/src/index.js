// =============================================================================
//  Expert Discord Bot — JavaScript (discord.js v14)
// -----------------------------------------------------------------------------
//  Composition root: builds every dependency once and hands a shared `ctx`
//  object to commands, components and events. Nothing else creates its own
//  database connection or logger — that makes the code easy to test & reason about.
// =============================================================================
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { loadConfig } from './config.js';
import { openDatabase } from './database/index.js';
import { createRepositories } from './database/repositories.js';
import { loadModules } from './loaders.js';
import { createLogger } from './logger.js';
import { createAuditLog } from './services/auditlog.js';
import { createLevelingService } from './services/leveling.js';
import { createModLog } from './services/modlog.js';
import { createReminderService } from './services/reminders.js';

const here = dirname(fileURLToPath(import.meta.url));

let config;
try {
  config = loadConfig();
} catch (error) {
  console.error(`❌ Configuration error: ${error.message}`);
  process.exit(1);
}

const logger = createLogger(config.logLevel);
const db = openDatabase(config.databasePath, logger);
const repos = createRepositories(db);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, //            channels, roles, slash commands
    GatewayIntentBits.GuildMembers, //      privileged: joins, leaves, role changes
    GatewayIntentBits.GuildModeration, //   bans + audit-log access events
    GatewayIntentBits.GuildMessages, //     XP for chatting, edit/delete logs
    GatewayIntentBits.MessageContent, //    privileged: content in edit/delete logs
    GatewayIntentBits.GuildVoiceStates, //  voice join/leave/move logs
  ],
  // Partials let us receive events for things that are not in the cache,
  // e.g. a message deleted that was sent before the bot started.
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
  // Safety default: never ping @everyone/@here or roles unless explicitly allowed.
  allowedMentions: { parse: ['users'] },
});

// The shared context passed to every handler.
const ctx = { client, config, logger, db, repos };
ctx.leveling = createLevelingService(ctx);
ctx.reminders = createReminderService(ctx);
ctx.modlog = createModLog(ctx);
ctx.audit = createAuditLog(ctx);

client.commands = new Collection();
client.components = new Collection();

for (const command of await loadModules(join(here, 'commands'))) {
  client.commands.set(command.data.name, command);
}
for (const component of await loadModules(join(here, 'components'))) {
  client.components.set(component.id, component);
}
for (const event of await loadModules(join(here, 'events'))) {
  const listener = (...args) =>
    Promise.resolve(event.execute(ctx, ...args)).catch((error) =>
      logger.error(`Error in "${event.name}" handler`, error),
    );
  if (event.once) client.once(event.name, listener);
  else client.on(event.name, listener);
}

logger.info(`Loaded ${client.commands.size} commands, ${client.components.size} components`);

// --- Graceful shutdown ---------------------------------------------------------
// Docker/systemd send SIGTERM; Ctrl+C sends SIGINT. Close everything cleanly so
// the database is never left half-written.
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received — shutting down`);
  ctx.reminders.stop();
  ctx.leveling.stop();
  await client.destroy();
  db.close();
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => logger.error('Unhandled promise rejection', error));
client.on('error', (error) => logger.error('Client error', error));

await client.login(config.token);
