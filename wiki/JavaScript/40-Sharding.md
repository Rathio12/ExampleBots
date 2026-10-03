# Sharding

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square)

<sub>[JavaScript portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key classes** | `ShardingManager`, `ShardClientUtil` (`client.shard`) |
| **When** | Required at **2,500 servers**. Usually set up around 1,500–2,000. |

A shard is one gateway connection handling a subset of servers. Discord requires sharding once a bot is in 2,500 servers. Until then, ignore this article.

## ShardingManager (one process per shard)

```js
// shard.js: the new entry point
import 'dotenv/config';
import { ShardingManager } from 'discord.js';

const manager = new ShardingManager('./src/index.js', {
  token: process.env.DISCORD_TOKEN,
  totalShards: 'auto',            // ask Discord for the recommended count
});

manager.on('shardCreate', (shard) => console.log(`Launched shard ${shard.id}`));
await manager.spawn();
```

`src/index.js` stays the same: each child process creates its own client, and discord.js passes the shard ID automatically.

## Cross-shard data

Each shard only knows its own servers. To get totals:

```js
const counts = await client.shard.fetchClientValues('guilds.cache.size');
const totalGuilds = counts.reduce((a, b) => a + b, 0);

const members = await client.shard.broadcastEval((c) => c.guilds.cache.reduce((n, g) => n + g.memberCount, 0));
const totalMembers = members.reduce((a, b) => a + b, 0);
```

## Internal sharding (one process)

For moderate sizes you can run several shards in one process:

```js
const client = new Client({ intents, shards: 'auto' });
```

Simpler, but one crash takes down every shard.

## What changes when you shard

| Concern | Change |
|---|---|
| In-memory state (cooldowns, caches) | Per shard. Use Redis if it must be global. |
| SQLite | Several processes writing one file works with WAL, but PostgreSQL is safer at this scale. |
| Background jobs | Run them on **one** shard (`if (client.shard.ids.includes(0))`) or they run N times |
| Logs | Include the shard ID |

## See also
- [How Discord Bots Work → Sharding](../How-Discord-Bots-Work.md#sharding) · [Deployment](42-Deployment.md)
