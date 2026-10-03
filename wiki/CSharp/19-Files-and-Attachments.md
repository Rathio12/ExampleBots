# Files & Attachments

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key types** | `FileAttachment`, `IAttachment` |
| **Used in** | [03-expert AuditEventHandlers.cs](../../csharp/03-expert/src/ExpertBot/Services/AuditEventHandlers.cs) (bulk-delete transcripts) |

## Sending files

```csharp
// From disk
await channel.SendFileAsync("images/cat.png", "Look at this cat");

// From a stream with a custom name
using var stream = File.OpenRead("images/cat.png");
await channel.SendFileAsync(new FileAttachment(stream, "cat.png", description: "A cat", isSpoiler: false));

// Several files
await channel.SendFilesAsync([new FileAttachment("a.png"), new FileAttachment("b.png")], "Two files");

// From memory
using var csv = new MemoryStream(Encoding.UTF8.GetBytes("name,xp\nalice,120\n"));
await channel.SendFileAsync(new FileAttachment(csv, "leaderboard.csv"), "Export:");
```

In a module: `await RespondWithFileAsync(new FileAttachment(stream, "x.png"))` or `FollowupWithFileAsync(...)`.

## Images inside embeds

```csharp
using var logo = File.OpenRead("logo.png");
var embed = new EmbedBuilder().WithTitle("Report").WithThumbnailUrl("attachment://logo.png").Build();
await channel.SendFileAsync(new FileAttachment(logo, "logo.png"), embed: embed);
```

## Receiving attachments

```csharp
[SlashCommand("upload", "Upload a file")]
public async Task UploadAsync(IAttachment file)
{
    if (file.Size > 5_000_000)
    {
        await RespondAsync("Max 5 MB.", ephemeral: true);
        return;
    }
    await DeferAsync();
    using var http = new HttpClient();
    var bytes = await http.GetByteArrayAsync(file.Url);
    await FollowupAsync($"{file.Filename}: {bytes.Length} bytes ({file.ContentType})");
}
```

From messages: `message.Attachments` (`IReadOnlyCollection<IAttachment>`).

## Transcript (expert bot)

```csharp
var transcript = new StringBuilder();
foreach (var m in cached) transcript.AppendLine($"[{m.Timestamp:O}] {m.Author.Username}: {m.Content}");
using var stream = new MemoryStream(Encoding.UTF8.GetBytes(transcript.ToString()));
await logChannel.SendFileAsync(new FileAttachment(stream, $"deleted-messages-{channelId}.txt"), embed: summary);
```

## Limits

Upload size depends on the server's boost tier (10 MB without boosts), and a message holds at most 10 files.

## See also
- [Embeds](11-Embeds.md) · [Sending Messages](16-Sending-Messages.md)
