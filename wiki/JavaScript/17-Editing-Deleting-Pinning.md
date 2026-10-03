# Editing, Deleting & Pinning

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[JavaScript portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key methods** | `messages.fetch`, `message.edit`, `message.delete`, `channel.bulkDelete`, `message.pin` |
| **Used in** | [03-expert purge.js](../../javascript/03-expert/src/commands/moderation/purge.js) |

## Fetching messages

```js
const message = await channel.messages.fetch('123456789012345678');   // one message
const recent = await channel.messages.fetch({ limit: 50 });           // Collection, max 100
const before = await channel.messages.fetch({ before: message.id, limit: 10 });
const cached = channel.messages.cache.get(id);                        // no API call; may be undefined
```

Fetching older history needs **Read Message History**.

## Editing

You can only edit **your bot's own** messages:

```js
await message.edit('New content');
await message.edit({ content: null, embeds: [newEmbed], components: [] });   // remove content and buttons
await message.edit({ attachments: [] });                                      // remove files
```

## Deleting

```js
await message.delete();                                    // own messages, or others' with Manage Messages
setTimeout(() => sent.delete().catch(() => {}), 10_000);   // self-destruct after 10 s
```

## Bulk delete

```js
const deleted = await channel.bulkDelete(100, true);   // number or Collection/array of messages
// second argument `true` = skip messages older than 14 days instead of throwing
```

- 2–100 messages per call, all younger than 14 days.
- Needs **Manage Messages**.
- Filter first to delete only one user's messages:

```js
const messages = await channel.messages.fetch({ limit: 100 });
await channel.bulkDelete(messages.filter((m) => m.author.id === user.id), true);
```

## Pinning

```js
await message.pin('Important');   // needs Manage Messages (or Pin Messages)
await message.unpin();
const pins = await channel.messages.fetchPinned();
```

## Crossposting (announcement channels)

```js
if (message.channel.type === ChannelType.GuildAnnouncement) await message.crosspost();
```

## Suppressing embeds on someone's message

```js
await message.suppressEmbeds(true);   // hides link previews (Manage Messages)
```

## Handling missing messages

```js
import { RESTJSONErrorCodes } from 'discord.js';

try {
  await message.delete();
} catch (error) {
  if (error.code !== RESTJSONErrorCodes.UnknownMessage) throw error;   // already deleted: fine
}
```

## See also
- [Sending Messages](16-Sending-Messages.md) · [Moderation](25-Moderation.md) · [Message Events](29-Message-Events.md)
