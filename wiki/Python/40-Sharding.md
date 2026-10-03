# Sharding

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square)

<sub>[Python portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key classes** | `commands.AutoShardedBot`, `discord.AutoShardedClient` |
| **When** | Required at 2,500 servers |

## Switching is one line

```python
from discord.ext import commands

class MyBot(commands.AutoShardedBot):     # was: commands.Bot
    ...
```

discord.py asks Discord for the recommended shard count and runs all shards in one process.

## Options

```python
commands.AutoShardedBot(
    command_prefix=commands.when_mentioned,
    intents=intents,
    shard_count=4,                 # fixed number (optional)
    shard_ids=[0, 1],              # run only these shards in this process (multi-process setups)
)
```

## Shard info

```python
bot.shard_count
bot.latencies                     # [(shard_id, latency), …]
guild.shard_id                    # which shard serves this guild
bot.get_shard(0).latency

@commands.Cog.listener()
async def on_shard_ready(self, shard_id: int): ...
```

## Things that change

| Concern | Change |
|---|---|
| Background tasks | Still one process with `AutoShardedBot`. Run once (not per shard). |
| Multiple processes (`shard_ids`) | State and cooldowns are per process. Use Redis or PostgreSQL. |
| Logs | Include the shard ID |

Most bots never need more than `AutoShardedBot` in a single process.

## See also
- [How Discord Bots Work → Sharding](../How-Discord-Bots-Work.md#sharding) · [Deployment](42-Deployment.md)
