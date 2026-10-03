# Project Structure

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key types** | `Host.CreateApplicationBuilder`, `IHostedService`, `BackgroundService`, `IServiceCollection` |
| **Used in** | [03-expert/src/ExpertBot/](../../csharp/03-expert/src/ExpertBot) |

## Recommended layout

```
ExpertBot.sln
src/ExpertBot/
├── Program.cs              host builder: DI registrations, logging, hosted services
├── Configuration/          options records, .env loader
├── Data/                   database, migrations, repositories
├── Services/
│   ├── DiscordBotService.cs   IHostedService: login, register commands, route interactions
│   ├── ReminderService.cs     BackgroundService
│   └── …                      leveling, mod log, audit log
├── Modules/                InteractionService modules (commands, components, modals)
└── Utils/                  pure helpers (easy to unit test)
tests/ExpertBot.Tests/      xUnit
```

## Program.cs with the Generic Host

```csharp
DotEnv.Load();
var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddSingleton(BotOptions.FromEnvironment());

builder.Services.AddSingleton(new DiscordSocketConfig
{
    GatewayIntents = GatewayIntents.Guilds | GatewayIntents.GuildMembers | GatewayIntents.GuildMessages,
    AlwaysDownloadUsers = true,
});
builder.Services.AddSingleton<DiscordSocketClient>();
builder.Services.AddSingleton(sp => new InteractionService(sp.GetRequiredService<DiscordSocketClient>()));

builder.Services.AddSingleton(_ => new Database("Data Source=data/bot.db"));
builder.Services.AddSingleton<WarningRepository>();

builder.Services.AddHostedService<DiscordBotService>();
builder.Services.AddHostedService<ReminderService>();

await builder.Build().RunAsync();      // handles Ctrl+C / SIGTERM gracefully
```

## The bot as a hosted service

```csharp
public sealed class DiscordBotService(
    DiscordSocketClient client, InteractionService interactions, IServiceProvider services,
    BotOptions options, ILogger<DiscordBotService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        client.Log += msg => { logger.LogInformation("{Message}", msg.ToString()); return Task.CompletedTask; };
        await interactions.AddModulesAsync(typeof(DiscordBotService).Assembly, services);

        client.Ready += () => options.GuildId is { } id
            ? interactions.RegisterCommandsToGuildAsync(id)
            : interactions.RegisterCommandsGloballyAsync();

        client.InteractionCreated += i => interactions.ExecuteCommandAsync(new SocketInteractionContext(client, i), services);

        await client.LoginAsync(TokenType.Bot, options.Token);
        await client.StartAsync();
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        await client.StopAsync();
        await client.LogoutAsync();
    }
}
```

(The `Ready` handler above registers on every reconnect. The expert bot adds a `_registered` flag.)

## Modules get dependencies by constructor

```csharp
public sealed class ModerationModule(WarningRepository warnings, ModLogService modlog)
    : InteractionModuleBase<SocketInteractionContext>
{
    [SlashCommand("warn", "Warn a member")]
    public async Task WarnAsync(SocketGuildUser member, string reason) { … }
}
```

A new module instance is created per interaction. Keep state in singleton services, not in module fields.

## Service lifetimes

| Lifetime | Use for |
|---|---|
| Singleton | The client, InteractionService, repositories, caches, HTTP clients |
| Scoped | Per-interaction units of work (e.g. an EF Core `DbContext`). Create a scope per interaction. |
| Transient | Lightweight stateless helpers |

## Without the host (Enhanced bot)

A plain `ServiceCollection` works too:

```csharp
await using var services = new ServiceCollection()
    .AddSingleton(config)
    .AddSingleton<DiscordSocketClient>()
    .AddSingleton(sp => new InteractionService(sp.GetRequiredService<DiscordSocketClient>()))
    .AddSingleton<InteractionHandler>()
    .BuildServiceProvider();
```

## See also
- [Configuration & .env](03-Configuration-and-Env.md) · [Background Tasks](35-Background-Tasks.md) · [Testing](41-Testing.md)
