# Sending Messages

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[C# portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key APIs** | `IMessageChannel.SendMessageAsync`, `MessageReference`, `AllowedMentions`, `Format`, `IUser.SendMessageAsync` |
| **Limits** | 2,000 characters, 10 embeds, 10 files |

## Sending to a channel

```csharp
if (client.GetChannel(channelId) is not IMessageChannel channel) return;

await channel.SendMessageAsync("Hello!");
await channel.SendMessageAsync(
    text: "With extras",
    embed: embed,
    components: components,
    allowedMentions: AllowedMentions.None,
    flags: MessageFlags.SuppressNotification);   // silent
```

In a module, the current channel is `Context.Channel`.

## Replying to a message

```csharp
await channel.SendMessageAsync("Got it!", messageReference: new MessageReference(message.Id));

// Or the extension on IUserMessage
await userMessage.ReplyAsync("Got it!", allowedMentions: AllowedMentions.None);
```

## Direct messages

```csharp
try
{
    await user.SendMessageAsync("Hi from the bot!");
}
catch (Discord.Net.HttpException ex) when (ex.DiscordCode == DiscordErrorCode.CannotSendMessageToUser)
{
    // DMs closed
}
```

## Mentions

| Mention | Code |
|---|---|
| User | `user.Mention` or `$"<@{user.Id}>"` |
| Role | `role.Mention` |
| Channel | `$"<#{channel.Id}>"` (or `channel.Mention` on guild channels) |
| Slash command | `$"</ping:{commandId}>"` |
| Custom emoji | `emote.ToString()` |

### AllowedMentions

```csharp
AllowedMentions.None                                          // ping nobody
AllowedMentions.All
new AllowedMentions(AllowedMentionTypes.Users)                // users only
new AllowedMentions { UserIds = [member.Id] }                 // exactly this user
new AllowedMentions { MentionRepliedUser = false }
```

Always use `AllowedMentions.None` for user-provided content.

## Formatting helpers

```csharp
Format.Bold("important");                    // **important**
Format.Italics("x"); Format.Underline("x"); Format.Strikethrough("x"); Format.Spoiler("x");
Format.Code("inline");                       // `inline`
Format.Code("var x = 1;", "cs");             // ```cs …```
Format.Quote("quoted");
Format.Url("docs", "https://docs.discordnet.dev");
Format.Sanitize(userText);                   // escape Markdown in user input
TimestampTag.FromDateTimeOffset(DateTimeOffset.UtcNow, TimestampTagStyles.Relative).ToString();
```

## Long text

```csharp
foreach (var chunk in text.Chunk(2000))
    await channel.SendMessageAsync(new string(chunk));
```

Or send a file ([Files](19-Files-and-Attachments.md)).

## Typing indicator

```csharp
using (channel.EnterTypingState())
{
    await SlowWorkAsync();
}
await channel.SendMessageAsync("Done");
```

## See also
- [Embeds](11-Embeds.md) · [Editing, Deleting & Pinning](17-Editing-Deleting-Pinning.md)
