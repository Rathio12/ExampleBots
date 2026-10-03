# Events

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[JavaScript portal](README.md) › Events</sub>

| | |
|---|---|
| **Key APIs** | `client.on`, `client.once`, `Events` enum |
| **Used in** | [02-enhanced/src/events/](../../javascript/02-enhanced/src/events) · [03-expert/src/events/](../../javascript/03-expert/src/events) |

The client is an `EventEmitter`. Every gateway event becomes a JavaScript event you can listen to.

## Listening

```js
import { Events } from 'discord.js';

client.once(Events.ClientReady, (c) => console.log(`Ready as ${c.user.tag}`));   // runs once
client.on(Events.GuildCreate, (guild) => console.log(`Joined ${guild.name}`));   // every time
client.off(Events.GuildCreate, handler);                                           // remove a listener
```

Always use the `Events` enum instead of strings: it catches typos and survives renames between versions.

## Event handler files

The Enhanced/Expert bots put each event in its own file:

```js
// src/events/guildCreate.js
import { Events } from 'discord.js';

export default {
  name: Events.GuildCreate,
  once: false,
  async execute(guild) {
    console.log(`Joined ${guild.name} (${guild.memberCount} members)`);
  },
};
```

```js
// src/index.js
for (const event of await loadModules(join(here, 'events'))) {
  const listener = (...args) => Promise.resolve(event.execute(...args)).catch((e) => console.error(event.name, e));
  if (event.once) client.once(event.name, listener);
  else client.on(event.name, listener);
}
```

The `.catch` matters: an error in an async listener would otherwise become an unhandled rejection.

## Event reference

| `Events.` | Arguments | Intent |
|---|---|---|
| `ClientReady` | `client` | — |
| `InteractionCreate` | `interaction` | — |
| `GuildCreate` / `GuildDelete` | `guild` | Guilds |
| `GuildUpdate` | `oldGuild, newGuild` | Guilds |
| `ChannelCreate` / `ChannelDelete` | `channel` | Guilds |
| `ChannelUpdate` | `old, new` | Guilds |
| `GuildRoleCreate` / `GuildRoleDelete` | `role` | Guilds |
| `GuildRoleUpdate` | `old, new` | Guilds |
| `ThreadCreate` | `thread, newlyCreated` | Guilds |
| `MessageCreate` | `message` | GuildMessages / DirectMessages |
| `MessageUpdate` | `old, new` | GuildMessages |
| `MessageDelete` | `message` | GuildMessages |
| `MessageBulkDelete` | `messages, channel` | GuildMessages |
| `MessageReactionAdd` / `Remove` | `reaction, user` | GuildMessageReactions |
| `GuildMemberAdd` / `GuildMemberRemove` | `member` | GuildMembers ✱ |
| `GuildMemberUpdate` | `old, new` | GuildMembers ✱ |
| `GuildBanAdd` / `GuildBanRemove` | `ban` | GuildModeration |
| `GuildAuditLogEntryCreate` | `entry, guild` | GuildModeration |
| `VoiceStateUpdate` | `oldState, newState` | GuildVoiceStates |
| `PresenceUpdate` | `old, new` | GuildPresences ✱ |
| `InviteCreate` / `InviteDelete` | `invite` | GuildInvites |
| `TypingStart` | `typing` | GuildMessageTyping |
| `GuildScheduledEventCreate` … | `event` | GuildScheduledEvents |
| `AutoModerationActionExecution` | `execution` | AutoModerationExecution |
| `MessagePollVoteAdd` / `Remove` | `answer, userId` | GuildMessagePolls |
| `Error` / `Warn` / `Debug` | `info` | — |

✱ privileged intent.

## Debugging connection issues

```js
client.on(Events.Debug, (info) => console.log('[debug]', info));   // very verbose
client.on(Events.Warn, (info) => console.warn(info));
client.on(Events.Error, (error) => console.error(error));
client.on(Events.ShardDisconnect, (event, id) => console.warn(`Shard ${id} disconnected`, event.code));
```

## Raw gateway events

For anything discord.js doesn't expose yet:

```js
client.on(Events.Raw, (packet) => {
  if (packet.t === 'SOME_NEW_EVENT') console.log(packet.d);
});
```

## Common mistakes

- **Listener never fires:** missing intent, or you registered it after the event already happened (attach `ClientReady` before `login`).
- **Duplicate responses:** the same listener registered twice (for example in a loop or on every reconnect).
- **Crashes from async listeners:** always catch errors inside listeners.

## See also
- [Message Events](29-Message-Events.md) · [Member Events](30-Member-Events.md) · [Client & Intents](02-Client-and-Intents.md)
