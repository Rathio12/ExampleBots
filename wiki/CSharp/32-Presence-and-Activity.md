# Presence & Activity

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[C# portal](README.md) › Events</sub>

| | |
|---|---|
| **Key APIs** | `SetGameAsync`, `SetActivityAsync`, `SetStatusAsync`, `SetCustomStatusAsync`, `Game`, `ActivityType`, `UserStatus` |
| **Used in** | [02-enhanced StatusUpdater.cs](../../csharp/02-enhanced/Services/StatusUpdater.cs) · [03-expert DiscordBotService.cs](../../csharp/03-expert/src/ExpertBot/Services/DiscordBotService.cs) |

## Setting the activity

```csharp
await client.SetGameAsync("Minecraft");                                           // Playing Minecraft
await client.SetGameAsync("12/100 players", type: ActivityType.Watching);
await client.SetActivityAsync(new Game("/help", ActivityType.Listening));
await client.SetActivityAsync(new Game("the tournament", ActivityType.Competing));
await client.SetGameAsync("Live coding", "https://twitch.tv/yourchannel", ActivityType.Streaming);
await client.SetCustomStatusAsync("🛠️ Under maintenance");                        // custom status text
```

## Status

```csharp
await client.SetStatusAsync(UserStatus.Idle);      // Online, Idle, DoNotDisturb, Invisible
```

## Setting it once connected

Presence is part of the gateway session, so set it in `Ready`:

```csharp
client.Ready += async () => await client.SetActivityAsync(new Game("/help", ActivityType.Listening));
```

Discord.Net re-sends the last presence after a reconnect.

## Rotating status

```csharp
private static readonly Func<DiscordSocketClient, string>[] Statuses =
[
    c => $"{c.Guilds.Count} servers",
    _ => "/help",
];

private async Task RotateAsync(CancellationToken token)
{
    using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
    var index = 0;
    while (await timer.WaitForNextTickAsync(token))
        await client.SetGameAsync(Statuses[index++ % Statuses.Length](client), type: ActivityType.Watching);
}
```

## Live game-server data (Enhanced bot)

```csharp
var label = status.Online ? $"{status.Players}/{status.MaxPlayers} players" : "server offline";
await client.SetActivityAsync(new Game(label, ActivityType.Watching));
```

## See also
- [Background Tasks](35-Background-Tasks.md) · [Use-Case Recipes → Game-server player count](../Use-Case-Recipes.md#game-server-player-count)
