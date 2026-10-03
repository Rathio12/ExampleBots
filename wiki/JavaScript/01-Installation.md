# Installation

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Getting_started-607D8B?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[JavaScript portal](README.md) › Getting started</sub>

| | |
|---|---|
| **Requires** | Node.js 20+ (LTS recommended), npm |
| **Packages** | `discord.js`, `dotenv` |
| **Used in** | every JavaScript example |

This article sets up a fresh discord.js project from an empty folder.

## 1. Install Node.js

Download the **LTS** version from [nodejs.org](https://nodejs.org), or use a version manager ([nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm), [nvm-windows](https://github.com/coreybutler/nvm-windows)):

```bash
node --version    # v20.x or newer
npm --version
```

## 2. Create the project

```bash
mkdir my-bot && cd my-bot
npm init -y
npm install discord.js dotenv
```

Open `package.json` and add `"type": "module"` so you can use modern `import` syntax:

```json
{
  "name": "my-bot",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "discord.js": "^14.18.0",
    "dotenv": "^16.4.7"
  }
}
```

| Script | What it does |
|---|---|
| `npm start` | Runs the bot |
| `npm run dev` | Restarts automatically when you save a file (built into Node 20+) |

## 3. Add your token

`.env`:

```env
DISCORD_TOKEN=your-token-here
GUILD_ID=your-test-server-id
```

`.gitignore`:

```gitignore
node_modules/
.env
```

## 4. Minimal bot

`index.js`:

```js
import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
```

```bash
npm start
# Logged in as MyBot#1234
```

The bot shows as online in your server. Next: give it commands ([Slash Commands](04-Slash-Commands.md)).

## ESM vs CommonJS

| | ESM (`"type": "module"`) | CommonJS (default) |
|---|---|---|
| Import | `import { Client } from 'discord.js'` | `const { Client } = require('discord.js')` |
| Top-level `await` | Yes | No |
| `__dirname` | `dirname(fileURLToPath(import.meta.url))` | Built in |
| Used in this repo | ✅ | — |

Both work. Pick one and don't mix them in one project.

## TypeScript (optional)

discord.js ships its own type definitions:

```bash
npm install -D typescript tsx @types/node
npx tsc --init
npx tsx index.ts     # run TypeScript directly during development
```

## Optional packages

| Package | Purpose |
|---|---|
| `better-sqlite3` | SQLite database ([article](37-SQLite-Database.md)) |
| `@discordjs/voice`, `@discordjs/opus`, `ffmpeg-static` | Voice ([article](31-Voice.md)) |
| `pino` | Fast structured logging ([article](39-Logging.md)) |
| `zod` | Validating config and API responses |
| `bufferutil`, `zlib-sync` | Optional speed-ups for the WebSocket connection |

## Common problems

| Error | Fix |
|---|---|
| `Cannot use import statement outside a module` | Add `"type": "module"` to `package.json` |
| `TokenInvalid` | Wrong token. Reset it in the Developer Portal. |
| `node: command not found` | Node isn't on PATH. Reinstall or restart your terminal. |
| `ERR_REQUIRE_ESM` | You're mixing `require()` with an ESM-only package. Use `import`. |

## See also
- [Client & Intents](02-Client-and-Intents.md)
- [Configuration & .env](03-Configuration-and-Env.md)
- [Getting Started](../Getting-Started.md) (creating the application and token)
