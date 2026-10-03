# Sharding

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square)

<sub>[C# portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key types** | `DiscordShardedClient`, `ShardedInteractionContext`, `DiscordSocketConfig.TotalShards` |
| **When** | Required at 2,500 servers |

## Switching to the sharded client

```csharp
var client = new DiscordShardedClient(new DiscordSocketConfig
{
    GatewayIntents = GatewayIntents.Guilds,
    // TotalShards = 4,     // optional: otherwise Discord's recommendation is used
});

var interactions = new InteractionService(client.Rest);

client.ShardReady += async shard => Console.WriteLine($"Shard {shard.ShardId} ready ({shard.Guilds.Count} guilds)");
client.InteractionCreated += async interaction =>
{
    var context = new ShardedInteractionContext(client, interaction);
    await interactions.ExecuteCommandAsync(context, services);
};

await client.LoginAsync(TokenType.Bot, token);
await client.StartAsync();
```

Modules then derive from `InteractionModuleBase<ShardedInteractionContext>`.

## Differences

| `DiscordSocketClient` | `DiscordShardedClient` |
|---|---|
| `Ready` | `ShardReady` (per shard) |
| `client.Latency` | `client.Shards.Select(s => s.Latency)` |
| `SocketInteractionContext` | `ShardedInteractionContext` |
| One connection | `client.Shards` (one `DiscordSocketClient` each) |

`client.GetGuild(id)`, `GetUser(id)` and events like `MessageReceived` still work across all shards.

## Registering commands once

Register commands in the first `ShardReady` only, using a flag, so you don't register N times.

## See also
- [How Discord Bots Work → Sharding](../How-Discord-Bots-Work.md#sharding) · [Deployment](42-Deployment.md)
