# Background Tasks

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key APIs** | `setInterval`, `setTimeout`, `node-cron`/`croner` (optional) |
| **Used in** | [02-enhanced statusUpdater.js](../../javascript/02-enhanced/src/services/statusUpdater.js) · [03-expert reminders.js](../../javascript/03-expert/src/services/reminders.js) |

## Fixed interval

```js
function startStatusUpdater(client) {
  const tick = async () => {
    try {
      const count = await fetchPlayerCount();
      client.user.setActivity(`${count} players`, { type: ActivityType.Watching });
    } catch (error) {
      console.warn('Status update failed', error);   // keep the loop alive
    }
  };
  tick();                                               // run once immediately
  const timer = setInterval(tick, 5 * 60_000);
  return () => clearInterval(timer);                    // call on shutdown
}

client.once(Events.ClientReady, (c) => {
  const stop = startStatusUpdater(c);
  process.once('SIGTERM', stop);
});
```

Start tasks in the ready event, never before the client is logged in.

## Preventing overlap

If a tick can take longer than the interval:

```js
let running = false;
setInterval(async () => {
  if (running) return;
  running = true;
  try { await work(); } finally { running = false; }
}, 15_000);
```

## Durable scheduling: the polling pattern

`setTimeout(fn, 3 days)` is lost on restart, and anything over ~24.8 days overflows. Store due times in the database and poll:

```js
// remind.js: when the command runs
repos.reminders.add(userId, channelId, text, Math.floor(Date.now() / 1000) + seconds);

// reminders service: every 15 s
setInterval(async () => {
  for (const reminder of repos.reminders.due()) {        // SELECT … WHERE remind_at <= now
    await deliver(reminder).catch(console.error);
    repos.reminders.remove(reminder.id);
  }
}, 15_000);
```

Works for reminders, temp bans, giveaways and scheduled posts.

## Cron schedules

```bash
npm install croner
```

```js
import { Cron } from 'croner';

// Every day at 09:00 Berlin time
new Cron('0 9 * * *', { timezone: 'Europe/Berlin' }, async () => {
  await announcementsChannel.send('☀️ Good morning!');
});
```

## Respect rate limits

| Task | Safe frequency |
|---|---|
| Presence update | ≥ 15–60 s |
| Channel rename/topic | ≥ 5 min (limit: 2 per 10 min) |
| Polling an external API | Whatever the API allows. Cache results. |
| Database polling | Seconds are fine (local, cheap) |

## Unref'd timers

`timer.unref()` lets Node exit even if the timer is still scheduled. Useful for cleanup sweeps that shouldn't keep the process alive.

## See also
- [Background Tasks](../Background-Tasks.md) (all languages) · [SQLite Database](37-SQLite-Database.md) · [HTTP Requests](36-HTTP-Requests.md)
