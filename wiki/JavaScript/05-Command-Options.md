# Command Options

<sub>[JavaScript portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key classes** | `SlashCommand*Option`, `CommandInteractionOptionResolver` |
| **Used in** | [01-basic/index.js](../../javascript/01-basic/index.js) (`/roll`, `/avatar`, `/8ball`) |

Options are typed inputs: `/roll sides:20`. Discord shows the right picker for each type (number field, user list, channel list) and validates the value before your bot ever sees it.

## All option types

| Builder method | Value type | Getter |
|---|---|---|
| `addStringOption` | `string` | `getString(name)` |
| `addIntegerOption` | `number` (whole) | `getInteger(name)` |
| `addNumberOption` | `number` (decimal) | `getNumber(name)` |
| `addBooleanOption` | `boolean` | `getBoolean(name)` |
| `addUserOption` | `User` (+ `GuildMember`) | `getUser(name)`, `getMember(name)` |
| `addChannelOption` | channel | `getChannel(name)` |
| `addRoleOption` | `Role` | `getRole(name)` |
| `addMentionableOption` | `User`/`GuildMember`/`Role` | `getMentionable(name)` |
| `addAttachmentOption` | `Attachment` | `getAttachment(name)` |

## Defining options

```js
new SlashCommandBuilder()
  .setName('example')
  .setDescription('Shows every option type')
  .addStringOption((o) =>
    o.setName('text').setDescription('Some text').setRequired(true).setMinLength(3).setMaxLength(200))
  .addIntegerOption((o) =>
    o.setName('amount').setDescription('1-100').setMinValue(1).setMaxValue(100))
  .addNumberOption((o) =>
    o.setName('ratio').setDescription('0.0-1.0').setMinValue(0).setMaxValue(1))
  .addBooleanOption((o) => o.setName('public').setDescription('Show to everyone?'))
  .addUserOption((o) => o.setName('user').setDescription('A user'))
  .addChannelOption((o) =>
    o.setName('channel').setDescription('A text channel').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
  .addRoleOption((o) => o.setName('role').setDescription('A role'))
  .addMentionableOption((o) => o.setName('target').setDescription('User or role'))
  .addAttachmentOption((o) => o.setName('file').setDescription('Upload a file'));
```

**Rules:**
- Option names: 1–32 characters, lowercase, `-` and `_` allowed.
- **Required options must come before optional ones.**
- Up to 25 options per command.

### Constraint methods

| Method | Applies to | Effect |
|---|---|---|
| `setRequired(true)` | all | User must fill it |
| `setMinValue` / `setMaxValue` | integer, number | Range |
| `setMinLength` / `setMaxLength` | string | Length (0–6000) |
| `addChannelTypes(...)` | channel | Restrict channel kinds |
| `addChoices(...)` | string, integer, number | Fixed values ([Choices](07-Choices.md)) |
| `setAutocomplete(true)` | string, integer, number | Dynamic suggestions ([Autocomplete](08-Autocomplete.md)) |

## Reading options

```js
async execute(interaction) {
  const text = interaction.options.getString('text', true);   // `true` = required: never null
  const amount = interaction.options.getInteger('amount') ?? 10;   // optional with a default
  const isPublic = interaction.options.getBoolean('public') ?? false;
  const user = interaction.options.getUser('user') ?? interaction.user;
  const member = interaction.options.getMember('user');       // GuildMember | null
  const channel = interaction.options.getChannel('channel');
  const role = interaction.options.getRole('role');
  const file = interaction.options.getAttachment('file');
}
```

- Passing `true` as the second argument throws if the option is missing, which is handy for required options and keeps TypeScript happy.
- Optional options return `null` when not provided. Use `??` for defaults.

### Users vs members

`getUser` returns the global **User** (username, avatar, ID). `getMember` returns the server-specific **GuildMember** (nickname, roles, join date). It's `null` if the user isn't in the server, so handle that:

```js
const user = interaction.options.getUser('user') ?? interaction.user;
const member = interaction.options.getUser('user') ? interaction.options.getMember('user') : interaction.member;
if (!member) return interaction.reply(`${user.tag} is not in this server.`);
```

### Attachments

```js
const file = interaction.options.getAttachment('file', true);
console.log(file.name, file.size, file.contentType, file.url);
if (!file.contentType?.startsWith('image/')) return interaction.reply('Please upload an image.');
const bytes = Buffer.from(await (await fetch(file.url)).arrayBuffer());
```

## Full example: `/roll`

```js
export default {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll dice')
    .addIntegerOption((o) => o.setName('sides').setDescription('Sides per die').setMinValue(2).setMaxValue(1000))
    .addIntegerOption((o) => o.setName('count').setDescription('How many dice').setMinValue(1).setMaxValue(20)),

  async execute(interaction) {
    const sides = interaction.options.getInteger('sides') ?? 6;
    const count = interaction.options.getInteger('count') ?? 1;
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);
    await interaction.reply(`🎲 ${count}d${sides}: ${rolls.join(', ')} = **${total}**`);
  },
};
```

## Common mistakes

| Problem | Fix |
|---|---|
| `getMember` is `null` | User isn't in the server, or you're in a DM |
| Option missing after you added it | Re-register commands |
| "Required options must be placed before non-required options" | Reorder the builder calls |
| `getChannel` returns a voice channel | Add `addChannelTypes(ChannelType.GuildText)` |

## See also
- [Choices](07-Choices.md) · [Autocomplete](08-Autocomplete.md) · [Subcommands](06-Subcommands-and-Groups.md)
