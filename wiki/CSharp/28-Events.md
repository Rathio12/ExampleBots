# Events

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[C# portal](README.md) › Events</sub>

| | |
|---|---|
| **Key types** | `DiscordSocketClient` events, `Cacheable<T, TId>` |
| **Used in** | [03-expert AuditEventHandlers.cs](../../csharp/03-expert/src/ExpertBot/Services/AuditEventHandlers.cs) |

Discord.Net exposes gateway events as C# events of type `Func<…, Task>`.

## Subscribing

```csharp
client.UserJoined += OnUserJoinedAsync;
client.MessageReceived += message => { Console.WriteLine(message.Content); return Task.CompletedTask; };

private async Task OnUserJoinedAsync(SocketGuildUser member) { … }

client.UserJoined -= OnUserJoinedAsync;   // unsubscribe
```

## Don't block the gateway

Handlers run on the gateway task. If one takes long (HTTP, database, audit-log lookups), Discord.Net logs *"A handler is blocking the gateway task"*, and heartbeats can be delayed. Offload slow work:

```csharp
client.MessageReceived += message =>
{
    _ = Task.Run(async () =>
    {
        try { await HandleMessageAsync(message); }
        catch (Exception ex) { logger.LogError(ex, "Message handler failed"); }
    });
    return Task.CompletedTask;
};
```

The expert bot wraps every audit handler with a `Fire(...)` helper that does exactly this. (InteractionService commands already run asynchronously by default.)

## Cacheable

Events about things that may not be cached give you a `Cacheable<T, TId>`:

```csharp
client.MessageDeleted += async (cachedMessage, cachedChannel) =>
{
    Console.WriteLine($"Message {cachedMessage.Id} deleted");
    if (cachedMessage.HasValue)
        Console.WriteLine($"Content: {cachedMessage.Value.Content}");
    var channel = await cachedChannel.GetOrDownloadAsync();
};
```

`HasValue`/`Value` give the cached object, and `GetOrDownloadAsync()` fetches it when possible (a deleted message can't be downloaded).

## Event reference

| Event | Arguments | Intent |
|---|---|---|
| `Ready` | — | — |
| `Log` | `LogMessage` | — |
| `InteractionCreated` | `SocketInteraction` | — |
| `SlashCommandExecuted` / `ButtonExecuted` / `SelectMenuExecuted` / `ModalSubmitted` | interaction | — |
| `JoinedGuild` / `LeftGuild` | `SocketGuild` | Guilds |
| `GuildUpdated` | `before, after` | Guilds |
| `ChannelCreated` / `ChannelDestroyed` | `SocketChannel` | Guilds |
| `ChannelUpdated` | `before, after` | Guilds |
| `RoleCreated` / `RoleDeleted` | `SocketRole` | Guilds |
| `RoleUpdated` | `before, after` | Guilds |
| `ThreadCreated` | `SocketThreadChannel` | Guilds |
| `MessageReceived` | `SocketMessage` | GuildMessages |
| `MessageUpdated` | `Cacheable<IMessage>, SocketMessage, ISocketMessageChannel` | GuildMessages |
| `MessageDeleted` | `Cacheable<IMessage>, Cacheable<IMessageChannel>` | GuildMessages |
| `MessagesBulkDeleted` | `IReadOnlyCollection<Cacheable<IMessage>>, Cacheable<IMessageChannel>` | GuildMessages |
| `ReactionAdded` / `ReactionRemoved` | `Cacheable<IUserMessage>, Cacheable<IMessageChannel>, SocketReaction` | GuildMessageReactions |
| `UserJoined` | `SocketGuildUser` | GuildMembers ✱ |
| `UserLeft` | `SocketGuild, SocketUser` | GuildMembers ✱ |
| `GuildMemberUpdated` | `Cacheable<SocketGuildUser>, SocketGuildUser` | GuildMembers ✱ |
| `PresenceUpdated` | `SocketUser, SocketPresence, SocketPresence` | GuildPresences ✱ |
| `UserBanned` / `UserUnbanned` | `SocketUser, SocketGuild` | GuildBans |
| `AuditLogCreated` | `SocketAuditLogEntry, SocketGuild` | GuildBans |
| `UserVoiceStateUpdated` | `SocketUser, SocketVoiceState, SocketVoiceState` | GuildVoiceStates |
| `InviteCreated` / `InviteDeleted` | invite | GuildInvites |
| `UserIsTyping` | `Cacheable<IUser>, Cacheable<IMessageChannel>` | GuildMessageTyping |
| `PollVoteAdded` | user, channel, message, guild, answerId | GuildMessagePolls |
| `AutoModActionExecuted` | guild, action, data | AutoModerationActionExecution |

✱ privileged.

## Ready fires more than once

`Ready` fires after every reconnect. Guard one-time work:

```csharp
private bool _registered;
client.Ready += async () =>
{
    if (_registered) return;
    _registered = true;
    await interactions.RegisterCommandsGloballyAsync();
};
```

## See also
- [Message Events](29-Message-Events.md) · [Member Events](30-Member-Events.md) · [Events & Intents](../Events-and-Intents.md)
