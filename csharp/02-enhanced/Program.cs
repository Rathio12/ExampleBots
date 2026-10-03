// =============================================================================
//  Enhanced Discord Bot — C# (Discord.Net 3.x)
// -----------------------------------------------------------------------------
//  Uses Discord.Net's InteractionService: every command is a method with an
//  attribute inside a "module" class (see Modules/). Dependencies are provided
//  through Microsoft's dependency injection container.
// =============================================================================
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using EnhancedBot.Config;
using EnhancedBot.Services;
using Microsoft.Extensions.DependencyInjection;

DotEnv.Load();
var config = BotConfig.FromEnvironment();

// Only request the privileged GuildMembers intent when welcomes are enabled.
// Requesting an intent you haven't enabled in the Developer Portal makes the
// gateway close the connection with "Disallowed intent(s)".
var intents = GatewayIntents.Guilds;
if (config.WelcomeChannelId is not null) intents |= GatewayIntents.GuildMembers;

// The DI container builds and wires every service exactly once.
await using var services = new ServiceCollection()
    .AddSingleton(config)
    .AddSingleton(new DiscordSocketConfig { GatewayIntents = intents, LogLevel = LogSeverity.Info })
    .AddSingleton<DiscordSocketClient>()
    .AddSingleton(sp => new InteractionService(
        sp.GetRequiredService<DiscordSocketClient>(),
        new InteractionServiceConfig { LogLevel = LogSeverity.Info, UseCompiledLambda = true }))
    .AddSingleton<InteractionHandler>()
    .AddSingleton(new HttpClient { Timeout = TimeSpan.FromSeconds(10) })
    .AddSingleton<MinecraftService>()
    .AddSingleton<StatusUpdater>()
    .AddSingleton<WelcomeService>()
    .AddSingleton<PollStore>()
    .BuildServiceProvider();

var client = services.GetRequiredService<DiscordSocketClient>();
client.Log += Logger.LogAsync;
services.GetRequiredService<InteractionService>().Log += Logger.LogAsync;

await services.GetRequiredService<InteractionHandler>().InitializeAsync();
services.GetRequiredService<WelcomeService>().Initialize();
services.GetRequiredService<StatusUpdater>().Initialize();

await client.LoginAsync(TokenType.Bot, config.Token);
await client.StartAsync();
await Task.Delay(Timeout.Infinite);
