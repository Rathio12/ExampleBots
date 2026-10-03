// Registers (deploys) slash commands with Discord.
//
// Run this ONLY when you add, remove or change a command's definition:
//     npm run deploy
// Commands persist on Discord's side, so there is no need to re-register on
// every start. This keeps you far away from command-creation rate limits.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import { loadModules } from './loaders.js';

const here = dirname(fileURLToPath(import.meta.url));
const commands = await loadModules(join(here, 'commands'));
const body = commands.map((command) => command.data.toJSON());

const rest = new REST().setToken(config.token);

// Ask Discord which application this token belongs to — no CLIENT_ID needed.
const application = await rest.get(Routes.currentApplication());

const route = config.guildId
  ? Routes.applicationGuildCommands(application.id, config.guildId)
  : Routes.applicationCommands(application.id);

// PUT = "replace the whole list". Commands not in `body` are deleted.
const result = await rest.put(route, { body });
console.log(`✅ Deployed ${result.length} commands ${config.guildId ? `to guild ${config.guildId}` : 'globally'}`);
