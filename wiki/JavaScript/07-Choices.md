# Choices

<sub>[JavaScript portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key method** | `addChoices()` on string, integer and number options |
| **Used in** | [03-expert/src/commands/moderation/ban.js](../../javascript/03-expert/src/commands/moderation/ban.js) (`delete_messages`) |

Choices turn an option into a fixed dropdown. The user can only pick one of your values, so you never need to validate it.

## Example

```js
new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Ban a user')
  .addUserOption((o) => o.setName('user').setDescription('Who').setRequired(true))
  .addIntegerOption((o) =>
    o
      .setName('delete_messages')
      .setDescription('Delete their recent messages')
      .addChoices(
        { name: "Don't delete any", value: 0 },
        { name: 'Previous hour', value: 3600 },
        { name: 'Previous 24 hours', value: 86_400 },
        { name: 'Previous 7 days', value: 604_800 },
      ));

// Handler: you receive the value, not the name
const seconds = interaction.options.getInteger('delete_messages') ?? 0;
```

String choices:

```js
.addStringOption((o) =>
  o.setName('category').setDescription('Pick one').setRequired(true).addChoices(
    { name: '🐶 Dogs', value: 'dogs' },
    { name: '🐱 Cats', value: 'cats' },
    { name: '🦜 Birds', value: 'birds' },
  ))
```

## Localised choice names

```js
.addChoices({ name: 'Dogs', name_localizations: { de: 'Hunde', fr: 'Chiens' }, value: 'dogs' })
```

## Choices vs autocomplete

| | Choices | Autocomplete |
|---|---|---|
| Values | Fixed at registration | Computed live |
| Max | 25 | 25 shown at a time, unlimited total |
| Validation | Discord enforces it | **You** must validate (users can type anything) |
| Changing values | Re-register commands | Instant |
| Use for | Small static lists | Database records, search results |

You can't use `addChoices` and `setAutocomplete(true)` on the same option.

## Building choices from data

```js
const LANGUAGES = { en: 'English', de: 'Deutsch', fr: 'Français' };

.addStringOption((o) =>
  o.setName('language').setDescription('Language')
    .addChoices(...Object.entries(LANGUAGES).map(([value, name]) => ({ name, value }))))
```

## See also
- [Autocomplete](08-Autocomplete.md) · [Command Options](05-Command-Options.md)
