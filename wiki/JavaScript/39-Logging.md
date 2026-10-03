# Logging

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Used in** | [02-enhanced logger.js](../../javascript/02-enhanced/src/logger.js) · [03-expert logger.js](../../javascript/03-expert/src/logger.js) |
| **Optional package** | [`pino`](https://getpino.io) |

Good logs answer "what happened?" when something goes wrong at 3 a.m.

## Levels

| Level | Use for |
|---|---|
| `debug` | Details useful while developing (every command run) |
| `info` | Normal milestones (logged in, commands deployed) |
| `warn` | Something odd but handled (API timeout, missing permission) |
| `error` | A real failure (exception in a handler) |

## A small logger without dependencies

```js
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

export function createLogger(level = 'info', { json = process.env.NODE_ENV === 'production' } = {}) {
  const threshold = LEVELS[level] ?? LEVELS.info;
  const log = (lvl, message, meta) => {
    if (LEVELS[lvl] < threshold) return;
    if (meta instanceof Error) meta = { error: meta.message, stack: meta.stack };
    const time = new Date().toISOString();
    console.log(json ? JSON.stringify({ time, level: lvl, message, ...meta }) : `${time} ${lvl.toUpperCase()} ${message}`, json ? '' : meta ?? '');
  };
  return Object.fromEntries(Object.keys(LEVELS).map((l) => [l, (m, meta) => log(l, m, meta)]));
}
```

The expert bot's version prints coloured lines in development and **JSON lines** in production, which log tools (Grafana Loki, Datadog, Better Stack) can search and filter.

## pino

```bash
npm install pino pino-pretty
```

```js
import pino from 'pino';
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

logger.info({ guildId, userId }, 'Command executed');
logger.error({ err }, 'Interaction failed');
```

## What to log

- ✅ Startup (bot tag, guild count, commands loaded), shutdown
- ✅ Errors with stack traces and context (command name, guild ID)
- ✅ Moderation actions (also in the mod log)
- ✅ External API failures
- ❌ **Tokens, API keys, passwords**
- ❌ Full message content of every message (privacy, and noise)

## discord.js internal logs

```js
client.on(Events.Warn, (m) => logger.warn(m));
client.on(Events.Error, (e) => logger.error('Client error', e));
client.on(Events.Debug, (m) => logger.debug(m));   // extremely verbose, only enable when debugging
client.rest.on('rateLimited', (info) => logger.warn('Rate limited', info));
```

## Logging to Discord

A webhook to a private channel is handy for errors:

```js
const errorHook = new WebhookClient({ url: process.env.ERROR_WEBHOOK_URL });
process.on('unhandledRejection', (e) => errorHook.send(`\`\`\`${String(e?.stack ?? e).slice(0, 1900)}\`\`\``).catch(() => {}));
```

## See also
- [Error Handling](34-Error-Handling.md) · [Deployment](42-Deployment.md)
