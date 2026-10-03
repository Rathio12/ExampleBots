# Buttons

<sub>[JavaScript portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `ButtonBuilder`, `ActionRowBuilder`, `ButtonStyle`, `ButtonInteraction` |
| **Limits** | 5 buttons per row, 5 rows per message, custom ID ≤ 100 chars |
| **Used in** | [02-enhanced poll](../../javascript/02-enhanced/src/state/polls.js) · [03-expert leaderboard](../../javascript/03-expert/src/commands/leveling/leaderboard.js) |

## Creating buttons

```js
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('confirm').setLabel('Confirm').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger),
  new ButtonBuilder().setCustomId('info').setEmoji('ℹ️').setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setLabel('Docs').setURL('https://discord.js.org').setStyle(ButtonStyle.Link),
  new ButtonBuilder().setCustomId('disabled').setLabel('Nope').setStyle(ButtonStyle.Primary).setDisabled(true),
);

await interaction.reply({ content: 'Are you sure?', components: [row] });
```

| Style | Colour | Notes |
|---|---|---|
| `Primary` | Blurple | |
| `Secondary` | Grey | |
| `Success` | Green | |
| `Danger` | Red | |
| `Link` | Grey ↗ | Needs `setURL`, no custom ID, sends no interaction |
| `Premium` | | Needs `setSKUId`, opens a purchase |

## Handling clicks: two approaches

### A. Global handler (survives restarts)

Route every button by its custom ID in `InteractionCreate`. Encode the data you need **in the custom ID**:

```js
// sending
new ButtonBuilder().setCustomId(`poll:${pollId}:yes`).setLabel('Yes').setStyle(ButtonStyle.Success);

// handling
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  const [prefix, ...args] = interaction.customId.split(':');
  if (prefix === 'poll') {
    const [pollId, choice] = args;
    // … record the vote …
    await interaction.update({ embeds: [buildPollEmbed(pollId)] });
  }
});
```

The Enhanced and Expert bots generalise this into a `components/` folder where each file handles one prefix.

### B. Collectors (temporary, in-command)

Best for short flows like confirmations. They stop working on restart:

```js
const response = await interaction.reply({ content: 'Delete everything?', components: [row], withResponse: true });

try {
  const click = await response.resource.message.awaitMessageComponent({
    filter: (i) => i.user.id === interaction.user.id,   // only the command user
    time: 30_000,
  });
  if (click.customId === 'confirm') await click.update({ content: '🗑️ Deleted.', components: [] });
  else await click.update({ content: 'Cancelled.', components: [] });
} catch {
  await interaction.editReply({ content: '⌛ Timed out.', components: [] });
}
```

For many clicks over time:

```js
const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
collector.on('collect', async (i) => { await i.update({ content: `Clicked by ${i.user}` }); });
collector.on('end', async () => { await message.edit({ components: [] }); });
```

## Responding to a click

| Method | Effect |
|---|---|
| `interaction.update({...})` | Edit the message with the button |
| `interaction.deferUpdate()` | Acknowledge silently, edit later with `editReply` |
| `interaction.reply({...})` | Send a new message (often ephemeral) |
| `interaction.showModal(modal)` | Open a form |

## Disabling buttons after use

```js
const disabledRow = new ActionRowBuilder().addComponents(
  row.components.map((button) => ButtonBuilder.from(button).setDisabled(true)),
);
await interaction.update({ components: [disabledRow] });
```

## Only the author may click

```js
if (interaction.user.id !== ownerId) {
  return interaction.reply({ content: 'This button is not for you.', flags: MessageFlags.Ephemeral });
}
```

Encode the owner in the custom ID (`confirm:<ownerId>`) when using global handlers.

## Pagination example

From the expert bot's leaderboard: the buttons carry the page they lead to.

```js
const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`leaderboard:${page - 1}`).setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
  new ButtonBuilder().setCustomId(`leaderboard:${page + 1}`).setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(page >= pages - 1),
);
// handler: interaction.update(buildLeaderboardPage(Number(page)))
```

Because the page number is in the ID, the buttons keep working after a restart.

## Common mistakes

| Problem | Fix |
|---|---|
| "This interaction failed" | No handler for that ID, the handler threw, or it took > 3 s |
| Two buttons with the same custom ID | Every custom ID in a message must be unique |
| More than 5 buttons in a row | Split across rows (max 5 rows) |
| Link button with a custom ID | Link buttons take only a URL |

## See also
- [Select Menus](13-Select-Menus.md) · [Modals](14-Modals.md) · [Responding to Interactions](10-Responding-to-Interactions.md)
- [Components & Modals](../Components-and-Modals.md) (all languages)
