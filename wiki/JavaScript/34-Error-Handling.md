# Error Handling

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key classes** | `DiscordAPIError`, `RESTJSONErrorCodes` |
| **Used in** | [02-enhanced interactionCreate.js](../../javascript/02-enhanced/src/events/interactionCreate.js) · [03-expert index.js](../../javascript/03-expert/src/index.js) |

A bot runs for weeks, so one unhandled error must never take it down, and users should always get an answer.

## 1. Catch errors in every handler

```js
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    await routeInteraction(interaction);
  } catch (error) {
    console.error(`Interaction ${interaction.commandName ?? interaction.customId} failed`, error);
    const payload = { content: '⚠️ Something went wrong.', flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
});
```

The `.catch(() => {})` on the error reply matters: if the interaction already expired, sending the error would throw again.

## 2. Safety nets

```js
process.on('unhandledRejection', (error) => console.error('Unhandled rejection', error));
process.on('uncaughtException', (error) => console.error('Uncaught exception', error));
client.on(Events.Error, (error) => console.error('Client error', error));
client.on(Events.ShardError, (error, shardId) => console.error(`Shard ${shardId} error`, error));
```

These log the problem instead of letting Node crash. Fix the root cause when you see one.

## 3. Handle specific API errors

```js
import { DiscordAPIError, RESTJSONErrorCodes } from 'discord.js';

try {
  await member.send('Hello');
} catch (error) {
  if (error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser) {
    // DMs closed: expected, ignore
  } else {
    throw error;
  }
}
```

### Common error codes

| `RESTJSONErrorCodes.` | Code | Meaning |
|---|---|---|
| `UnknownChannel` | 10003 | Channel deleted / wrong ID |
| `UnknownMessage` | 10008 | Message deleted |
| `UnknownMember` | 10007 | Not in the server |
| `UnknownInteraction` | 10062 | Responded too late (> 3 s) |
| `MissingAccess` | 50001 | Can't see the channel |
| `MissingPermissions` | 50013 | Missing a permission or role too low |
| `CannotSendMessagesToThisUser` | 50007 | DMs closed |
| `InvalidFormBodyOrContentType` | 50035 | Invalid payload (limits!) |
| `InteractionHasAlreadyBeenAcknowledged` | 40060 | Responded twice |

`error.status` holds the HTTP status (403, 404, 429…), `error.rawError` the full response, and `error.requestBody` what you sent (very helpful for 50035).

## 4. Expected failures aren't errors

Check first instead of catching:

```js
if (!member.kickable) return interaction.reply('I cannot kick that member.');
if (!channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
```

## 5. Validate input early

```js
const seconds = parseDuration(interaction.options.getString('duration', true));
if (!seconds) return interaction.reply({ content: 'Use a duration like `10m` or `2h`.', flags: MessageFlags.Ephemeral });
```

## 6. Rate limits

discord.js queues requests and waits automatically. Watch them while debugging:

```js
client.rest.on('rateLimited', (info) => console.warn('Rate limited', info.route, info.timeToReset));
```

## 7. Never crash on startup config

Validate config before login and exit with a clear message ([Configuration](03-Configuration-and-Env.md)).

## See also
- [Responding to Interactions](10-Responding-to-Interactions.md) · [Logging](39-Logging.md) · [Troubleshooting](../Troubleshooting-and-FAQ.md)
