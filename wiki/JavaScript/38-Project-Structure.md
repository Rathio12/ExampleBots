# Project Structure

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Used in** | [02-enhanced/src/](../../javascript/02-enhanced/src) · [03-expert/src/](../../javascript/03-expert/src) |

A single file is great for learning. Past ~10 commands, split the bot into folders that are loaded automatically.

## Recommended layout

```
src/
├── index.js              entry point: create client, load handlers, login
├── deploy-commands.js    registers slash commands (run manually)
├── config.js             validated configuration
├── logger.js
├── loaders.js            imports every file in a folder
├── commands/             one file per command (sub-folders allowed)
│   ├── general/ping.js
│   └── moderation/ban.js
├── components/           button/select/modal handlers, keyed by custom-ID prefix
├── events/               one file per event
├── services/             long-lived logic: schedulers, API clients, leveling
├── database/             connection, migrations, repositories
└── lib/                  pure helpers (easy to unit test)
```

## The loader

```js
// src/loaders.js
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadModules(directory) {
  const files = readdirSync(directory, { recursive: true }).filter((f) => f.endsWith('.js'));
  const modules = [];
  for (const file of files) {
    const module = await import(pathToFileURL(join(directory, file)).href);   // file:// URL needed on Windows
    if (module.default) modules.push(module.default);
  }
  return modules;
}
```

## Module shapes

```js
// commands/*.js
export default { data: SlashCommandBuilder, cooldown?: number, execute(interaction, ctx), autocomplete?(interaction, ctx) };

// components/*.js: handles custom IDs like "poll:123:yes"
export default { id: 'poll', execute(interaction, ctx, ...args) };

// events/*.js
export default { name: Events.X, once?: boolean, execute(ctx, ...args) };
```

## The entry point

```js
const client = new Client({ intents });
client.commands = new Collection();
client.components = new Collection();

for (const c of await loadModules(join(here, 'commands'))) client.commands.set(c.data.name, c);
for (const c of await loadModules(join(here, 'components'))) client.components.set(c.id, c);
for (const e of await loadModules(join(here, 'events'))) {
  const listener = (...args) => Promise.resolve(e.execute(ctx, ...args)).catch((err) => logger.error(e.name, err));
  e.once ? client.once(e.name, listener) : client.on(e.name, listener);
}

await client.login(config.token);
```

## Sharing dependencies: the context object

Instead of every file importing its own database connection, the expert bot builds dependencies once and passes a `ctx`:

```js
const ctx = { client, config, logger, db, repos };
ctx.leveling = createLevelingService(ctx);
ctx.modlog = createModLog(ctx);

// command
async execute(interaction, { repos, modlog }) { … }
```

Benefits: one place to see what exists, no hidden singletons, and tests can pass fakes.

## The interaction router

```js
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) return client.commands.get(interaction.commandName)?.autocomplete?.(interaction, ctx);

  if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
    return client.commands.get(interaction.commandName)?.execute(interaction, ctx);
  }

  if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
    const [prefix, ...args] = interaction.customId.split(':');
    return client.components.get(prefix)?.execute(interaction, ctx, ...args);
  }
});
```

(Wrap it in try/catch, see [Error Handling](34-Error-Handling.md).)

## Scripts

```json
"scripts": {
  "start": "node src/index.js",
  "dev": "node --watch src/index.js",
  "deploy": "node src/deploy-commands.js",
  "test": "node --test"
}
```

## Moving to TypeScript

The same structure works with TypeScript. Define interfaces for `Command`, `Component` and `Event`, and the compiler checks every file.

## See also
- [Slash Commands](04-Slash-Commands.md) · [Events](28-Events.md) · [Testing](41-Testing.md)
