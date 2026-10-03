# Message Events

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Events</sub>

| | |
|---|---|
| **Events** | `MessageReceived`, `MessageUpdated`, `MessageDeleted`, `MessagesBulkDeleted` |
| **Intents** | `GuildMessages`, `MessageContent` (privileged) for content |
| **Used in** | [03-expert LevelingService.cs](../../csharp/03-expert/src/ExpertBot/Services/LevelingService.cs) · [AuditEventHandlers.cs](../../csharp/03-expert/src/ExpertBot/Services/AuditEventHandlers.cs) |

## New messages

```csharp
client.MessageReceived += async message =>
{
    // Ignore system messages and bots (including ourselves)
    if (message is not SocketUserMessage { Author.IsBot: false } userMessage) return;
    if (userMessage.Channel is not SocketGuildChannel) return;          // guild messages only

    if (userMessage.Content.Equals("hello", StringComparison.OrdinalIgnoreCase))
        await userMessage.ReplyAsync("Hi there!", allowedMentions: AllowedMentions.None);
};
```

Without `GatewayIntents.MessageContent`, `Content` is empty except for messages mentioning the bot, DMs, and the bot's own messages.

## Useful properties

| Property | Meaning |
|---|---|
| `Content`, `CleanContent` | Text (`CleanContent` resolves mentions) |
| `Author`, `Channel` | Who and where |
| `MentionedUsers`, `MentionedRoles`, `MentionedEveryone` | Mentions |
| `Attachments`, `Embeds`, `Stickers` | Media |
| `Reference` / `ReferencedMessage` | Reply target |
| `Timestamp`, `EditedTimestamp` | Times |
| `GetJumpUrl()` | Link to the message |
| `Source` | `User`, `Bot`, `Webhook` or `System` |

## Prefix commands

Discord.Net includes `Discord.Commands` (`CommandService`) for prefix commands:

```csharp
var commands = new CommandService();
await commands.AddModulesAsync(Assembly.GetEntryAssembly(), services);

client.MessageReceived += async raw =>
{
    if (raw is not SocketUserMessage message || message.Author.IsBot) return;
    var argPos = 0;
    if (!message.HasCharPrefix('!', ref argPos)) return;
    await commands.ExecuteAsync(new SocketCommandContext(client, message), argPos, services);
};

public sealed class PrefixModule : ModuleBase<SocketCommandContext>
{
    [Command("ping")]
    public Task PingAsync() => ReplyAsync("Pong!");
}
```

Slash commands are recommended for new bots: no privileged intent and built-in validation.

## Edits

```csharp
client.MessageUpdated += async (before, after, channel) =>
{
    if (after.Author.IsBot || after.EditedTimestamp is null) return;     // link previews also fire updates
    if (before.HasValue && before.Value.Content == after.Content) return;
    var old = before.HasValue ? before.Value.Content : "(not cached)";
    Console.WriteLine($"{after.Author.Username}: {old} → {after.Content}");
};
```

`before` is only available when the message was cached. Set `MessageCacheSize` in the config.

## Deletes

```csharp
client.MessageDeleted += async (cachedMessage, cachedChannel) =>
{
    var text = cachedMessage.HasValue ? cachedMessage.Value.Content : "(not cached)";
    Console.WriteLine($"Message {cachedMessage.Id} deleted: {text}");
};

client.MessagesBulkDeleted += async (messages, channel) =>
{
    var cached = messages.Count(m => m.HasValue);
    Console.WriteLine($"{messages.Count} messages bulk-deleted ({cached} cached)");
};
```

## XP for chatting (expert bot)

```csharp
client.MessageReceived += message =>
{
    _ = Task.Run(() => HandleMessageAsync(message));      // database work off the gateway thread
    return Task.CompletedTask;
};
```

## See also
- [Events](28-Events.md) · [Sending Messages](16-Sending-Messages.md) · [Audit Log System](../Audit-Log-System.md)
