# Channels

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Server-FF9F0A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key classes** | `GuildChannelManager`, `TextChannel`, `VoiceChannel`, `CategoryChannel`, `ChannelType` |
| **Permission** | Manage Channels |
| **Used in** | [02-enhanced statusUpdater.js](../../javascript/02-enhanced/src/services/statusUpdater.js) (rename) |

## Getting channels

```js
const channel = guild.channels.cache.get(id);
const fetched = await client.channels.fetch(id);                       // works across all guilds
const byName = guild.channels.cache.find((c) => c.name === 'general');
const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText);
```

Type guards: `channel.isTextBased()`, `isVoiceBased()`, `isThread()`, `isDMBased()`, `channel.type === ChannelType.GuildCategory`.

## Channel types

| `ChannelType.` | Kind |
|---|---|
| `GuildText` | Text channel |
| `GuildVoice` | Voice channel (also has a text chat) |
| `GuildCategory` | Category |
| `GuildAnnouncement` | Announcement channel |
| `GuildStageVoice` | Stage |
| `GuildForum` / `GuildMedia` | Forum / media channel |
| `PublicThread` / `PrivateThread` / `AnnouncementThread` | Threads |
| `DM` / `GroupDM` | Direct messages |

## Creating channels

```js
const category = await guild.channels.create({ name: 'Support', type: ChannelType.GuildCategory });

const text = await guild.channels.create({
  name: 'help-desk',
  type: ChannelType.GuildText,
  parent: category.id,
  topic: 'Ask for help here',
  rateLimitPerUser: 10,                     // slowmode seconds
  permissionOverwrites: [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] },
    { id: staffRoleId, allow: [PermissionFlagsBits.SendMessages] },
  ],
  reason: 'Support system setup',
});

const voice = await guild.channels.create({
  name: 'Lounge',
  type: ChannelType.GuildVoice,
  parent: category.id,
  userLimit: 10,
  bitrate: 64_000,
});
```

## Editing

```js
await channel.setName('new-name');          // ⚠ 2 renames / 10 minutes per channel
await channel.setTopic('New topic');        // same rate limit
await channel.setParent(categoryId, { lockPermissions: true });
await channel.setPosition(0);
await channel.setNSFW(true);
await channel.setRateLimitPerUser(5);
await channel.edit({ name: 'x', topic: 'y', userLimit: 5 });
```

## Deleting and cloning

```js
await channel.delete('Cleanup');
const copy = await channel.clone({ name: 'general-new' });   // same settings/permissions, no messages
```

## Status channel pattern

From the Enhanced bot: rename only when the text changes, to respect the rate limit.

```js
let lastName = null;
async function updateStatusChannel(channel, players, max) {
  const name = `🟢 Players: ${players}/${max}`;
  if (name === lastName) return;
  await channel.setName(name, 'Player count update');
  lastName = name;
}
```

## Channel events

```js
client.on(Events.ChannelCreate, (channel) => {});
client.on(Events.ChannelUpdate, (oldChannel, newChannel) => {});
client.on(Events.ChannelDelete, (channel) => {});
client.on(Events.ChannelPinsUpdate, (channel, time) => {});
```

## See also
- [Permissions](26-Permissions.md) · [Threads & Forums](20-Threads-and-Forums.md) · [Voice](31-Voice.md)
