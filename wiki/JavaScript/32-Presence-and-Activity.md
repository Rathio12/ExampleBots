# Presence & Activity

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[JavaScript portal](README.md) › Events</sub>

| | |
|---|---|
| **Key APIs** | `client.user.setPresence`, `setActivity`, `setStatus`, `ActivityType` |
| **Used in** | [02-enhanced statusUpdater.js](../../javascript/02-enhanced/src/services/statusUpdater.js) · [03-expert ready.js](../../javascript/03-expert/src/events/ready.js) |

The bot's presence is its status dot and the "Playing …" line under its name.

## Setting an activity

```js
import { ActivityType } from 'discord.js';

client.user.setActivity('/help', { type: ActivityType.Listening });   // "Listening to /help"
client.user.setActivity('12/100 players', { type: ActivityType.Watching });
client.user.setActivity('Minecraft', { type: ActivityType.Playing });
client.user.setActivity('the tournament', { type: ActivityType.Competing });
client.user.setActivity('Live coding', { type: ActivityType.Streaming, url: 'https://twitch.tv/yourchannel' });

// Custom status (just text, like a user's custom status)
client.user.setActivity({ name: 'custom', state: '🛠️ Under maintenance', type: ActivityType.Custom });
```

## Status

```js
client.user.setStatus('online');      // online | idle | dnd | invisible
```

## Everything at once

```js
client.user.setPresence({
  status: 'dnd',
  activities: [{ name: 'maintenance', type: ActivityType.Playing }],
});
```

## Presence at startup

```js
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  presence: { status: 'online', activities: [{ name: '/help', type: ActivityType.Listening }] },
});
```

## Rotating statuses

```js
const statuses = [
  () => `${client.guilds.cache.size} servers`,
  () => '/help',
  () => `${client.guilds.cache.reduce((n, g) => n + g.memberCount, 0)} members`,
];
let i = 0;
setInterval(() => {
  client.user.setActivity(statuses[i++ % statuses.length](), { type: ActivityType.Watching });
}, 60_000);
```

Presence updates are rate limited by the gateway. Once a minute is plenty.

## Live data in the status

The Enhanced bot shows a game server's player count:

```js
const status = await fetchMinecraftStatus(address);
client.user.setActivity(status.online ? `${status.players}/${status.maxPlayers} players` : 'server offline', {
  type: ActivityType.Watching,
});
```

## Notes

- Bots can't use rich presence (images, buttons, party size). Those are for game integrations.
- Presence is lost on reconnect if you set it only once in `ready`. Setting it in the client options or on an interval avoids that.

## See also
- [Background Tasks](35-Background-Tasks.md) · [Use-Case Recipes → Game-server player count](../Use-Case-Recipes.md#game-server-player-count)
