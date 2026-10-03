# Configuration & .env

<sub>[JavaScript portal](README.md) › Getting started</sub>

| | |
|---|---|
| **Packages** | `dotenv` (or Node's built-in `--env-file`) |
| **Used in** | [02-enhanced/src/config.js](../../javascript/02-enhanced/src/config.js) · [03-expert/src/config.js](../../javascript/03-expert/src/config.js) |

Keep secrets and settings out of code. Read them from environment variables, validate them once at startup, and pass a frozen config object around.

## Loading `.env`

**Option 1: dotenv** (works on every Node version):

```js
import 'dotenv/config';            // must run before you read process.env
console.log(process.env.DISCORD_TOKEN);
```

**Option 2: built into Node 20.6+:**

```bash
node --env-file=.env index.js
```

Real environment variables (from Docker, systemd, or the shell) take priority over `.env` with dotenv's default settings, which is what you want in production.

## A validated config module

```js
// src/config.js
import 'dotenv/config';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

const optional = (name) => process.env[name]?.trim() || null;

function integer(name, fallback, { min = -Infinity, max = Infinity } = {}) {
  const raw = optional(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

export const config = Object.freeze({
  token: required('DISCORD_TOKEN'),
  guildId: optional('GUILD_ID'),
  databasePath: optional('DATABASE_PATH') ?? './data/bot.db',
  xpCooldownSeconds: integer('XP_COOLDOWN_SECONDS', 60, { min: 0, max: 3600 }),
});
```

Then, everywhere else:

```js
import { config } from './config.js';
await client.login(config.token);
```

Why this pattern:
- **Fail fast:** a typo in `.env` crashes at startup with a clear message, not ten minutes later.
- **One place** documents every setting.
- **Types:** numbers are numbers, empty strings become `null`.
- `Object.freeze` stops accidental changes at runtime.

## Validating with zod (optional)

```js
import { z } from 'zod';

const schema = z.object({
  DISCORD_TOKEN: z.string().min(50),
  GUILD_ID: z.string().regex(/^\d{17,20}$/).optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const env = schema.parse(process.env);
```

## Per-server settings

Environment variables are global. Settings that differ per server (log channel, welcome message, prefix) belong in the **database**, keyed by `guild_id`. The expert bot's `/settings` command and `settingsRepository` show the pattern ([SQLite Database](37-SQLite-Database.md)).

## `.env.example`

Commit a template with every key and a comment, and no real values:

```env
# Required
DISCORD_TOKEN=your-bot-token-here

# Optional: register commands to one server instantly
GUILD_ID=
```

## Common mistakes

| Mistake | Result |
|---|---|
| `import 'dotenv/config'` placed after code that reads `process.env` | Values are `undefined` |
| Quotes or spaces around the token | `TokenInvalid` |
| `.env` committed to git | Token leaked. Reset it immediately. |
| Running from a different folder | dotenv can't find `.env` (it looks in the current working directory) |

## See also
- [Security Best Practices](../Security-Best-Practices.md)
- [Deployment](42-Deployment.md)
