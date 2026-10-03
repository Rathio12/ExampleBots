# Subcommands & Groups

<sub>[JavaScript portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key methods** | `addSubcommand`, `addSubcommandGroup`, `options.getSubcommand()`, `options.getSubcommandGroup()` |
| **Used in** | [03-expert/src/commands/utility/tag.js](../../javascript/03-expert/src/commands/utility/tag.js), [remind.js](../../javascript/03-expert/src/commands/utility/remind.js), [settings.js](../../javascript/03-expert/src/commands/utility/settings.js) |

Subcommands group related actions under one name: `/tag show`, `/tag create`, `/tag delete`. Groups add one more level: `/config logs set`.

```
/command                       ← cannot be run by itself once it has subcommands
 ├── subcommand
 └── group
      └── subcommand
```

## Subcommands

```js
export default {
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Saved text snippets')
    .addSubcommand((sub) =>
      sub
        .setName('show')
        .setDescription('Post a tag')
        .addStringOption((o) => o.setName('name').setDescription('Tag name').setRequired(true)))
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a tag')
        .addStringOption((o) => o.setName('name').setDescription('Name').setRequired(true))
        .addStringOption((o) => o.setName('content').setDescription('Content').setRequired(true)))
    .addSubcommand((sub) => sub.setName('list').setDescription('List tags')),

  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case 'show': {
        const name = interaction.options.getString('name', true);
        return interaction.reply(`Showing ${name}`);
      }
      case 'create':
        return interaction.reply('Created!');
      case 'list':
        return interaction.reply('All tags: …');
    }
  },
};
```

## Subcommand groups

```js
new SlashCommandBuilder()
  .setName('config')
  .setDescription('Server configuration')
  .addSubcommandGroup((group) =>
    group
      .setName('logs')
      .setDescription('Log channels')
      .addSubcommand((sub) =>
        sub.setName('set').setDescription('Set the log channel')
          .addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true)))
      .addSubcommand((sub) => sub.setName('disable').setDescription('Disable logging')))
  .addSubcommand((sub) => sub.setName('view').setDescription('Show the configuration'));

// Handler
const group = interaction.options.getSubcommandGroup(false);   // false = may be null
const sub = interaction.options.getSubcommand();
const key = group ? `${group}.${sub}` : sub;                   // "logs.set", "logs.disable", "view"
```

A command can mix groups and plain subcommands, but a command with subcommands can't also have regular options at the top level.

## Organising large commands

Map subcommands to functions instead of a long `switch`:

```js
const handlers = {
  show: async (interaction, ctx) => { /* … */ },
  create: async (interaction, ctx) => { /* … */ },
  list: async (interaction, ctx) => { /* … */ },
};

async execute(interaction, ctx) {
  await handlers[interaction.options.getSubcommand()](interaction, ctx);
}
```

## Permissions

`setDefaultMemberPermissions` applies to the **whole** command, not to individual subcommands. If one subcommand needs stricter permissions (e.g. `/tag delete`), check at runtime:

```js
if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
  return interaction.reply({ content: 'You need Manage Messages.', flags: MessageFlags.Ephemeral });
}
```

Or split it into a separate command with its own default permissions.

## Limits

- 25 subcommands/groups per command, 25 subcommands per group.
- Nesting depth: group → subcommand (no deeper).

## See also
- [Slash Commands](04-Slash-Commands.md) · [Command Options](05-Command-Options.md) · [Permissions](26-Permissions.md)
