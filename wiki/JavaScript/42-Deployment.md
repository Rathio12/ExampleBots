# Deployment

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Used in** | [03-expert Dockerfile](../../javascript/03-expert/Dockerfile) · [docker-compose.yml](../../javascript/03-expert/docker-compose.yml) |

## Production checklist

- [ ] `npm ci --omit=dev` (exact versions from `package-lock.json`, no dev dependencies)
- [ ] `NODE_ENV=production` (JSON logs in the expert bot)
- [ ] Token in environment variables, not in files committed to git
- [ ] Commands deployed (`npm run deploy`) after definition changes
- [ ] Process manager restarts the bot on crash/reboot
- [ ] Database on persistent storage, backed up

## Docker

```dockerfile
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
CMD ["node", "src/index.js"]
```

The build stage has compilers for native modules (`better-sqlite3`). The runtime stage stays small and runs as the unprivileged `node` user.

```bash
docker compose up -d --build
docker compose logs -f
```

## pm2

```bash
npm install -g pm2
pm2 start src/index.js --name my-bot --time
pm2 save
pm2 startup          # prints a command that enables start-on-boot
pm2 logs my-bot
pm2 restart my-bot
```

`ecosystem.config.cjs`:

```js
module.exports = {
  apps: [{ name: 'my-bot', script: 'src/index.js', env: { NODE_ENV: 'production' }, max_memory_restart: '300M' }],
};
```

## systemd

See [Deployment & Hosting](../Deployment-and-Hosting.md#option-b-systemd-linux-no-docker) with `ExecStart=/usr/bin/node src/index.js`.

## Graceful shutdown

```js
async function shutdown(signal) {
  logger.info(`${signal} received`);
  stopBackgroundJobs();
  await client.destroy();
  db.close();
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
```

## Updating

```bash
git pull
npm ci --omit=dev
npm run deploy            # only if command definitions changed
pm2 restart my-bot        # or: docker compose up -d --build
```

## Memory tips

- Limit caches with `makeCache: Options.cacheWithLimits({ MessageManager: 100 })` if you don't need many cached messages.
- Add `sweepers` to clear old messages periodically.
- Request only the intents you need. Fewer events means less memory.

## See also
- [Deployment & Hosting](../Deployment-and-Hosting.md) · [Logging](39-Logging.md) · [Sharding](40-Sharding.md)
