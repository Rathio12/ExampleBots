using System.Reflection;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using EnhancedBot.Config;

namespace EnhancedBot.Services;

/// <summary>
/// Discovers all modules, registers their commands with Discord, and routes
/// every incoming interaction (commands, buttons, selects, modals) to them.
/// </summary>
public sealed class InteractionHandler(
    DiscordSocketClient client,
    InteractionService interactions,
    IServiceProvider services,
    BotConfig config)
{
    public async Task InitializeAsync()
    {
        // Find every InteractionModuleBase subclass in this assembly.
        await interactions.AddModulesAsync(Assembly.GetExecutingAssembly(), services);

        client.Ready += RegisterCommandsAsync;
        client.InteractionCreated += HandleInteractionAsync;
        interactions.InteractionExecuted += HandleResultAsync;
    }

    private bool _registered;

    private async Task RegisterCommandsAsync()
    {
        if (_registered) return; // Ready fires again after every reconnect
        _registered = true;

        if (config.GuildId is { } guildId)
            await interactions.RegisterCommandsToGuildAsync(guildId);
        else
            await interactions.RegisterCommandsGloballyAsync();

        await Logger.Info("Commands", $"Registered {interactions.SlashCommands.Count} slash commands {(config.GuildId is null ? "globally" : $"in guild {config.GuildId}")}");
    }

    private async Task HandleInteractionAsync(SocketInteraction interaction)
    {
        try
        {
            var context = new SocketInteractionContext(client, interaction);
            await interactions.ExecuteCommandAsync(context, services);
        }
        catch (Exception ex)
        {
            await Logger.Warn("Interactions", "Failed to execute interaction", ex);
        }
    }

    /// <summary>Runs after every command. Failed preconditions and exceptions end up here.</summary>
    private static async Task HandleResultAsync(ICommandInfo command, IInteractionContext context, IResult result)
    {
        if (result.IsSuccess) return;

        var message = result.Error switch
        {
            InteractionCommandError.UnmetPrecondition => result.ErrorReason, // e.g. cooldown text
            InteractionCommandError.Exception => "⚠️ Something went wrong while running that command.",
            _ => $"⚠️ {result.ErrorReason}",
        };

        if (result.Error == InteractionCommandError.Exception)
            await Logger.Warn("Commands", $"/{command?.Name} failed: {result.ErrorReason}");

        if (context.Interaction.HasResponded)
            await context.Interaction.FollowupAsync(message, ephemeral: true);
        else
            await context.Interaction.RespondAsync(message, ephemeral: true);
    }
}
