# Polls

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key APIs** | `poll` message option, `Poll`, `PollAnswer`, `Events.MessagePollVoteAdd` |
| **Intents** | `GuildMessagePolls` (vote events) |

Discord has **native polls**: the voting UI, results and timer are all handled by Discord. The Enhanced bot's `/poll` builds a custom button poll instead (to teach buttons). Native polls are simpler when you only need voting.

## Creating a poll

```js
import { PollLayoutType } from 'discord.js';

await interaction.reply({
  poll: {
    question: { text: 'What should we play tonight?' },
    answers: [
      { text: 'Minecraft', emoji: '⛏️' },
      { text: 'Valorant', emoji: '🔫' },
      { text: 'Among Us', emoji: '🚀' },
    ],
    duration: 24,                 // hours (1 to 768 = 32 days)
    allowMultiselect: false,
    layoutType: PollLayoutType.Default,
  },
});
```

| Field | Limit |
|---|---|
| Question | 300 characters |
| Answers | up to 10, each 55 characters |
| Duration | 1–768 hours |

## Reading results

```js
const message = await channel.messages.fetch(messageId);
const poll = message.poll;
for (const answer of poll.answers.values()) {
  console.log(answer.text, answer.voteCount);
}
console.log('Finished:', poll.resultsFinalized);
```

Fetch who voted for an answer:

```js
const voters = await poll.answers.get(1).voters.fetch();   // answer IDs start at 1
```

## Ending early

```js
await message.poll.end();   // only the bot that created the poll
```

## Vote events

```js
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessagePolls],
});

client.on(Events.MessagePollVoteAdd, (pollAnswer, userId) => {
  console.log(`${userId} voted for "${pollAnswer.text}"`);
});
client.on(Events.MessagePollVoteRemove, (pollAnswer, userId) => { /* … */ });
```

## Native polls vs button polls

| | Native poll | Button poll (Enhanced bot) |
|---|---|---|
| Setup | One `poll` object | Embed + buttons + state |
| Survives restarts | ✅ Discord stores it | Only with a database |
| Custom logic (weighted votes, role-only voting) | ❌ | ✅ |
| Live results visible | Discord UI | Your embed |

## See also
- [Buttons](12-Buttons.md) · [Sending Messages](16-Sending-Messages.md)
