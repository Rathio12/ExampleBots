# Buttons

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Components-AF52DE?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key APIs** | `ComponentBuilder`, `ButtonBuilder`, `ButtonStyle`, `[ComponentInteraction]`, `SocketMessageComponent` |
| **Used in** | [02-enhanced PollModule.cs](../../csharp/02-enhanced/Modules/PollModule.cs) · [03-expert LevelingModule.cs](../../csharp/03-expert/src/ExpertBot/Modules/LevelingModule.cs) |

## Creating buttons

```csharp
var components = new ComponentBuilder()
    .WithButton("Confirm", "confirm", ButtonStyle.Success, new Emoji("✅"))
    .WithButton("Cancel", "cancel", ButtonStyle.Danger)
    .WithButton("Docs", style: ButtonStyle.Link, url: "https://docs.discordnet.dev")
    .WithButton("Disabled", "nope", ButtonStyle.Secondary, disabled: true, row: 1)
    .Build();

await RespondAsync("Are you sure?", components: components);
```

`WithButton(label, customId, style, emote, url, disabled, row)`. Up to 5 per row, 5 rows.

| Style | Colour |
|---|---|
| `Primary` | Blurple |
| `Secondary` | Grey |
| `Success` | Green |
| `Danger` | Red |
| `Link` | Opens a URL, no interaction |
| `Premium` | Purchase button (SKU) |

## Handling clicks with `[ComponentInteraction]`

```csharp
[ComponentInteraction("confirm")]
public async Task ConfirmAsync() =>
    await ((SocketMessageComponent)Context.Interaction).UpdateAsync(m =>
    {
        m.Content = "Confirmed!";
        m.Components = new ComponentBuilder().Build();
    });
```

## Wildcards: state in the custom ID

`*` captures part of the custom ID and passes it as a parameter:

```csharp
// sending
.WithButton("Yes", $"poll:{pollId}:yes", ButtonStyle.Success)

// handling: "poll:123:yes" → pollId = "123", choice = "yes"
[ComponentInteraction("poll:*:*")]
public async Task VoteAsync(string pollId, string choice) { … }

// parameters can be converted: "leaderboard:2" → page = 2
[ComponentInteraction("leaderboard:*")]
public async Task PageAsync(int page) { … }
```

Because state lives in the ID, these handlers keep working after a restart.

## Typed context for components

```csharp
public sealed class PollModule : InteractionModuleBase<SocketInteractionContext<SocketMessageComponent>>
{
    [ComponentInteraction("poll:*:*")]
    public async Task VoteAsync(string pollId, string choice) =>
        await Context.Interaction.UpdateAsync(m => m.Content = "Voted!");   // no cast needed
}
```

## Only the author may click

Encode the owner in the ID:

```csharp
.WithButton("Delete", $"delete:{Context.User.Id}", ButtonStyle.Danger)

[ComponentInteraction("delete:*")]
public async Task DeleteAsync(ulong ownerId)
{
    if (Context.User.Id != ownerId)
    {
        await RespondAsync("This button isn't for you.", ephemeral: true);
        return;
    }
    …
}
```

## Disabling buttons after use

```csharp
var message = ((SocketMessageComponent)Context.Interaction).Message;
var builder = ComponentBuilder.FromComponents(message.Components);
// rebuild with disabled buttons
var disabled = new ComponentBuilder();
foreach (var row in message.Components.OfType<ActionRowComponent>())
    foreach (var button in row.Components.OfType<ButtonComponent>())
        disabled.WithButton(button.ToBuilder().WithDisabled(true));
await ((SocketMessageComponent)Context.Interaction).UpdateAsync(m => m.Components = disabled.Build());
```

## Without InteractionService

```csharp
client.ButtonExecuted += async component =>
{
    if (component.Data.CustomId == "confirm") await component.UpdateAsync(m => m.Content = "Confirmed!");
};
```

## See also
- [Select Menus](13-Select-Menus.md) · [Modals](14-Modals.md) · [Components & Modals](../Components-and-Modals.md)
