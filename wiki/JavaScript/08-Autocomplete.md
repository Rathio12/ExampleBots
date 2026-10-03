# Autocomplete

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key APIs** | `setAutocomplete(true)`, `AutocompleteInteraction`, `options.getFocused()`, `interaction.respond()` |
| **Used in** | [03-expert/src/commands/utility/tag.js](../../javascript/03-expert/src/commands/utility/tag.js) |

Autocomplete shows suggestions while the user types an option, computed live by your bot from a database, an API, or any list.

## How it works

1. You mark an option with `setAutocomplete(true)`.
2. On every keystroke, Discord sends an **autocomplete interaction** with what's typed so far.
3. You answer with up to 25 choices within 3 seconds (no deferring).
4. When the user submits the command, you get a normal command interaction.

## Example

```js
export default {
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Post a tag')
    .addStringOption((o) => o.setName('name').setDescription('Tag name').setRequired(true).setAutocomplete(true)),

  // Called for autocomplete interactions
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();                // the text typed so far
    const names = await db.searchTags(interaction.guildId, focused);  // your data source
    await interaction.respond(
      names.slice(0, 25).map((name) => ({ name, value: name })),     // max 25
    );
  },

  // Called when the command is actually run
  async execute(interaction) {
    const name = interaction.options.getString('name', true);
    const tag = await db.getTag(interaction.guildId, name);
    if (!tag) return interaction.reply({ content: 'No such tag.', flags: MessageFlags.Ephemeral });   // always validate!
    await interaction.reply(tag.content);
  },
};
```

### Routing autocomplete

Handle it **before** other interaction types, and never call `reply()` on it:

```js
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    try {
      await command?.autocomplete?.(interaction);
    } catch (error) {
      console.error('Autocomplete failed', error);
    }
    return;
  }
  // … commands, buttons, etc.
});
```

## Multiple autocomplete options

`getFocused(true)` returns `{ name, value }`, so you know which option the user is typing in:

```js
async autocomplete(interaction) {
  const focused = interaction.options.getFocused(true);
  let choices = [];
  if (focused.name === 'country') choices = COUNTRIES;
  if (focused.name === 'city') {
    const country = interaction.options.getString('country');   // other options are available too
    choices = CITIES[country] ?? [];
  }
  const filtered = choices.filter((c) => c.toLowerCase().startsWith(focused.value.toLowerCase()));
  await interaction.respond(filtered.slice(0, 25).map((c) => ({ name: c, value: c })));
}
```

## Showing a label but sending an ID

`name` is what the user sees and `value` is what you receive:

```js
await interaction.respond(products.map((p) => ({ name: `${p.title} (${p.price} €)`, value: String(p.id) })));
```

## Searching a database safely

From the expert bot: a prefix search with `LIKE` wildcards escaped, so typing `%` doesn't match everything:

```js
search: (guildId, prefix, limit = 25) =>
  stmt.all(guildId, `${prefix.replace(/[\\%_]/g, '\\$&')}%`, limit).map((row) => row.name),
// SQL: SELECT name FROM tags WHERE guild_id = ? AND name LIKE ? ESCAPE '\' ORDER BY uses DESC LIMIT ?
```

## Rules

- Max **25** choices, names 1–100 characters.
- Respond within **3 seconds**. Keep the lookup fast (indexes, caching).
- Users can **ignore suggestions** and submit any text. Validate in `execute`.
- An option can't have both `addChoices` and `setAutocomplete(true)`.

## See also
- [Choices](07-Choices.md) · [SQLite Database](37-SQLite-Database.md)
