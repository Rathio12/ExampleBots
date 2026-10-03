# Context Menus

<sub>[JavaScript portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key classes** | `ContextMenuCommandBuilder`, `UserContextMenuCommandInteraction`, `MessageContextMenuCommandInteraction` |
| **Used in** | [03-expert/src/commands/context/](../../javascript/03-expert/src/commands/context) (Show Rank, Bookmark) |

Context menu commands appear when you right-click (or long-press) a **user** or a **message** → **Apps**. They have no description and no options: the clicked target is the input.

## User context menu

```js
import { ApplicationCommandType, ContextMenuCommandBuilder, InteractionContextType, MessageFlags } from 'discord.js';

export default {
  data: new ContextMenuCommandBuilder()
    .setName('Show Avatar')                       // spaces and capitals allowed here
    .setType(ApplicationCommandType.User)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const user = interaction.targetUser;           // User
    const member = interaction.targetMember;       // GuildMember (in servers)
    await interaction.reply({
      content: user.displayAvatarURL({ size: 1024 }),
      flags: MessageFlags.Ephemeral,
    });
  },
};
```

## Message context menu

```js
export default {
  data: new ContextMenuCommandBuilder()
    .setName('Bookmark')
    .setType(ApplicationCommandType.Message),

  async execute(interaction) {
    const message = interaction.targetMessage;     // Message
    await interaction.user.send(`🔖 ${message.url}\n${message.content}`);
    await interaction.reply({ content: 'Sent to your DMs!', flags: MessageFlags.Ephemeral });
  },
};
```

## Registering and routing

Context menus are registered alongside slash commands (same `PUT` route) and arrive through the same event:

```js
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
    const command = client.commands.get(interaction.commandName);   // name = 'Bookmark', 'Show Avatar'
    await command?.execute(interaction);
  }
});
```

Narrower checks: `interaction.isUserContextMenuCommand()` / `interaction.isMessageContextMenuCommand()`.

## Ideas

| Type | Idea |
|---|---|
| User | Show rank, user info, warn, quick timeout, "Report user" (opens a modal) |
| Message | Bookmark, translate, report to moderators, quote, "Create ticket from message", pin via bot |

A context menu can also open a modal, e.g. "Report message" → modal asking for a reason → posts to a mod channel.

## Rules

- Names: 1–32 characters, spaces and capitals allowed, no description.
- Each app can register only a few context menus per type (check the docs for the current number). Pick the most useful ones.
- `setDefaultMemberPermissions` works the same as for slash commands.

## See also
- [Slash Commands](04-Slash-Commands.md) · [Modals](14-Modals.md)
