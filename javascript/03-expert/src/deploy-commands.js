// Uploads slash commands and context menus to Discord.
//   npm run deploy
// Run it whenever a command's name, description or options change.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REST, Routes } from 'discord.js';
import { loadConfig } from './config.js';
import { loadModules } from './loaders.js';

const here = dirname(fileURLToPath(import.meta.url));
const config = loadConfig();

const commands = await loadModules(join(here, 'commands'));
const body = commands.map((command) => command.data.toJSON());

const rest = new REST().setToken(config.token);
const application = await rest.get(Routes.currentApplication());

const route = config.guildId
  ? Routes.applicationGuildCommands(application.id, config.guildId)
  : Routes.applicationCommands(application.id);

const result = await rest.put(route, { body });
console.log(`✅ Deployed ${result.length} commands ${config.guildId ? `to guild ${config.guildId}` : 'globally'}`);
