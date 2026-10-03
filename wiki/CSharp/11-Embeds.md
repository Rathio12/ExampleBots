# Embeds

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[C# portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key class** | `EmbedBuilder` |
| **Limits** | 10 per message, 6,000 characters total, 25 fields |
| **Used in** | [02-enhanced GeneralModule.cs](../../csharp/02-enhanced/Modules/GeneralModule.cs) |

## Every embed field

```csharp
var embed = new EmbedBuilder()
    .WithTitle("Title")                                       // 256
    .WithUrl("https://docs.discordnet.dev")
    .WithAuthor("Author", "https://i.imgur.com/AfFp7pu.png", "https://example.com")
    .WithDescription("Supports **Markdown** and <@123>")      // 4,096
    .WithColor(new Color(0x5865F2))                           // or Color.Blue
    .WithThumbnailUrl("https://i.imgur.com/AfFp7pu.png")
    .AddField("Regular field", "Full width")
    .AddField("Inline 1", "Side by side", inline: true)
    .AddField("Inline 2", "Side by side", inline: true)
    .WithImageUrl("https://i.imgur.com/AfFp7pu.png")
    .WithFooter("Footer", "https://i.imgur.com/AfFp7pu.png")
    .WithCurrentTimestamp()                                   // or WithTimestamp(DateTimeOffset)
    .Build();

await RespondAsync(embed: embed);
```

`AddField` accepts any object for the value (`AddField("Members", guild.MemberCount)`); it's converted with `ToString()`.

## Colours

```csharp
new Color(0xED4245);
new Color(255, 0, 0);
Color.Green;
```

## Author from a user

```csharp
embed.WithAuthor(Context.User);    // extension: name + avatar
```

## Truncating user content

```csharp
static string Truncate(string? text, int max = 1024) =>
    string.IsNullOrEmpty(text) ? "" : text.Length <= max ? text : text[..(max - 1)] + "…";

embed.AddField("Content", Truncate(message.Content) is { Length: > 0 } t ? t : "*empty*");
```

## Timestamps

```csharp
embed.AddField("Joined", $"<t:{member.JoinedAt?.ToUnixTimeSeconds()}:R>");
// or TimestampTag.FromDateTimeOffset(member.JoinedAt!.Value, TimestampTagStyles.Relative)
```

## Local images

```csharp
using var stream = File.OpenRead("chart.png");
var embed = new EmbedBuilder().WithImageUrl("attachment://chart.png").Build();
await Context.Channel.SendFileAsync(new FileAttachment(stream, "chart.png"), embed: embed);
```

## Editing an existing embed

```csharp
var updated = message.Embeds.First().ToEmbedBuilder().WithColor(Color.Red).WithFooter("Closed").Build();
await ((IUserMessage)message).ModifyAsync(m => m.Embed = updated);
```

## Several embeds

```csharp
await RespondAsync(embeds: [embedA, embedB]);
```

## Limits enforced by the builder

`EmbedBuilder.Build()` throws `ArgumentException` when a limit is exceeded (title over 256, more than 25 fields, …). That's handy, because you find out before calling Discord.

## See also
- [Components V2](15-Components-V2.md) · [Files & Attachments](19-Files-and-Attachments.md) · [Embeds & Messages](../Embeds-and-Messages.md)
