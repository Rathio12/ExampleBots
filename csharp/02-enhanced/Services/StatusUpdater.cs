using Discord;
using Discord.WebSocket;
using EnhancedBot.Config;

namespace EnhancedBot.Services;

/// <summary>
/// Shows the game server's player count in the bot's presence ("Watching 12/100 players")
/// and optionally in a channel name. Runs on a PeriodicTimer in the background.
/// </summary>
public sealed class StatusUpdater(DiscordSocketClient client, MinecraftService minecraft, BotConfig config)
{
    private string? _lastChannelName;
    private bool _started;

    public void Initialize()
    {
        if (config.GameServerAddress is null) return;
        client.Ready += () =>
        {
            if (_started) return Task.CompletedTask;
            _started = true;
            // Fire-and-forget: the loop runs for the lifetime of the bot.
            _ = Task.Run(RunAsync);
            return Task.CompletedTask;
        };
    }

    private async Task RunAsync()
    {
        await Logger.Info("Status", $"Tracking {config.GameServerAddress} every {config.StatusIntervalMinutes} min");
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(config.StatusIntervalMinutes));
        do
        {
            await UpdateAsync();
        } while (await timer.WaitForNextTickAsync());
    }

    private async Task UpdateAsync()
    {
        try
        {
            var status = await minecraft.GetStatusAsync(config.GameServerAddress!);
            var label = status.Online ? $"{status.Players}/{status.MaxPlayers} players" : "server offline";
            await client.SetActivityAsync(new Game(label, ActivityType.Watching));

            if (config.StatusChannelId is { } channelId && client.GetChannel(channelId) is IGuildChannel channel)
            {
                var name = status.Online ? $"🟢 Players: {status.Players}/{status.MaxPlayers}" : "🔴 Server offline";
                // Only rename when something changed — renames are rate limited (2 / 10 min).
                if (name != _lastChannelName)
                {
                    await channel.ModifyAsync(props => props.Name = name, new RequestOptions { AuditLogReason = "Player count update" });
                    _lastChannelName = name;
                }
            }
        }
        catch (Exception ex)
        {
            await Logger.Warn("Status", "Could not update server status", ex);
        }
    }
}
