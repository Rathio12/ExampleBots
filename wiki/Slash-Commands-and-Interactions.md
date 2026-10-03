# Slash Commands & Interactions

Slash commands are the main way users talk to modern bots. This page covers every part of them, with code in all three languages.

## Anatomy of a command

```
/remind create in:2h message:Stand-up meeting
 │      │      └── options (typed values)
 │      └── subcommand
 └── command
```

Each command has a **definition** (registered with Discord, shown in the `/` menu) and a **handler** (your code that runs when it's used).

## Defining commands

**JavaScript:** builders produce the JSON:

```js
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('greet')
  .setDescription('Greet someone')
  .addUserOption((o) => o.setName('user').setDescription('Who to greet').setRequired(true))
  .addStringOption((o) => o.setName('style').setDescription('How').addChoices(
    { name: 'Friendly', value: 'friendly' },
    { name: 'Formal', value: 'formal' },
  ));
```

**Python:** the signature is the definition:

```python
@app_commands.command(description="Greet someone")
@app_commands.describe(user="Who to greet", style="How")
@app_commands.choices(style=[
    app_commands.Choice(name="Friendly", value="friendly"),
    app_commands.Choice(name="Formal", value="formal"),
])
async def greet(self, interaction: discord.Interaction, user: discord.User, style: str = "friendly"):
    ...
```

**C#:** attributes on a module method:

```csharp
public enum GreetStyle { Friendly, Formal }   // enums become choices automatically

[SlashCommand("greet", "Greet someone")]
public async Task GreetAsync(
    [Summary(description: "Who to greet")] IUser user,
    [Summary(description: "How")] GreetStyle style = GreetStyle.Friendly)
{ ... }
```

## Option types

| Type | JS getter | Python type hint | C# parameter type |
|---|---|---|---|
| String | `getString` | `str` | `string` |
| Integer | `getInteger` | `int` | `int` / `long` |
| Number (float) | `getNumber` | `float` | `double` |
| Boolean | `getBoolean` | `bool` | `bool` |
| User | `getUser` / `getMember` | `discord.User` / `discord.Member` | `IUser` / `SocketGuildUser` |
| Channel | `getChannel` | `discord.TextChannel` etc. | `ITextChannel` etc. |
| Role | `getRole` | `discord.Role` | `IRole` |
| Mentionable | `getMentionable` | `discord.User \| discord.Role` | `IMentionable` |
| Attachment | `getAttachment` | `discord.Attachment` | `IAttachment` |

**Constraints:** min/max values for numbers, min/max length for strings, channel type filters.

| | JS | Python | C# |
|---|---|---|---|
| Number range | `.setMinValue(2).setMaxValue(1000)` | `app_commands.Range[int, 2, 1000]` | `[MinValue(2), MaxValue(1000)]` |
| String length | `.setMaxLength(200)` | `app_commands.Range[str, 1, 200]` | `[MaxLength(200)]` |
| Channel types | `.addChannelTypes(ChannelType.GuildText)` | type hint `discord.TextChannel` | `[ChannelTypes(ChannelType.Text)]` |
| Optional | omit `.setRequired(true)` | default value `= None` | default value `= null` |

Discord validates these **before** your code runs, so a user can't send `sides: 5000`.

## Subcommands

Group related actions under one command. The examples use this for `/remind`, `/tag` and `/settings`.

```js
// JS
new SlashCommandBuilder().setName('tag').setDescription('Tags')
  .addSubcommand((s) => s.setName('show').setDescription('Show a tag') /* options */)
  .addSubcommand((s) => s.setName('list').setDescription('List tags'));

switch (interaction.options.getSubcommand()) { case 'show': ...; case 'list': ... }
```

```python
# Python
class Tags(commands.Cog):
    tag = app_commands.Group(name="tag", description="Tags")

    @tag.command(name="show", description="Show a tag")
    async def show(self, interaction, name: str): ...
```

```csharp
// C#
[Group("tag", "Tags")]
public class TagModule : InteractionModuleBase<SocketInteractionContext>
{
    [SlashCommand("show", "Show a tag")] public async Task ShowAsync(string name) { ... }
}
```

A command with subcommands can't be run on its own. `/tag` alone isn't valid, only `/tag show`.

## Autocomplete

Autocomplete suggests values as the user types, from your database or an API. It's different from choices: choices are fixed at registration, while autocomplete is dynamic.

```js
// JS: option definition
.addStringOption((o) => o.setName('name').setDescription('Tag').setAutocomplete(true))

// handler (interaction.isAutocomplete())
async autocomplete(interaction) {
  const typed = interaction.options.getFocused();
  const names = repos.tags.search(interaction.guildId, typed, 25);
  await interaction.respond(names.map((n) => ({ name: n, value: n })));
}
```

```python
# Python
@tag.command(name="show")
@app_commands.autocomplete(name=tag_name_autocomplete)
async def show(self, interaction, name: str): ...

async def tag_name_autocomplete(self, interaction, current: str):
    names = await self.bot.db.tags.search(interaction.guild_id, current, 25)
    return [app_commands.Choice(name=n, value=n) for n in names]
```

```csharp
// C#
public class TagNameAutocomplete : AutocompleteHandler
{
    public override async Task<AutocompletionResult> GenerateSuggestionsAsync(
        IInteractionContext ctx, IAutocompleteInteraction ai, IParameterInfo p, IServiceProvider services)
    {
        var current = ai.Data.Current.Value?.ToString() ?? "";
        var names = await services.GetRequiredService<TagRepository>().SearchAsync(ctx.Guild.Id, current, 25);
        return AutocompletionResult.FromSuccess(names.Select(n => new AutocompleteResult(n, n)));
    }
}

[SlashCommand("show", "Show a tag")]
public async Task ShowAsync([Autocomplete(typeof(TagNameAutocomplete))] string name) { ... }
```

**Important:** users can ignore suggestions and type anything, so always validate the value in the command handler.

## Context menu commands

Right-click → **Apps** → your command. There are two kinds:

| Type | Receives | Example |
|---|---|---|
| User command | the clicked user/member | "Show Rank" |
| Message command | the clicked message | "Bookmark" |

```js
// JS
new ContextMenuCommandBuilder().setName('Show Rank').setType(ApplicationCommandType.User);
// handler: interaction.targetUser / interaction.targetMessage
```

```python
# Python (inside a cog: create in __init__, decorators don't work there)
self.menu = app_commands.ContextMenu(name="Show Rank", callback=self.show_rank)
self.bot.tree.add_command(self.menu)

async def show_rank(self, interaction: discord.Interaction, member: discord.Member): ...
```

```csharp
// C#
[UserCommand("Show Rank")]       public async Task ShowRankAsync(IUser user) { ... }
[MessageCommand("Bookmark")]     public async Task BookmarkAsync(IMessage message) { ... }
```

Context menu names can contain spaces and capitals. They have no description and no options.

## Guild vs global commands

| | Guild commands | Global commands |
|---|---|---|
| Where | One server | Every server + DMs |
| Update speed | Instant | Usually quick, can take up to ~1 hour on clients |
| Use for | Development, private bots | Public bots in production |

All examples use guild registration when `GUILD_ID` is set. **Don't register the same commands both ways**, or users see duplicates. If that happens, clear one set by registering an empty list.

## Registering (syncing) commands

| Library | Method | When the examples do it |
|---|---|---|
| discord.js | `rest.put(Routes.applicationGuildCommands(appId, guildId), { body })` | `npm run deploy` (Enhanced/Expert); on ready (Basic) |
| discord.py | `await bot.tree.sync(guild=...)` | `setup_hook` on every start |
| Discord.Net | `RegisterCommandsToGuildAsync(id)` / `RegisterCommandsGloballyAsync()` | `Ready` (once per process) |

All of them **overwrite** the whole list, so commands removed from your code disappear from Discord.

## Who can use a command

```js
.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)   // hidden for members without Ban Members
.setContexts(InteractionContextType.Guild)                      // not usable in DMs
```

```python
@app_commands.default_permissions(ban_members=True)
@app_commands.guild_only()
```

```csharp
[DefaultMemberPermissions(GuildPermission.BanMembers)]
[CommandContextType(InteractionContextType.Guild)]
```

Server admins can override these in **Server Settings → Integrations → your bot**, granting or blocking commands per role and channel. That's intended: default permissions are a *default*. Still check the role hierarchy for moderation ([Permissions & Moderation](Permissions-and-Moderation.md)).

## Handling the response

See [How Discord Bots Work → Interactions](How-Discord-Bots-Work.md#interactions) for reply, defer, update and ephemeral. The most common pattern for slow work:

```js
await interaction.deferReply();            // within 3 seconds
const data = await fetchSomethingSlow();   // take your time (up to 15 min)
await interaction.editReply(`Result: ${data}`);
```

## Error handling

Every example routes errors to one place:

- **JS:** `try/catch` in `events/interactionCreate.js`, replying or following up depending on `interaction.replied || interaction.deferred`.
- **Python:** `CommandTree.on_error` (subclassed as `EnhancedTree`/`ExpertTree`), which also translates cooldown and permission errors into friendly messages.
- **C#:** `InteractionService.InteractionExecuted`, where failed preconditions and exceptions arrive as an `IResult`.

Always answer the user when something fails. Silence looks like the bot is broken.
