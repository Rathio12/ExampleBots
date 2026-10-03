# Message Events

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Events</sub>

| | |
|---|---|
| **Events** | `MessageCreate`, `MessageUpdate`, `MessageDelete`, `MessageBulkDelete` |
| **Intents** | `GuildMessages`, `MessageContent` (privileged) for content, `DirectMessages` for DMs |
| **Used in** | [03-expert messageCreate.js](../../javascript/03-expert/src/events/messageCreate.js) · [audit/](../../javascript/03-expert/src/events/audit) |

## New messages

```js
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;              // ignore bots (including yourself)
  if (!message.inGuild()) return;              // ignore DMs (or handle them separately)

  if (message.content.toLowerCase() === 'hello') {
    await message.reply('Hi there!');
  }
});
```

Without `MessageContent`, `message.content` is an empty string except for messages that mention the bot, DMs, and the bot's own messages.

## Useful message properties

| Property | Meaning |
|---|---|
| `content` | Text (needs MessageContent) |
| `author` / `member` | Who sent it |
| `channel` / `guild` | Where |
| `mentions.users` / `.roles` / `.everyone` | What it mentions |
| `mentions.has(client.user)` | Does it mention the bot? |
| `attachments`, `embeds`, `stickers` | Media |
| `reference` | The message it replies to (`await message.fetchReference()`) |
| `createdAt`, `editedAt` | Timestamps |
| `url` | Jump link |
| `type` | Default, reply, pin notice, member join notice… |
| `webhookId` | Set if sent by a webhook |

## Prefix commands

Slash commands are recommended, but prefix commands still work:

```js
const PREFIX = '!';

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;
  const [command, ...args] = message.content.slice(PREFIX.length).trim().split(/\s+/);

  switch (command.toLowerCase()) {
    case 'ping': return message.reply('Pong!');
    case 'say': return message.channel.send({ content: args.join(' ') || '…', allowedMentions: { parse: [] } });
  }
});
```

## Responding when mentioned

```js
if (message.mentions.has(client.user, { ignoreEveryone: true, ignoreRoles: true })) {
  await message.reply('You called? Try `/help`.');
}
```

## Edits

```js
client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  if (newMessage.partial) newMessage = await newMessage.fetch().catch(() => null);
  if (!newMessage || newMessage.author.bot) return;
  if (!newMessage.editedTimestamp) return;                       // link previews also trigger updates
  if (!oldMessage.partial && oldMessage.content === newMessage.content) return;
  console.log(`Edited: "${oldMessage.content}" → "${newMessage.content}"`);
});
```

## Deletes

```js
client.on(Events.MessageDelete, (message) => {
  if (message.partial) return console.log(`Uncached message ${message.id} deleted`);   // content unknown
  console.log(`${message.author.tag} deleted: ${message.content}`);
});

client.on(Events.MessageBulkDelete, (messages, channel) => {
  console.log(`${messages.size} messages bulk-deleted in #${channel.name}`);
});
```

Enable `Partials.Message` to receive edit/delete events for messages sent before the bot started. Their content is unavailable either way. See [Audit Log System](../Audit-Log-System.md).

## XP for chatting (from the expert bot)

```js
client.on(Events.MessageCreate, async (message) => {
  if (!message.inGuild() || message.author.bot) return;
  const newLevel = leveling.handleMessage(message.guildId, message.author.id);   // cooldown + DB inside
  if (newLevel !== null) await message.channel.send(`🎉 ${message.author} reached level ${newLevel}!`);
});
```

XP counting doesn't need `MessageContent`: the event still fires, only the text is empty.

## Awaiting a reply from the user

```js
await interaction.reply('What is your favourite colour? (30 s)');
const collected = await interaction.channel.awaitMessages({
  filter: (m) => m.author.id === interaction.user.id,
  max: 1,
  time: 30_000,
});
const answer = collected.first()?.content ?? 'no answer';
```

A modal is usually a better UX ([Modals](14-Modals.md)).

## See also
- [Events](28-Events.md) · [Sending Messages](16-Sending-Messages.md) · [Events & Intents](../Events-and-Intents.md)
