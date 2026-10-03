# Modals

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Components-AF52DE?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `ModalBuilder`, `TextInputBuilder`, `TextInputStyle`, `LabelBuilder`, `ModalSubmitInteraction` |
| **Limits** | Title 45 chars, 5 components, input value up to 4,000 chars |
| **Used in** | [02-enhanced/src/commands/feedback.js](../../javascript/02-enhanced/src/commands/feedback.js) · [components/feedback.js](../../javascript/02-enhanced/src/components/feedback.js) |

A modal is a pop-up form. You can show one in response to a slash command, context menu, button or select menu, but not to another modal.

## Showing a modal

```js
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

const modal = new ModalBuilder().setCustomId('feedback').setTitle('Send feedback');

const subject = new TextInputBuilder()
  .setCustomId('subject')
  .setLabel('Subject')
  .setStyle(TextInputStyle.Short)         // single line
  .setMaxLength(100)
  .setRequired(true);

const message = new TextInputBuilder()
  .setCustomId('message')
  .setLabel('Your feedback')
  .setStyle(TextInputStyle.Paragraph)     // multi-line
  .setPlaceholder('What do you like? What could be better?')
  .setMinLength(10)
  .setMaxLength(1000)
  .setValue('');                          // pre-filled text (optional)

modal.addComponents(
  new ActionRowBuilder().addComponents(subject),   // one input per row
  new ActionRowBuilder().addComponents(message),
);

await interaction.showModal(modal);   // must be the first response
```

## Handling the submission

```js
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit() || interaction.customId !== 'feedback') return;

  const subject = interaction.fields.getTextInputValue('subject');
  const message = interaction.fields.getTextInputValue('message');

  await interaction.reply({ content: `Thanks! We got: **${subject}**`, flags: MessageFlags.Ephemeral });
});
```

If the modal was opened from a button, `interaction.isFromMessage()` is true and you can `interaction.update(...)` the original message.

## Waiting for the submission inside a command

```js
await interaction.showModal(modal);
try {
  const submitted = await interaction.awaitModalSubmit({
    time: 5 * 60_000,
    filter: (i) => i.customId === 'feedback' && i.user.id === interaction.user.id,
  });
  await submitted.reply({ content: 'Received!', flags: MessageFlags.Ephemeral });
} catch {
  // user closed the modal or the time ran out: nothing to do
}
```

Prefer a global handler for anything important. `awaitModalSubmit` is lost if the bot restarts.

## Labels and selects in modals

Discord's newer modal format wraps each field in a **label** component, which can hold a text input **or a select menu** (and more in newer API versions). discord.js 14.21+ supports it:

```js
import { LabelBuilder, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

const modal = new ModalBuilder()
  .setCustomId('report')
  .setTitle('Report a problem')
  .addLabelComponents(
    new LabelBuilder()
      .setLabel('Category')
      .setDescription('What kind of problem?')
      .setStringSelectMenuComponent(
        new StringSelectMenuBuilder().setCustomId('category').addOptions(
          { label: 'Bug', value: 'bug' },
          { label: 'Abuse', value: 'abuse' },
        ),
      ),
    new LabelBuilder()
      .setLabel('Details')
      .setTextInputComponent(new TextInputBuilder().setCustomId('details').setStyle(TextInputStyle.Paragraph)),
  );

// on submit
const category = interaction.fields.getStringSelectValues('category');   // string[]
const details = interaction.fields.getTextInputValue('details');
```

When using labels, set the label text on the `LabelBuilder`, not on the `TextInputBuilder`. The classic action-row format above still works everywhere.

## Pre-filling a modal

```js
const tag = repos.tags.get(guildId, name);
const content = new TextInputBuilder().setCustomId('content').setLabel('Content')
  .setStyle(TextInputStyle.Paragraph).setValue(tag.content);   // "edit" forms
```

## Passing context

Like buttons, encode IDs in the modal's custom ID:

```js
new ModalBuilder().setCustomId(`edit-tag:${tag.name}`).setTitle('Edit tag');
// on submit: const [, tagName] = interaction.customId.split(':');
```

## Rules

- You can't `deferReply()` before `showModal()`.
- You can't show a modal from a modal submit.
- Max 5 top-level components.
- Text inputs can't be validated beyond required/min/max. Check the content yourself on submit.

## See also
- [Buttons](12-Buttons.md) · [Select Menus](13-Select-Menus.md) · [Context Menus](09-Context-Menus.md)
