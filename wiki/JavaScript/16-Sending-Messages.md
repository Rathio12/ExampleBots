# Sending Messages

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[JavaScript portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key methods** | `channel.send`, `message.reply`, `user.send`, formatters (`bold`, `codeBlock`, `time`…) |
| **Limits** | 2,000 characters of content, 10 embeds, 10 files |

## Sending to a channel

```js
const channel = await client.channels.fetch('123456789012345678');   // or guild.channels.cache.get(id)
if (!channel?.isTextBased()) return;

await channel.send('Hello!');
await channel.send({
  content: 'With extras',
  embeds: [embed],
  components: [row],
  files: ['./image.png'],
  allowedMentions: { parse: [] },
});
```

`isTextBased()` covers text, announcement, voice-chat, thread and DM channels. `isSendable()` (newer versions) also checks you can send there.

## Replying to a message

```js
await message.reply('Got it!');                                             // pings the author
await message.reply({ content: 'Got it!', allowedMentions: { repliedUser: false } });   // no ping
```

## Direct messages

```js
try {
  await user.send('Hi from the bot!');
} catch {
  // DMs closed, or no shared server. Always handle this.
}
```

## Mentions

| Mention | Code |
|---|---|
| User | `${user}` or `<@${user.id}>` |
| Role | `${role}` or `<@&${role.id}>` |
| Channel | `${channel}` or `<#${channel.id}>` |
| Slash command | `</ping:${commandId}>` |
| Custom emoji | `${emoji}` or `<:name:id>` |

Templates call `toString()`, so `${user}` becomes a mention automatically.

### allowedMentions

Controls who actually gets **pinged**:

```js
allowedMentions: { parse: [] }                       // nobody
allowedMentions: { parse: ['users'] }                // users only, never @everyone/roles
allowedMentions: { users: ['123'], roles: [] }       // exactly these
allowedMentions: { repliedUser: false }              // don't ping the replied-to author
```

Set a safe default on the client (`new Client({ allowedMentions: { parse: ['users'] } })`) and **always** use `parse: []` when the content comes from users.

## Formatting helpers

```js
import { bold, italic, underline, strikethrough, spoiler, quote, blockQuote, inlineCode, codeBlock,
  hyperlink, hideLinkEmbed, heading, HeadingLevel, unorderedList, time, TimestampStyles, userMention, channelMention } from 'discord.js';

bold('important')                         // **important**
codeBlock('js', 'console.log(1)')         // ```js …```
hyperlink('docs', 'https://discord.js.org')
hideLinkEmbed('https://example.com')      // <https://…> (no preview)
heading('Title', HeadingLevel.Two)        // ## Title
unorderedList(['a', 'b'])                 // - a\n- b
time(new Date(), TimestampStyles.RelativeTime)   // <t:…:R>
```

## Escaping user input

```js
import { escapeMarkdown } from 'discord.js';
await channel.send(`Nickname: ${escapeMarkdown(member.displayName)}`);   // **bold** names stay literal
```

## Silent messages and other flags

```js
import { MessageFlags } from 'discord.js';
await channel.send({ content: 'Shh', flags: MessageFlags.SuppressNotifications });   // no push notification
await channel.send({ content: 'https://example.com', flags: MessageFlags.SuppressEmbeds });   // no link preview
```

## Splitting long text

```js
function chunk(text, size = 2000) {
  const parts = [];
  for (let i = 0; i < text.length; i += size) parts.push(text.slice(i, i + size));
  return parts;
}
for (const part of chunk(longText)) await channel.send(part);
```

For logs or code, sending a `.txt` file is usually nicer ([Files](19-Files-and-Attachments.md)).

## Typing indicator

```js
await channel.sendTyping();   // shows "Bot is typing…" for ~10 s
```

## Common errors

| Error | Cause |
|---|---|
| `Missing Access` (50001) | Bot can't see the channel |
| `Missing Permissions` (50013) | No Send Messages / Embed Links / Attach Files |
| `Cannot send messages to this user` (50007) | DMs closed |
| `Invalid Form Body … content: Must be 2000 or fewer` | Content too long |

## See also
- [Embeds](11-Embeds.md) · [Editing, Deleting & Pinning](17-Editing-Deleting-Pinning.md) · [Embeds & Messages](../Embeds-and-Messages.md)
