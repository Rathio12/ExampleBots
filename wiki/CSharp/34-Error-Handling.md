# Error Handling

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key APIs** | `InteractionService.InteractionExecuted`, `IResult`, `InteractionCommandError`, `HttpException`, `DiscordErrorCode` |
| **Used in** | [02-enhanced InteractionHandler.cs](../../csharp/02-enhanced/Services/InteractionHandler.cs) · [03-expert DiscordBotService.cs](../../csharp/03-expert/src/ExpertBot/Services/DiscordBotService.cs) |

## Why exceptions don't "throw"

InteractionService runs commands with `RunMode.Async` by default. An exception inside a command doesn't propagate to `ExecuteCommandAsync`. Instead it's reported as a **result** on the `InteractionExecuted` event. Handle failures there:

```csharp
interactions.InteractionExecuted += async (command, context, result) =>
{
    if (result.IsSuccess) return;

    var message = result.Error switch
    {
        InteractionCommandError.UnmetPrecondition => $"🚫 {result.ErrorReason}",      // permissions, cooldowns
        InteractionCommandError.UnknownCommand => "That command no longer exists.",
        InteractionCommandError.ConvertFailed => $"Invalid input: {result.ErrorReason}",
        InteractionCommandError.BadArgs => "Wrong number of arguments.",
        InteractionCommandError.Exception => "⚠️ Something went wrong. The error has been logged.",
        _ => $"⚠️ {result.ErrorReason}",
    };

    if (result is ExecuteResult { Exception: { } ex })
        logger.LogError(ex, "Command {Command} failed", command?.Name);

    if (context.Interaction.HasResponded)
        await context.Interaction.FollowupAsync(message, ephemeral: true);
    else
        await context.Interaction.RespondAsync(message, ephemeral: true);
};
```

## API errors

```csharp
try
{
    await user.SendMessageAsync("Hello");
}
catch (Discord.Net.HttpException ex) when (ex.DiscordCode == DiscordErrorCode.CannotSendMessageToUser)
{
    // DMs closed: expected
}
catch (Discord.Net.HttpException ex)
{
    logger.LogWarning("Discord API error {Status} / {Code}: {Reason}", ex.HttpCode, ex.DiscordCode, ex.Reason);
}
```

### Common `DiscordErrorCode`s

| Code | Value | Meaning |
|---|---|---|
| `UnknownChannel` | 10003 | Channel deleted / wrong ID |
| `UnknownMember` | 10007 | Not in the server |
| `UnknownMessage` | 10008 | Message deleted |
| `UnknownInteraction` | 10062 | Responded after 3 s |
| `MissingPermissions` | 50013 | Missing permission or role too low |
| `CannotSendMessageToUser` | 50007 | DMs closed |
| `InteractionHasAlreadyBeenAcknowledged` | 40060 | Responded twice |

## Logging library errors

All connection problems, rate limits and handler exceptions also appear on `client.Log` and `interactions.Log` with `LogSeverity.Error`/`Warning`. Always subscribe to both ([Logging](39-Logging.md)).

## Exceptions in your own event handlers

Discord.Net catches exceptions thrown from event handlers and logs them, but only if they happen synchronously within the handler task. In fire-and-forget `Task.Run` blocks, catch them yourself:

```csharp
_ = Task.Run(async () =>
{
    try { await WorkAsync(); }
    catch (Exception ex) { logger.LogError(ex, "Background work failed"); }
});
```

## Check first

```csharp
if (!Context.Guild.CurrentUser.GetPermissions((IGuildChannel)Context.Channel).EmbedLinks)
{
    await RespondAsync("I need Embed Links here.", ephemeral: true);
    return;
}
```

## See also
- [Responding to Interactions](10-Responding-to-Interactions.md) · [Logging](39-Logging.md) · [Troubleshooting](../Troubleshooting-and-FAQ.md)
