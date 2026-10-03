// Loads every file in a folder as a module. This is what makes the bot
// "modular": drop a new file in src/commands and it is picked up automatically.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Import the default export of every .js file in `directory`.
 * @param {string} directory absolute path
 * @returns {Promise<any[]>}
 */
export async function loadModules(directory) {
  const files = readdirSync(directory).filter((file) => file.endsWith('.js'));
  const modules = [];
  for (const file of files) {
    // ESM imports need a file:// URL on Windows, hence pathToFileURL.
    const module = await import(pathToFileURL(join(directory, file)).href);
    modules.push(module.default);
  }
  return modules;
}
