# Components & Modals

Components make messages interactive: buttons, select menus and pop-up forms (modals). The Enhanced bots use all of them. See `/poll`, `/trivia` and `/feedback`.

## How components work

1. You send a message with components. Each one has a **custom ID** (up to 100 characters).
2. A user clicks. Discord sends your bot an interaction carrying that custom ID.
3. You respond within 3 seconds, often by **updating** the original message.

The custom ID is the only thing you get back, so **encode what the click means into it**:

```
poll:1294836104729:yes        trivia:3        leaderboard:2
└┬─┘ └─────┬──────┘ └┬┘       └─┬──┘ └┘       └────┬────┘ └┘
prefix   poll ID   choice     prefix question     prefix  page
```

The examples route by the prefix before the first `:` and pass the rest as arguments.

## Buttons

| Style | Look | Notes |
|---|---|---|
| Primary | blurple | |
| Secondary | grey | |
| Success | green | |
| Danger | red | |
| Link | grey with ↗ | Opens a URL, no interaction sent, no custom ID |
| Premium | | Opens a purchase flow for an SKU |

**JavaScript**

```js
const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`poll:${id}:yes`).setLabel('Yes').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId(`poll:${id}:no`).setLabel('No').setStyle(ButtonStyle.Danger),
);
await interaction.reply({ embeds: [embed], components: [row] });

// handler
if (interaction.isButton()) {
  const [prefix, pollId, choice] = interaction.customId.split(':');
  await interaction.update({ embeds: [newEmbed] });   // edits the message with the button
}
```

**Python:** a `View` holds buttons and their callbacks:

```python
class PollView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=86400)   # buttons stop working after 24h

    @discord.ui.button(label="Yes", style=discord.ButtonStyle.success)
    async def yes(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.edit_message(embed=self.build_embed(), view=self)

await interaction.response.send_message(embed=embed, view=PollView())
```

**C#:** wildcards in the custom ID become parameters:

```csharp
var components = new ComponentBuilder()
    .WithButton("Yes", $"poll:{id}:yes", ButtonStyle.Success)
    .WithButton("No", $"poll:{id}:no", ButtonStyle.Danger)
    .Build();
await RespondAsync(embed: embed, components: components);

[ComponentInteraction("poll:*:*")]
public async Task VoteAsync(string pollId, string choice)
{
    await ((SocketMessageComponent)Context.Interaction).UpdateAsync(m => m.Embed = newEmbed);
}
```

## Select menus

| Type | User picks from | Value you get |
|---|---|---|
| String select | Options you define (max 25) | The option's `value` strings |
| User select | Server members | User IDs / objects |
| Role select | Roles | Role IDs / objects |
| Channel select | Channels (filterable by type) | Channel IDs / objects |
| Mentionable select | Users and roles | IDs |

Set `min_values`/`max_values` for multi-select. A select menu takes a whole action row.

```js
// JS: string select
new StringSelectMenuBuilder()
  .setCustomId(`trivia:${index}`)
  .setPlaceholder('Pick your answer…')
  .addOptions(answers.map((a, i) => ({ label: a, value: String(i) })));

// handler: interaction.isStringSelectMenu() → interaction.values[0]
```

```python
# Python
class TriviaSelect(discord.ui.Select):
    def __init__(self, answers):
        super().__init__(placeholder="Pick…", options=[discord.SelectOption(label=a, value=str(i)) for i, a in enumerate(answers)])

    async def callback(self, interaction):
        picked = self.values[0]
```

```csharp
// C#: the last parameter receives the selected values
[ComponentInteraction("trivia:*")]
public async Task AnswerAsync(string questionIndex, string[] selected) { ... }
```

