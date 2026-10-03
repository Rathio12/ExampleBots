# Client & Intents

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Getting_started-607D8B?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[C# portal](README.md) › Getting started</sub>

| | |
|---|---|
| **Key classes** | `DiscordSocketClient`, `DiscordSocketConfig`, `GatewayIntents`, `LogMessage` |
| **Used in** | [01-basic/Program.cs](../../csharp/01-basic/Program.cs) · [03-expert Program.cs](../../csharp/03-expert/src/ExpertBot/Program.cs) |

## Creating the client

```csharp
var config = new DiscordSocketConfig
{
    GatewayIntents = GatewayIntents.Guilds | GatewayIntents.GuildMembers | GatewayIntents.GuildMessages,
    MessageCacheSize = 200,          // messages cached per channel (0 = off, the default)
    AlwaysDownloadUsers = true,      // download all members on connect (needs GuildMembers)
    LogLevel = LogSeverity.Info,
    UseInteractionSnowflakeDate = false,
};
var client = new DiscordSocketClient(config);

await client.LoginAsync(TokenType.Bot, token);
await client.StartAsync();
```

### Config options

| Option | Purpose |
|---|---|
| `GatewayIntents` | Events to receive (**required for anything beyond defaults**) |
| `MessageCacheSize` | Per-channel message cache for edit/delete events |
| `AlwaysDownloadUsers` | Fill the member cache at startup |
| `LogLevel` | Minimum severity raised on `Log` |
| `DefaultRetryMode` | REST retry behaviour on rate limits/timeouts |
| `LogGatewayIntentWarnings` | Warn when handlers need intents you didn't request |
| `TotalShards` | Sharding ([article](40-Sharding.md)) |

## Intents

| `GatewayIntents.` | Privileged | Events |
|---|---|---|
| `Guilds` | | Guilds, channels, roles, threads |
| `GuildMembers` | ✅ | `UserJoined`, `UserLeft`, `GuildMemberUpdated`, member cache |
| `GuildBans` (= moderation) | | `UserBanned`, `UserUnbanned`, audit-log events |
| `GuildEmojis` | | Emoji/sticker updates |
| `GuildIntegrations`, `GuildWebhooks`, `GuildInvites` | | Those events |
| `GuildVoiceStates` | | `UserVoiceStateUpdated` (**needed for voice**) |
| `GuildPresences` | ✅ | `PresenceUpdated` |
| `GuildMessages` | | Message events in guilds |
| `GuildMessageReactions` | | Reactions |
| `GuildMessageTyping` | | Typing |
| `DirectMessages` (+ reactions, typing) | | DM events |
| `MessageContent` | ✅ | Message content |
| `GuildScheduledEvents` | | Scheduled events |
| `AutoModerationConfiguration`, `AutoModerationActionExecution` | | AutoMod |
| `AllUnprivileged` | | Shortcut: everything not privileged |
| `All` | | Everything (needs all privileged switches) |

```csharp
GatewayIntents = GatewayIntents.AllUnprivileged | GatewayIntents.MessageContent;
GatewayIntents = GatewayIntents.AllUnprivileged & ~GatewayIntents.GuildInvites;   // remove one
```

Privileged intents must also be enabled in the Developer Portal, or the gateway closes with code 4014.

## Logging

Discord.Net reports everything through the `Log` event:

```csharp
client.Log += message =>
{
    Console.WriteLine($"{DateTime.Now:HH:mm:ss} [{message.Severity}] {message.Source}: {message.Message} {message.Exception}");
    return Task.CompletedTask;
};
```

Bridge it to `ILogger` in larger apps ([Logging](39-Logging.md)).

## Ready and connection events

```csharp
client.Ready += () => { Console.WriteLine($"{client.CurrentUser} is in {client.Guilds.Count} guilds"); return Task.CompletedTask; };
client.Connected += () => Task.CompletedTask;
client.Disconnected += ex => { Console.WriteLine($"Disconnected: {ex.Message}"); return Task.CompletedTask; };
```

`Ready` fires again after reconnects. Use a flag if something must run only once (command registration).

## Useful client members

| Member | Meaning |
|---|---|
| `client.CurrentUser` | The bot user |
| `client.Guilds` | Cached guilds |
| `client.GetGuild(id)`, `GetChannel(id)`, `GetUser(id)` | Cache lookups (may be null) |
| `await client.GetUserAsync(id)` | Cache or REST |
| `client.Rest` | `DiscordSocketRestClient` for REST-only calls |
| `client.Latency` | Gateway latency in ms |
| `client.ConnectionState` | `Connected`, `Connecting`, … |

## Shutting down

```csharp
await client.StopAsync();
await client.LogoutAsync();
client.Dispose();
```

With the Generic Host, do this in `IHostedService.StopAsync` ([Project Structure](38-Project-Structure.md)).

## See also
- [Events](28-Events.md) · [Configuration & .env](03-Configuration-and-Env.md) · [Events & Intents](../Events-and-Intents.md)
