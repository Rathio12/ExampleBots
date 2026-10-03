# Select Menus

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Components-AF52DE?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key APIs** | `SelectMenuBuilder`, `ComponentType.*SelectMenu`, `[ComponentInteraction]` with a values parameter |
| **Used in** | [02-enhanced TriviaModule.cs](../../csharp/02-enhanced/Modules/TriviaModule.cs) |

## String select

```csharp
var menu = new SelectMenuBuilder()
    .WithCustomId("pick-color")
    .WithPlaceholder("Choose a colour…")
    .WithMinValues(1)
    .WithMaxValues(1)
    .AddOption("Red", "red", "Warm", new Emoji("🟥"))
    .AddOption("Blue", "blue", emote: new Emoji("🟦"), isDefault: true)
    .AddOption("Green", "green");

await RespondAsync("Pick one:", components: new ComponentBuilder().WithSelectMenu(menu).Build());
```

`AddOption(label, value, description, emote, isDefault)`.

## Handling a selection

The **last parameter** receives the selected values:

```csharp
[ComponentInteraction("pick-color")]
public async Task PickAsync(string[] selected) =>
    await RespondAsync($"You picked **{selected[0]}**", ephemeral: true);

// With wildcards: "trivia:3" + selected values
[ComponentInteraction("trivia:*")]
public async Task AnswerAsync(string questionIndex, string[] selected) { … }
```

## User, role, channel and mentionable selects

```csharp
var users = new SelectMenuBuilder()
    .WithCustomId("pick-users")
    .WithType(ComponentType.UserSelect)
    .WithMaxValues(5);

var channels = new SelectMenuBuilder()
    .WithCustomId("pick-channel")
    .WithType(ComponentType.ChannelSelect)
    .WithChannelTypes(ChannelType.Text);

// handler: typed values
[ComponentInteraction("pick-users")]
public async Task PickUsersAsync(IUser[] users) =>
    await RespondAsync(string.Join(", ", users.Select(u => u.Mention)), ephemeral: true);

[ComponentInteraction("pick-roles")]
public async Task PickRolesAsync(IRole[] roles) { … }

[ComponentInteraction("pick-channel")]
public async Task PickChannelAsync(IChannel[] channels) { … }
```

Other types: `ComponentType.RoleSelect`, `ComponentType.MentionableSelect`.

## Self-assignable roles

```csharp
[ComponentInteraction("roles:pick")]
public async Task PickRolesAsync(string[] selected)
{
    var member = (SocketGuildUser)Context.User;
    var menu = ((SocketMessageComponent)Context.Interaction).Message.Components
        .OfType<ActionRowComponent>().SelectMany(r => r.Components).OfType<SelectMenuComponent>().First();

    var offered = menu.Options.Select(o => ulong.Parse(o.Value)).ToHashSet();
    var chosen = selected.Select(ulong.Parse).ToHashSet();

    await member.AddRolesAsync(chosen);
    await member.RemoveRolesAsync(offered.Except(chosen));
    await RespondAsync("✅ Roles updated!", ephemeral: true);
}
```

Reading the options from the message itself keeps the handler working forever.

## Limits

25 options, unique values, one select per row.

## See also
- [Buttons](12-Buttons.md) · [Modals](14-Modals.md) · [Roles](24-Roles.md)
