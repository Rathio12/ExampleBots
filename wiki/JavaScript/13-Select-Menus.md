# Select Menus

<sub>[JavaScript portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `StringSelectMenuBuilder`, `UserSelectMenuBuilder`, `RoleSelectMenuBuilder`, `ChannelSelectMenuBuilder`, `MentionableSelectMenuBuilder` |
| **Limits** | 25 options, 1 select per action row |
| **Used in** | [02-enhanced trivia](../../javascript/02-enhanced/src/commands/trivia.js) |

Select menus are dropdowns. Five kinds exist: one where you define the options, and four that Discord fills automatically.

## String select

```js
import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

const menu = new StringSelectMenuBuilder()
  .setCustomId('pick-color')
  .setPlaceholder('Choose a colour…')
  .setMinValues(1)
  .setMaxValues(1)
  .addOptions(
    new StringSelectMenuOptionBuilder().setLabel('Red').setValue('red').setEmoji('🟥').setDescription('Warm'),
    new StringSelectMenuOptionBuilder().setLabel('Blue').setValue('blue').setEmoji('🟦').setDefault(true),
    { label: 'Green', value: 'green', emoji: '🟩' },   // plain objects work too
  );

await interaction.reply({ content: 'Pick one:', components: [new ActionRowBuilder().addComponents(menu)] });
```

| Option field | Limit |
|---|---|
| `label` | 100 chars, required |
| `value` | 100 chars, required, unique |
| `description` | 100 chars |
| `emoji` | unicode or `{ id, name }` |
| `default` | pre-selected |

## Auto-populated selects

```js
import { UserSelectMenuBuilder, RoleSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType } from 'discord.js';

new UserSelectMenuBuilder().setCustomId('pick-users').setMaxValues(5);
new RoleSelectMenuBuilder().setCustomId('pick-roles').setPlaceholder('Roles');
new ChannelSelectMenuBuilder().setCustomId('pick-channel').addChannelTypes(ChannelType.GuildText);
new MentionableSelectMenuBuilder().setCustomId('pick-any');

// Pre-select values
new UserSelectMenuBuilder().setCustomId('x').setDefaultUsers(interaction.user.id);
```

## Handling a selection

```js
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'pick-color') {
    const [color] = interaction.values;               // array of selected values
    await interaction.update({ content: `You picked **${color}**`, components: [] });
  }

  if (interaction.isUserSelectMenu() && interaction.customId === 'pick-users') {
    const users = interaction.users;                  // Collection<id, User>
    const members = interaction.members;              // Collection<id, GuildMember>
    await interaction.reply({ content: `Selected: ${users.map((u) => u.toString()).join(', ')}`, flags: MessageFlags.Ephemeral });
  }

  if (interaction.isRoleSelectMenu()) { const roles = interaction.roles; }
  if (interaction.isChannelSelectMenu()) { const channels = interaction.channels; }
});
```

`interaction.isAnySelectMenu()` matches all five types.

## Multi-select

```js
new StringSelectMenuBuilder().setCustomId('toppings').setMinValues(0).setMaxValues(3).addOptions(/* … */);
// interaction.values → ['cheese', 'mushroom'] or [] if min is 0
```

## Encoding context in the custom ID

The Enhanced trivia command stores which question was asked:

```js
.setCustomId(`trivia:${questionIndex}`)

// handler
const [, questionIndex] = interaction.customId.split(':');
const correct = TRIVIA_QUESTIONS[Number(questionIndex)].correct === Number(interaction.values[0]);
```

## Self-assignable roles

See [Use-Case Recipes → Self-assignable roles](../Use-Case-Recipes.md#self-assignable-roles) for a complete, restart-safe role picker.

## Selects in modals

Recent discord.js versions allow select menus inside modals using `LabelBuilder`. See [Modals](14-Modals.md#labels-and-selects-in-modals).

## Common mistakes

| Problem | Fix |
|---|---|
| Select plus buttons in the same row | A select takes the whole row. Put buttons in another row. |
| Duplicate option `value`s | Values must be unique |
| More than 25 options | Paginate, or use [autocomplete](08-Autocomplete.md) instead |
| Menu still shows the old selection after update | Rebuild it with `setDefault` on the chosen option |

## See also
- [Buttons](12-Buttons.md) · [Modals](14-Modals.md) · [Roles](24-Roles.md)
