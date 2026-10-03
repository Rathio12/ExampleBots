// =============================================================================
//  Enhanced Discord Bot — JavaScript (discord.js v14)
// -----------------------------------------------------------------------------
//  Entry point. It wires things together but contains no command logic:
//    src/commands/    one file per slash command
//    src/components/  handlers for buttons, select menus and modals
//    src/events/      one file per Discord event
//    src/services/    background work (game-server status updater)
// =============================================================================
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { loadModules } from './loaders.js';

const here = dirname(fileURLToPath(import.meta.url));

// Only request the privileged GuildMembers intent when the welcome feature is
// enabled. Requesting a privileged intent you have not enabled in the
// Developer Portal makes login fail with "Used disallowed intents".
const intents = [GatewayIntentBits.Guilds];
if (config.welcomeChannelId) intents.push(GatewayIntentBits.GuildMembers);

const client = new Client({ intents });

// Attach our registries to the client so any handler can reach them through
// `interaction.client`.
client.commands = new Collection();
client.components = new Collection();

for (const command of await loadModules(join(here, 'commands'))) {
  client.commands.set(command.data.name, command);
}
for (const component of await loadModules(join(here, 'components'))) {
  client.components.set(component.id, component);
}
for (const event of await loadModules(join(here, 'events'))) {
  const register = event.once ? client.once.bind(client) : client.on.bind(client);
  register(event.name, (...args) => event.execute(...args));
}

logger.info(`Loaded ${client.commands.size} commands and ${client.components.size} component handlers`);

// Last-resort safety nets: log instead of crashing on unexpected errors.
process.on('unhandledRejection', (error) => logger.error('Unhandled promise rejection:', error));
client.on('error', (error) => logger.error('Client error:', error));

await client.login(config.token);
