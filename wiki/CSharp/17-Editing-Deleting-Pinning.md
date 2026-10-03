# Editing, Deleting & Pinning

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[C# portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key APIs** | `GetMessageAsync`, `GetMessagesAsync`, `ModifyAsync`, `DeleteAsync`, `ITextChannel.DeleteMessagesAsync`, `PinAsync` |
| **Used in** | [03-expert ModerationModule.cs](../../csharp/03-expert/src/ExpertBot/Modules/ModerationModule.cs) (`/purge`) |

## Fetching messages

```csharp
var message = await channel.GetMessageAsync(messageId);               // cache, then REST
var recent = await channel.GetMessagesAsync(50).FlattenAsync();       // newest first, max 100 per page
var older = await channel.GetMessagesAsync(message, Direction.Before, 20).FlattenAsync();
```

`GetMessagesAsync` returns pages (`IAsyncEnumerable<IReadOnlyCollection<IMessage>>`), and `FlattenAsync()` merges them.

## Editing (own messages)

```csharp
if (message is IUserMessage own)
{
    await own.ModifyAsync(m =>
    {
        m.Content = "New content";
        m.Embed = newEmbed;
        m.Components = new ComponentBuilder().Build();   // remove components
    });
}
```

## Deleting

```csharp
await message.DeleteAsync();
await message.DeleteAsync(new RequestOptions { AuditLogReason = "Cleanup" });

// Self-destruct
var sent = await channel.SendMessageAsync("Temporary");
_ = Task.Delay(10_000).ContinueWith(_ => sent.DeleteAsync());
```

## Bulk delete

```csharp
var messages = await channel.GetMessagesAsync(100).FlattenAsync();
var deletable = messages
    .Where(m => m.Author.Id == user.Id)                                   // optional filter
    .Where(m => DateTimeOffset.UtcNow - m.Timestamp < TimeSpan.FromDays(14))
    .ToList();
await ((ITextChannel)channel).DeleteMessagesAsync(deletable);
```

Bulk delete accepts 2–100 messages younger than 14 days. Needs **Manage Messages**.

## Pinning

```csharp
await ((IUserMessage)message).PinAsync();
await ((IUserMessage)message).UnpinAsync();
var pinned = await channel.GetPinnedMessagesAsync();
```

## Crossposting (announcement channels)

```csharp
if (channel is INewsChannel) await ((IUserMessage)message).CrosspostAsync();
```

## Handling missing messages

```csharp
try { await message.DeleteAsync(); }
catch (Discord.Net.HttpException ex) when (ex.DiscordCode == DiscordErrorCode.UnknownMessage) { }
```

## See also
- [Sending Messages](16-Sending-Messages.md) · [Moderation](25-Moderation.md)
