// Recursively imports every .js file below a directory, so commands can be
// organised in sub-folders (commands/moderation/ban.js, ...).
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadModules(directory) {
  const files = readdirSync(directory, { recursive: true })
    .filter((file) => file.endsWith('.js'))
    .sort();

  const modules = [];
  for (const file of files) {
    const module = await import(pathToFileURL(join(directory, file)).href);
    if (module.default) modules.push(module.default);
  }
  return modules;
}
