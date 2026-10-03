// =============================================================================
//  Expert Discord Bot — C# (Discord.Net 3.x + .NET Generic Host)
// -----------------------------------------------------------------------------
//  The Generic Host gives us dependency injection, configuration, ILogger and
//  hosted services (long-running background work) with graceful shutdown on
//  Ctrl+C / SIGTERM — the same foundation ASP.NET Core apps use.
// =============================================================================
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using ExpertBot.Configuration;
using ExpertBot.Data;
using ExpertBot.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

DotEnv.Load();

var builder = Host.CreateApplicationBuilder(args);

// Options are read from environment variables (and .env via DotEnv above).
var options = BotOptions.FromEnvironment();
builder.Services.AddSingleton(options);

builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(o =>
{
    o.SingleLine = true;
    o.TimestampFormat = "HH:mm:ss ";
});
if (options.JsonLogs) builder.Logging.ClearProviders().AddJsonConsole();
builder.Logging.SetMinimumLevel(options.LogLevel);

// --- Discord ---------------------------------------------------------------------
builder.Services.AddSingleton(new DiscordSocketConfig
{
    GatewayIntents =
        GatewayIntents.Guilds |           // channels, roles, slash commands
        GatewayIntents.GuildMembers |     // privileged: joins, leaves, role changes
        GatewayIntents.GuildBans |        // ban/unban events (a.k.a. GuildModeration)
        GatewayIntents.GuildMessages |    // XP for chatting, edit/delete logs
        GatewayIntents.MessageContent |   // privileged: content in edit/delete logs
        GatewayIntents.GuildVoiceStates,  // voice join/leave/move logs
    MessageCacheSize = 200,               // messages cached per channel (for edit/delete logs)
    AlwaysDownloadUsers = true,           // cache members so updates have a "before" state
    LogLevel = LogSeverity.Info,
});
builder.Services.AddSingleton<DiscordSocketClient>();
builder.Services.AddSingleton(sp => new InteractionService(
    sp.GetRequiredService<DiscordSocketClient>(),
    new InteractionServiceConfig { UseCompiledLambda = true, LogLevel = LogSeverity.Info }));

// --- Data ------------------------------------------------------------------------
builder.Services.AddSingleton(_ => new Database($"Data Source={options.DatabasePath}"));
builder.Services.AddSingleton<LevelRepository>();
builder.Services.AddSingleton<WarningRepository>();
builder.Services.AddSingleton<ReminderRepository>();
builder.Services.AddSingleton<TagRepository>();
builder.Services.AddSingleton<SettingsRepository>();

// --- Services --------------------------------------------------------------------
builder.Services.AddSingleton<LevelingService>();
builder.Services.AddSingleton<ModLogService>();
builder.Services.AddSingleton<AuditLogService>();
builder.Services.AddSingleton<AuditEventHandlers>();

// Hosted services start with the host and stop gracefully on shutdown.
builder.Services.AddHostedService<DiscordBotService>();
builder.Services.AddHostedService<ReminderService>();

await builder.Build().RunAsync();
