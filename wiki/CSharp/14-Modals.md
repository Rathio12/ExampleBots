# Modals

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Components-AF52DE?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key APIs** | `IModal`, `[ModalTextInput]`, `[InputLabel]`, `RespondWithModalAsync<T>`, `[ModalInteraction]`, `ModalBuilder` |
| **Used in** | [02-enhanced FeedbackModule.cs](../../csharp/02-enhanced/Modules/FeedbackModule.cs) |

## Declaring a modal as a class

```csharp
public sealed class FeedbackModal : IModal
{
    public string Title => "Send feedback";

    [InputLabel("Subject")]
    [ModalTextInput("subject", maxLength: 100)]
    public string Subject { get; set; } = "";

    [InputLabel("Your feedback")]
    [ModalTextInput("message", TextInputStyle.Paragraph, "What do you like? What could be better?", minLength: 10, maxLength: 1000)]
    public string Message { get; set; } = "";

    [InputLabel("Contact (optional)")]
    [RequiredInput(false)]
    [ModalTextInput("contact")]
    public string? Contact { get; set; }
}
```

`ModalTextInput(customId, style, placeholder, minLength, maxLength, initValue)`.

## Showing and handling it

```csharp
[SlashCommand("feedback", "Send feedback")]
public async Task FeedbackAsync() =>
    await RespondWithModalAsync<FeedbackModal>("feedback");     // must be the first response

[ModalInteraction("feedback")]
public async Task OnSubmitAsync(FeedbackModal modal) =>
    await RespondAsync($"Thanks! Got: **{modal.Subject}**", ephemeral: true);
```

## Passing context with wildcards

```csharp
await RespondWithModalAsync<EditTagModal>($"edit-tag:{tagName}");

[ModalInteraction("edit-tag:*")]
public async Task OnEditAsync(string tagName, EditTagModal modal) { … }
```

## Pre-filled values

```csharp
await RespondWithModalAsync<EditTagModal>($"edit-tag:{name}", modifyModal: builder =>
    builder.UpdateTextInput("content", input => input.Value = currentContent));
```

## Building a modal manually

```csharp
var modal = new ModalBuilder()
    .WithTitle("Report")
    .WithCustomId("report")
    .AddTextInput("Reason", "reason", TextInputStyle.Paragraph, required: true)
    .Build();
await Context.Interaction.RespondWithModalAsync(modal);

// without InteractionService
client.ModalSubmitted += async modal =>
{
    var reason = modal.Data.Components.First(c => c.CustomId == "reason").Value;
    await modal.RespondAsync("Reported!", ephemeral: true);
};
```

## Rules

- `RespondWithModalAsync` can't come after `DeferAsync`, and not in response to a modal.
- Title max 45 characters, max 5 inputs.
- Validate content in the handler.

## See also
- [Buttons](12-Buttons.md) · [Context Menus](09-Context-Menus.md)
