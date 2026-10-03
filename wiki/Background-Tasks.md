# Background Tasks

Not everything a bot does is a reaction to a user. Status updates, reminders, scheduled announcements and cleanup jobs run on their own.

## Two examples in this repo

| Task | Tier | Pattern |
|---|---|---|
| Game-server player count in presence/channel name | Enhanced | Fixed interval (every N minutes) |
| Reminder delivery | Expert | Poll the database for due work every 15 s |

## Fixed-interval tasks

**JavaScript**

```js
function startStatusUpdater(client) {
  const update = async () => {
    try {
      const status = await fetchMinecraftStatus(address);
      client.user.setActivity(`${status.players}/${status.maxPlayers} players`, { type: ActivityType.Watching });
    } catch (error) {
      logger.warn('Status update failed', error);   // never let one failure kill the loop
    }
  };
  update();
  setInterval(update, 5 * 60_000);
}
```

**Python:** `discord.ext.tasks` handles reconnects, errors and timing:

```python
from discord.ext import tasks

class GameServer(commands.Cog):
    async def cog_load(self):
        self.update_status.start()

    async def cog_unload(self):
        self.update_status.cancel()

    @tasks.loop(minutes=5)
    async def update_status(self):
        ...

    @update_status.before_loop
    async def before(self):
        await self.bot.wait_until_ready()   # don't run before the bot is connected
```

**C#:** `PeriodicTimer` inside a task, or a `BackgroundService` with the Generic Host:

```csharp
public sealed class ReminderService(...) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(15));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try { /* work */ }
            catch (Exception ex) { logger.LogError(ex, "Tick failed"); }
        }
    }
}
```

The host cancels `stoppingToken` on shutdown, so the loop ends cleanly.

## Scheduling future work: why not `setTimeout`?

To remind someone in 3 days, the obvious approach is `setTimeout(send, 3 * 86_400_000)`. It breaks because:

1. **Restarts lose it.** Every deploy wipes pending timers.
2. **Limits.** JavaScript timers overflow past ~24.8 days.
3. **Memory.** Thousands of pending timers add up.

The expert bots store `remind_at` in the database and run one small loop:

```js
setInterval(() => {
  for (const reminder of repos.reminders.due(nowSeconds())) {   // WHERE remind_at <= now
    deliver(reminder);
    repos.reminders.remove(reminder.id);
  }
}, 15_000);
```

Restarts don't matter: overdue reminders are delivered on the next tick. The same pattern works for temporary bans (unban when due), giveaways (pick a winner when due) and scheduled announcements.

**Avoid overlapping runs.** If a tick takes longer than the interval, the JS bot skips with a `running` flag. Python's `tasks.loop` and C#'s `PeriodicTimer` never overlap by design.

## Rate-limit-aware updates

Background jobs are where bots usually hit rate limits:

- **Channel names/topics: 2 edits per 10 minutes.** The status updater only renames when the text actually changed, and the interval is clamped to at least 5 minutes.
- **Presence updates:** cheap, but don't do it every second.
- **Mass DMs or role changes:** spread them out, or better, don't do them.

## Cron-style schedules

For "every day at 09:00 UTC":

| Language | Option |
|---|---|
| JavaScript | [`node-cron`](https://www.npmjs.com/package/node-cron) or [`croner`](https://www.npmjs.com/package/croner) |
| Python | `@tasks.loop(time=datetime.time(hour=9, tzinfo=datetime.timezone.utc))` (built in) |
| C# | [Quartz.NET](https://www.quartz-scheduler.net/), [Cronos](https://github.com/HangfireIO/Cronos) + `BackgroundService` |

## Checklist

- [ ] Start the task **after** the bot is ready.
- [ ] Catch errors inside each run. One failure must not stop future runs.
- [ ] Stop the task on shutdown.
- [ ] Persist anything that must survive a restart.
- [ ] Respect rate limits: update only on change.
