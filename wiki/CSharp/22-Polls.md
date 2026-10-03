# Polls

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key types** | `PollProperties`, `PollMediaProperties`, `IUserMessage.Poll`, `EndPollAsync` |
| **Intents** | `GuildMessagePolls` (vote events) |

## Creating a poll

```csharp
var poll = new PollProperties
{
    Question = new PollMediaProperties { Text = "What should we play tonight?" },
    Answers =
    [
        new PollMediaProperties { Text = "Minecraft", Emoji = new Emoji("⛏️") },
        new PollMediaProperties { Text = "Valorant", Emoji = new Emoji("🔫") },
        new PollMediaProperties { Text = "Among Us", Emoji = new Emoji("🚀") },
    ],
    Duration = 24,                // hours (1 to 768)
    AllowMultiselect = false,
    LayoutType = PollLayout.Default,
};

await RespondAsync(poll: poll);
// or: await channel.SendMessageAsync(poll: poll);
```

| Field | Limit |
|---|---|
| Question | 300 characters |
| Answers | up to 10, each 55 characters |

## Reading results

```csharp
var message = (IUserMessage)await channel.GetMessageAsync(messageId);
if (message.Poll is { } p)
{
    foreach (var answer in p.Answers)
        Console.WriteLine(answer.PollMedia.Text);
    foreach (var count in p.Results?.AnswerCounts ?? [])
        Console.WriteLine($"Answer {count.AnswerId}: {count.Count} votes");
}

var voters = await message.GetPollAnswerVotersAsync(answerId: 1).FlattenAsync();
```

## Ending early

```csharp
await message.EndPollAsync(null);    // only for polls created by the bot (the argument is RequestOptions)
```

## Vote events

```csharp
client.PollVoteAdded += (user, channel, message, guild, answerId) =>
{
    Console.WriteLine($"{user.Id} voted for answer {answerId}");
    return Task.CompletedTask;
};
client.PollVoteRemoved += (user, channel, message, guild, answerId) => Task.CompletedTask;
```

## Native vs button polls

| | Native poll | Button poll (Enhanced bot) |
|---|---|---|
| Setup | `PollProperties` | Module + store |
| Survives restarts | ✅ | Needs a database |
| Custom rules | ❌ | ✅ |

## See also
- [Buttons](12-Buttons.md) · [Sending Messages](16-Sending-Messages.md)
