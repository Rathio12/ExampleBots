# Reactions

<sub>[JavaScript portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key APIs** | `message.react`, `MessageReaction`, `reaction.users`, `Events.MessageReactionAdd` |
| **Intents** | `GuildMessageReactions` (events); `Partials.Message`, `Partials.Reaction` for old messages |

## Adding reactions

```js
await message.react('👍');                     // unicode emoji
await message.react('<:pepe:123456789>');      // custom emoji string
await message.react(guild.emojis.cache.get('123456789'));

// In order (each call waits for the previous)
for (const emoji of ['1️⃣', '2️⃣', '3️⃣']) await message.react(emoji);
```

## Reading reactions

```js
const reaction = message.reactions.cache.get('👍');      // keyed by emoji name or ID
console.log(reaction?.count);
const users = await reaction.users.fetch();               // Collection of Users (max 100 per call)
const didReact = users.has(someUser.id);
```

## Removing reactions

```js
await reaction.users.remove(userId);       // one user's reaction (Manage Messages for others)
await reaction.remove();                   // all reactions of this emoji
await message.reactions.removeAll();       // everything
```

## Reaction events

```js
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }
  console.log(`${user.tag} reacted ${reaction.emoji.name} (${reaction.count} total)`);
});

client.on(Events.MessageReactionRemove, async (reaction, user) => { /* … */ });
```

Without the partials, reactions on messages sent before the bot started are ignored.

## Collectors

```js
const message = await channel.send('React with ✅ within 30 seconds!');
await message.react('✅');

const collected = await message.awaitReactions({
  filter: (reaction, user) => reaction.emoji.name === '✅' && !user.bot,
  max: 10,
  time: 30_000,
});
console.log(`${collected.get('✅')?.count ?? 0} people reacted`);
```

## Reaction roles (classic)

```js
const ROLE_BY_EMOJI = { '🎮': '111111111111111111', '🎨': '222222222222222222' };

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (reaction.partial) await reaction.fetch();
  if (reaction.message.id !== ROLE_MESSAGE_ID || user.bot) return;
  const roleId = ROLE_BY_EMOJI[reaction.emoji.name];
  if (!roleId) return;
  const member = await reaction.message.guild.members.fetch(user.id);
  await member.roles.add(roleId);
});
// mirror with MessageReactionRemove → roles.remove
```

Buttons or role select menus are usually a better UX for new bots ([recipe](../Use-Case-Recipes.md#self-assignable-roles)).

## See also
- [Use-Case Recipes → Starboard](../Use-Case-Recipes.md#starboard) · [Events](28-Events.md)
