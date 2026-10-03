using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using ExpertBot.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ExpertBot.Services;

/// <summary>
/// The main hosted service: connects to Discord, registers commands and routes
/// interactions to the modules. StopAsync runs on Ctrl+C / SIGTERM for a clean logout.
/// </summary>
public sealed class DiscordBotService(
    DiscordSocketClient client,
    InteractionService interactions,
    IServiceProvider services,
    BotOptions options,
    LevelingService leveling,
    AuditEventHandlers audit,
    ILogger<DiscordBotService> logger) : IHostedService
{
    private bool _registered;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        client.Log += LogAsync;
        interactions.Log += LogAsync;

        // Discover every module (class deriving from InteractionModuleBase) in this assembly.
        await interactions.AddModulesAsync(typeof(DiscordBotService).Assembly, services);

        client.Ready += OnReadyAsync;
        client.InteractionCreated += OnInteractionAsync;
        interactions.InteractionExecuted += OnInteractionExecutedAsync;

        leveling.Attach();
        audit.Attach();

        await client.LoginAsync(TokenType.Bot, options.Token);
        await client.StartAsync();
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Shutting down…");
        await client.StopAsync();
        await client.LogoutAsync();
    }

    private async Task OnReadyAsync()
    {
        logger.LogInformation("Logged in as {User} — {Count} guild(s)", client.CurrentUser, client.Guilds.Count);
        await client.SetActivityAsync(new Game("/help", ActivityType.Listening));

        if (_registered) return; // Ready fires again after every reconnect
        _registered = true;

        if (options.GuildId is { } guildId)
            await interactions.RegisterCommandsToGuildAsync(guildId);
        else
            await interactions.RegisterCommandsGloballyAsync();

        logger.LogInformation("Registered {Slash} slash commands and {Menus} context menus",
            interactions.SlashCommands.Count, interactions.ContextCommands.Count);
    }

    private async Task OnInteractionAsync(SocketInteraction interaction)
    {
        try
        {
            await interactions.ExecuteCommandAsync(new SocketInteractionContext(client, interaction), services);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to execute interaction");
        }
    }

    /// <summary>Failed preconditions and exceptions from any command end up here.</summary>
    private async Task OnInteractionExecutedAsync(ICommandInfo command, IInteractionContext context, IResult result)
    {
        if (result.IsSuccess) return;

        var message = result.Error switch
        {
            InteractionCommandError.UnmetPrecondition => $"🚫 {result.ErrorReason}",
            InteractionCommandError.Exception => "⚠️ Something went wrong. The error has been logged.",
            _ => $"⚠️ {result.ErrorReason}",
        };
        if (result.Error == InteractionCommandError.Exception)
            logger.LogError("Command {Command} failed: {Reason}", command?.Name, result.ErrorReason);

        if (context.Interaction.HasResponded) await context.Interaction.FollowupAsync(message, ephemeral: true);
        else await context.Interaction.RespondAsync(message, ephemeral: true);
    }

    private Task LogAsync(LogMessage message)
    {
        var level = message.Severity switch
        {
            LogSeverity.Critical => LogLevel.Critical,
            LogSeverity.Error => LogLevel.Error,
            LogSeverity.Warning => LogLevel.Warning,
            LogSeverity.Info => LogLevel.Information,
            LogSeverity.Verbose => LogLevel.Debug,
            _ => LogLevel.Trace,
        };
        logger.Log(level, message.Exception, "[{Source}] {Message}", message.Source, message.Message);
        return Task.CompletedTask;
    }
}
