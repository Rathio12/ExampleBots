# Client & Intents

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Getting_started-607D8B?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[JavaScript portal](README.md) › Getting started</sub>

| | |
|---|---|
| **Key classes** | `Client`, `GatewayIntentBits`, `Partials`, `Events` |
| **Used in** | [01-basic/index.js](../../javascript/01-basic/index.js) · [03-expert/src/index.js](../../javascript/03-expert/src/index.js) |

The `Client` is your bot's connection to Discord. It holds the gateway connection, the cache, and the event emitter.

## Creating a client

```js
import { Client, GatewayIntentBits, Partials } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,     // privileged
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,   // privileged
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
  allowedMentions: { parse: ['users'] },
});

await client.login(process.env.DISCORD_TOKEN);
```

### Client options

| Option | Purpose |
|---|---|
| `intents` | Which gateway events to receive (**required**) |
| `partials` | Receive events for uncached objects (see below) |
| `allowedMentions` | Default mention rules for every message ([article](16-Sending-Messages.md#mentions)) |
| `presence` | Initial status/activity ([article](32-Presence-and-Activity.md)) |
| `makeCache` | Tune or limit caches (`Options.cacheWithLimits(...)`) |
| `sweepers` | Periodically remove old cache entries |
| `rest` | REST options, e.g. `{ timeout: 15_000 }` |

## Intents

| `GatewayIntentBits.` | Privileged | Events |
|---|---|---|
| `Guilds` | | guilds, channels, roles, threads, **required for almost everything** |
| `GuildMembers` | ✅ | member add/update/remove, member lists |
| `GuildModeration` | | bans, audit log entries |
| `GuildExpressions` | | emojis, stickers, soundboard |
| `GuildIntegrations` | | integrations |
| `GuildWebhooks` | | webhook updates |
| `GuildInvites` | | invite create/delete |
| `GuildVoiceStates` | | voice state changes (**needed for voice**) |
| `GuildPresences` | ✅ | presence/status updates |
| `GuildMessages` | | messages in servers |
| `GuildMessageReactions` | | reactions in servers |
| `GuildMessageTyping` | | typing in servers |
| `DirectMessages` | | DMs |
| `DirectMessageReactions` / `DirectMessageTyping` | | DM reactions / typing |
| `MessageContent` | ✅ | message `content`, `embeds`, `attachments` |
| `GuildScheduledEvents` | | scheduled events |
| `AutoModerationConfiguration` / `AutoModerationExecution` | | AutoMod |
| `GuildMessagePolls` / `DirectMessagePolls` | | poll votes |

Privileged intents must also be enabled in the Developer Portal (Bot tab), or login fails with *"Used disallowed intents"*.

**Rule of thumb:** request only what you use. A slash-command-only bot needs just `Guilds`.

### Conditional intents

The Enhanced bot only requests a privileged intent when the feature that needs it is configured:

```js
const intents = [GatewayIntentBits.Guilds];
if (config.welcomeChannelId) intents.push(GatewayIntentBits.GuildMembers);
const client = new Client({ intents });
```

## Partials

discord.js normally drops events about objects it hasn't cached. Enabling a partial delivers them as **partial objects** that only know their ID:

| Partial | Lets you receive |
|---|---|
| `Partials.Message` | edits/deletes/reactions on messages sent before the bot started |
| `Partials.Channel` | DM events (DM channels are never cached up front) |
| `Partials.Reaction` | reactions on uncached messages |
| `Partials.GuildMember` | member remove/update for uncached members |
| `Partials.User` | user data for uncached users |

```js
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();                 // download the full object
    } catch {
      return;                                 // message was deleted
    }
  }
  console.log(`${user.tag} reacted ${reaction.emoji.name} on "${reaction.message.content}"`);
});
```

Always check `.partial` before reading other properties.

## Logging in and the ready event

```js
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! ${readyClient.user.tag} is in ${readyClient.guilds.cache.size} servers`);
});

await client.login(token);   // resolves once the token is accepted
```

`readyClient` is the same client, typed as "logged in": `readyClient.user` is never null.

## Useful client properties

| Property | Meaning |
|---|---|
| `client.user` | The bot's own user |
| `client.application` | The application (commands, owner, emojis) |
| `client.guilds.cache` | All servers the bot is in |
| `client.channels.cache` / `.fetch(id)` | Channels (cached / from the API) |
| `client.users.fetch(id)` | Any user by ID |
| `client.ws.ping` | Gateway heartbeat latency in ms (`-1` right after login) |
| `client.uptime` | Milliseconds since ready |
| `client.readyTimestamp` | When the client became ready |

## Shutting down cleanly

```js
async function shutdown() {
  await client.destroy();   // closes the gateway connection
  process.exit(0);
}
process.on('SIGINT', shutdown);    // Ctrl+C
process.on('SIGTERM', shutdown);   // docker stop, systemctl stop
```

## Common mistakes

- **Forgetting `Guilds`.** Without it, `guild.channels.cache` stays empty and many features break silently.
- **Reading `message.content` and getting `""`.** You need the `MessageContent` intent (and the portal switch).
- **Calling `client.user` before ready.** It's `null` until login completes. Use the ready event.

## See also
- [Events](28-Events.md) · [Configuration & .env](03-Configuration-and-Env.md)
- [Events & Intents](../Events-and-Intents.md) (all languages)
