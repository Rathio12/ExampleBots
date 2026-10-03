# Background Tasks

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key API** | `discord.ext.tasks.loop` |
| **Used in** | [02-enhanced gameserver.py](../../python/02-enhanced/bot/cogs/gameserver.py) · [03-expert reminders.py](../../python/03-expert/bot/cogs/reminders.py) |

`discord.ext.tasks` runs a coroutine on a schedule, handles reconnects, and makes start/stop easy.

## A loop in a cog

```python
from discord.ext import commands, tasks


class Status(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    async def cog_load(self) -> None:
        self.update.start()

    async def cog_unload(self) -> None:
        self.update.cancel()

    @tasks.loop(minutes=5)
    async def update(self) -> None:
        try:
            count = await fetch_player_count()
            await self.bot.change_presence(activity=discord.Game(f"{count} players"))
        except Exception:
            log.exception("Status update failed")       # keep the loop alive

    @update.before_loop
    async def before_update(self) -> None:
        await self.bot.wait_until_ready()               # don't run before the cache is ready
```

## Loop options

```python
@tasks.loop(seconds=15)                       # interval
@tasks.loop(hours=1, count=24)                # stop after 24 runs
@tasks.loop(time=datetime.time(hour=9, tzinfo=datetime.timezone.utc))          # every day at 09:00 UTC
@tasks.loop(time=[datetime.time(hour=h) for h in (9, 21)])                     # several times a day
```

Changing the interval at runtime (used by the Enhanced bot to read it from config):

```python
self.update.change_interval(minutes=config.status_interval_minutes)
self.update.start()
```

Other controls: `.stop()` (after the current run), `.cancel()` (now), `.restart()`, `.is_running()`, `.current_loop`.

## Error handling

```python
@update.error
async def update_error(self, error: BaseException) -> None:
    log.exception("Loop crashed", exc_info=error)
    self.update.restart()
```

## Durable scheduling (reminders)

Don't `asyncio.sleep(3 days)`: it's lost on restart. Store the due time and poll:

```python
@tasks.loop(seconds=15)
async def deliver_due(self) -> None:
    for row in await self.bot.db.reminders.due():          # WHERE remind_at <= now
        await self._deliver(row)
        await self.bot.db.reminders.remove(row["id"])
```

The same pattern covers temp bans, giveaways and scheduled announcements.

## One-off delays

```python
async def delete_later(message: discord.Message, delay: float) -> None:
    await asyncio.sleep(delay)
    await message.delete()

asyncio.create_task(delete_later(msg, 30))   # fine for short delays; keep a reference if needed
```

## Rate limits

| Task | Safe frequency |
|---|---|
| `change_presence` | ≥ 15–60 s |
| Channel rename/topic | ≥ 5 min (2 per 10 min) |
| Database polling | seconds |

## See also
- [Background Tasks](../Background-Tasks.md) · [SQLite Database](37-SQLite-Database.md) · [HTTP Requests](36-HTTP-Requests.md)
