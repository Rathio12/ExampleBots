# Responding to Interactions

<sub>[JavaScript portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key methods** | `reply`, `deferReply`, `editReply`, `followUp`, `deleteReply`, `fetchReply`, `update`, `deferUpdate`, `showModal` |
| **Time limits** | First response within **3 s**. Edits and follow-ups for **15 min**. |

Every interaction must be acknowledged within 3 seconds, exactly once. This article explains every way to do that.

## The decision tree

```
Do you have the answer immediately?
├── yes → reply()
└── no (DB/HTTP/AI call) → deferReply() … then editReply()

Is it a button/select that should change its own message?
├── yes, immediately → update()
└── yes, but slow → deferUpdate() … then editReply()

Do you need input from the user? → showModal()   (must be the first response)
```

## reply

```js
await interaction.reply('Hello!');
await interaction.reply({ content: 'Hello!', embeds: [embed], components: [row], files: [file] });
```

## Ephemeral (only the user sees it)

```js
import { MessageFlags } from 'discord.js';

await interaction.reply({ content: 'Only you can see this.', flags: MessageFlags.Ephemeral });
```

Ephemeral messages can't be seen by others, can't be reacted to, and disappear when the client reloads. Use them for errors, confirmations and personal data.

> Older code uses `ephemeral: true`. It's deprecated in recent discord.js 14 versions in favour of `flags: MessageFlags.Ephemeral`.

## defer + editReply

```js
await interaction.deferReply();                                  // shows "Bot is thinking…"
const data = await fetchSlowThing();                             // up to 15 minutes
await interaction.editReply(`Result: ${data}`);

// Ephemeral thinking state: decided at defer time
await interaction.deferReply({ flags: MessageFlags.Ephemeral });
```

You can't change ephemeral ↔ public after deferring.

## followUp

Additional messages after the first response:

```js
await interaction.reply('Starting…');
await interaction.followUp('Step 1 done');
await interaction.followUp({ content: 'Secret step', flags: MessageFlags.Ephemeral });
```

## Getting the reply message

```js
// discord.js 14.17+
const response = await interaction.reply({ content: 'Vote!', components: [row], withResponse: true });
const message = response.resource.message;

// any v14 version
await interaction.reply('Vote!');
const message2 = await interaction.fetchReply();
```

## Editing and deleting

```js
await interaction.editReply({ content: 'Updated', components: [] });   // remove buttons
await interaction.deleteReply();
await interaction.editReply({ content: 'Done', embeds: [] });
```

## Component interactions: update / deferUpdate

For buttons and select menus:

```js
// Change the message the button is on
await interaction.update({ content: 'You clicked!', components: [] });

// Acknowledge now, edit later (no "thinking" indicator)
await interaction.deferUpdate();
await doWork();
await interaction.editReply({ content: 'Finished' });

// Or reply with a new (often ephemeral) message instead of editing
await interaction.reply({ content: 'Thanks for voting!', flags: MessageFlags.Ephemeral });
```

## Modals

```js
await interaction.showModal(modal);   // must be the FIRST response, can't come after defer/reply
```

See [Modals](14-Modals.md).

## State checks

| Property | True when |
|---|---|
| `interaction.replied` | `reply()` or `update()` was called |
| `interaction.deferred` | `deferReply()` or `deferUpdate()` was called |

The safe "send an error no matter what" helper used in every example:

```js
async function safeError(interaction, content) {
  const payload = { content, flags: MessageFlags.Ephemeral };
  if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
  else await interaction.reply(payload);
}
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Unknown interaction` (10062) | Responded after 3 seconds | Defer first |
| `Interaction has already been acknowledged` (40060) | Responded twice | Use `editReply`/`followUp` after the first response |
| `The reply to this interaction has not been sent or deferred` | `editReply` before `reply`/`defer` | Defer first |
| "The application did not respond" | Handler crashed or never responded | Check logs; every path must respond |

## See also
- [Slash Commands](04-Slash-Commands.md) · [Buttons](12-Buttons.md) · [Error Handling](34-Error-Handling.md)
