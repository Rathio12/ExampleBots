# Channels

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Server-FF9F0A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key types** | `SocketTextChannel`, `SocketVoiceChannel`, `SocketCategoryChannel`, `SocketForumChannel`, `ChannelType` |
| **Permission** | Manage Channels |
| **Used in** | [02-enhanced StatusUpdater.cs](../../csharp/02-enhanced/Services/StatusUpdater.cs) (status rename) |

## Getting channels

```csharp
var text = Context.Guild.GetTextChannel(channelId);
var voice = Context.Guild.GetVoiceChannel(channelId);
var any = Context.Client.GetChannel(channelId);                 // any guild, may be null
var byName = Context.Guild.TextChannels.FirstOrDefault(c => c.Name == "general");

Context.Guild.TextChannels; Context.Guild.VoiceChannels; Context.Guild.CategoryChannels; Context.Guild.ForumChannels;
```

Use pattern matching to check types: `if (channel is ITextChannel text) { … }`.

## Creating channels

```csharp
var category = await Context.Guild.CreateCategoryChannelAsync("Support");

var helpDesk = await Context.Guild.CreateTextChannelAsync("help-desk", p =>
{
    p.CategoryId = category.Id;
    p.Topic = "Ask for help here";
    p.SlowModeInterval = 10;
    p.PermissionOverwrites = new[]
    {
        new Overwrite(Context.Guild.EveryoneRole.Id, PermissionTarget.Role, new OverwritePermissions(sendMessages: PermValue.Deny)),
        new Overwrite(staffRoleId, PermissionTarget.Role, new OverwritePermissions(sendMessages: PermValue.Allow)),
    };
});

var lounge = await Context.Guild.CreateVoiceChannelAsync("Lounge", p =>
{
    p.CategoryId = category.Id;
    p.UserLimit = 10;
    p.Bitrate = 64_000;
});

var forum = await Context.Guild.CreateForumChannelAsync("Bug reports", p => p.CategoryId = category.Id);
```

## Editing

```csharp
await helpDesk.ModifyAsync(p => p.Name = "new-name");       // ⚠ 2 renames per 10 minutes per channel
await helpDesk.ModifyAsync(p =>
{
    p.Topic = "New topic";
    p.SlowModeInterval = 5;
    p.IsNsfw = false;
    p.CategoryId = otherCategoryId;
    p.Position = 0;
});
await lounge.ModifyAsync(p => p.UserLimit = 5);
```

## Deleting

```csharp
await helpDesk.DeleteAsync(new RequestOptions { AuditLogReason = "Cleanup" });
```

## Status channel (Enhanced bot)

```csharp
var name = status.Online ? $"🟢 Players: {status.Players}/{status.MaxPlayers}" : "🔴 Server offline";
if (name != _lastChannelName)                               // only rename when it changes (rate limit)
{
    await channel.ModifyAsync(p => p.Name = name, new RequestOptions { AuditLogReason = "Player count update" });
    _lastChannelName = name;
}
```

## Channel events

```csharp
client.ChannelCreated += channel => Task.CompletedTask;
client.ChannelUpdated += (before, after) => Task.CompletedTask;
client.ChannelDestroyed += channel => Task.CompletedTask;
```

## See also
- [Permissions](26-Permissions.md) · [Threads & Forums](20-Threads-and-Forums.md) · [Voice](31-Voice.md)