Role select menus are the modern way to build **self-assignable role pickers**. See [Use-Case Recipes](Use-Case-Recipes.md#self-assignable-roles).

## Modals (forms)

A modal is a pop-up with up to 5 text inputs. Showing one **is** the interaction response, so you can't defer first, and you can't show a modal in response to a modal.

```js
// JS
const modal = new ModalBuilder().setCustomId('feedback').setTitle('Send feedback');
modal.addComponents(
  new ActionRowBuilder().addComponents(
    new TextInputBuilder().setCustomId('subject').setLabel('Subject').setStyle(TextInputStyle.Short),
  ),
  new ActionRowBuilder().addComponents(
    new TextInputBuilder().setCustomId('message').setLabel('Message').setStyle(TextInputStyle.Paragraph),
  ),
);
await interaction.showModal(modal);

// handler: interaction.isModalSubmit() && customId === 'feedback'
const subject = interaction.fields.getTextInputValue('subject');
```

```python
# Python
class FeedbackModal(discord.ui.Modal, title="Send feedback"):
    subject = discord.ui.TextInput(label="Subject", max_length=100)
    message = discord.ui.TextInput(label="Message", style=discord.TextStyle.paragraph)

    async def on_submit(self, interaction):
        await interaction.response.send_message(f"Thanks! {self.subject.value}", ephemeral=True)

await interaction.response.send_modal(FeedbackModal())
```

```csharp
// C#
public class FeedbackModal : IModal
{
    public string Title => "Send feedback";
    [InputLabel("Subject"), ModalTextInput("subject", maxLength: 100)] public string Subject { get; set; } = "";
    [InputLabel("Message"), ModalTextInput("message", TextInputStyle.Paragraph)] public string Message { get; set; } = "";
}

await RespondWithModalAsync<FeedbackModal>("feedback");

[ModalInteraction("feedback")]
public async Task OnSubmitAsync(FeedbackModal modal) { ... }
```

Discord has also added **label components** and select menus inside modals. Newer library versions expose them (for example `LabelBuilder` in discord.js). The classic text-input form above still works everywhere.

## Making components survive restarts

| Approach | Survives restart? | Used in |
|---|---|---|
| State encoded in the custom ID + global handler | Yes, if state can be rebuilt | JS/C# leaderboard (`leaderboard:<page>`) |
| State in memory, keyed by custom ID | No (handler replies "expired") | Enhanced polls |
| Python `View` instance with callbacks | No (unless registered as a persistent view) | Python polls, leaderboard |
| State in a database, keyed by custom ID | Yes | Recommended for production polls, tickets, giveaways |

**Persistent views in discord.py:** give every item a fixed `custom_id`, use `timeout=None`, and call `bot.add_view(MyView())` in `setup_hook`. The view then handles clicks on old messages after a restart. For dynamic IDs use `discord.ui.DynamicItem`.

## Components V2

Discord's newer layout system replaces embeds with composable blocks: **Container** (with an accent colour), **Section** (text plus a thumbnail or button accessory), **TextDisplay** (Markdown), **MediaGallery**, **File** and **Separator**. Send it with the `IsComponentsV2` message flag. A V2 message can't also have `content` or `embeds`.

```js
// discord.js 14.19+
import { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } from 'discord.js';

const container = new ContainerBuilder()
  .setAccentColor(0x5865f2)
  .addTextDisplayComponents(new TextDisplayBuilder().setContent('## Server status\n🟢 **12/100** players online'))
  .addSeparatorComponents(new SeparatorBuilder())
  .addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Updated every 5 minutes'));

await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
```

discord.py exposes the same idea through `discord.ui.LayoutView` (2.6+), and Discord.Net through `ComponentBuilderV2` (3.18+). The examples stick to embeds because every client and library version supports them, but V2 is worth exploring for dashboards and status panels.

## Common mistakes

- **"This interaction failed"**: your handler threw, didn't respond within 3 s, or there's no handler for that custom ID. Check the logs.
- **Using `reply` in a button handler when you meant to edit**: use `update()` / `edit_message()` / `UpdateAsync()`.
- **Custom IDs longer than 100 characters**: store the data in a database and put the row ID in the custom ID.
- **Trusting the click**: anyone who can see the message can click. Check `interaction.user` if only the author should be able to use it.
