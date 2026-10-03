# Responding to Interactions

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[C# portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key methods** | `RespondAsync`, `DeferAsync`, `FollowupAsync`, `ModifyOriginalResponseAsync`, `DeleteOriginalResponseAsync`, `UpdateAsync`, `RespondWithModalAsync` |
| **Time limits** | First response within **3 s**. Follow-ups for **15 min**. |

Inside a module, `RespondAsync`, `DeferAsync` and `FollowupAsync` are protected helpers on `InteractionModuleBase`. Outside modules, call the same methods on the interaction object.

## Decision tree

```
Answer ready now?                → RespondAsync()
Slow work (DB, HTTP, AI)?        → DeferAsync()  … FollowupAsync() / ModifyOriginalResponseAsync()
Button/select edits its message? → ((SocketMessageComponent)Context.Interaction).UpdateAsync()
Need user input?                 → RespondWithModalAsync<TModal>()   (first response only)
```

## RespondAsync

```csharp
await RespondAsync("Hello!");
await RespondAsync(
    text: "With extras",
    embed: embed,
    components: components,
    ephemeral: true,                          // only the user sees it
    allowedMentions: AllowedMentions.None);
```

## Defer + follow-up

```csharp
await DeferAsync();                           // "Bot is thinking…"
var data = await FetchSlowThingAsync();
await FollowupAsync($"Result: {data}");

await DeferAsync(ephemeral: true);
await FollowupAsync("Done", ephemeral: true);
```

## Modifying / deleting the original response

```csharp
await RespondAsync("Working…");
await ModifyOriginalResponseAsync(m =>
{
    m.Content = "Done!";
    m.Components = new ComponentBuilder().Build();   // remove buttons
});
var original = await GetOriginalResponseAsync();
await DeleteOriginalResponseAsync();
```

## Components: update the message

```csharp
[ComponentInteraction("counter:*")]
public async Task CountAsync(int value)
{
    await ((SocketMessageComponent)Context.Interaction).UpdateAsync(m =>
    {
        m.Content = $"Count: {value + 1}";
        m.Components = BuildButtons(value + 1);
    });
}

// Acknowledge without changing anything yet
await DeferAsync();     // for components: acknowledges the click silently
```

## Modals

```csharp
await RespondWithModalAsync<FeedbackModal>("feedback");   // can't come after DeferAsync
```

## Checking state

```csharp
if (Context.Interaction.HasResponded)
    await FollowupAsync(message, ephemeral: true);
else
    await RespondAsync(message, ephemeral: true);
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `HttpException: 404 Unknown interaction` (10062) | Responded after 3 s | `DeferAsync()` first |
| `InvalidOperationException: Cannot respond twice` | Responded twice | `FollowupAsync`/`ModifyOriginalResponseAsync` |
| "The application did not respond" | Exception or no response | Handle `InteractionExecuted` ([Error Handling](34-Error-Handling.md)) |

## RunMode

InteractionService runs commands asynchronously by default (`RunMode.Async`), so a slow command doesn't block the gateway. Exceptions then arrive via `InteractionExecuted`, not as thrown exceptions.

## See also
- [Slash Commands](04-Slash-Commands.md) · [Buttons](12-Buttons.md) · [Error Handling](34-Error-Handling.md)
