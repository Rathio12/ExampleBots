using Discord;
using Discord.WebSocket;
using ExpertBot.Data;
using ExpertBot.Utils;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ExpertBot.Services;

/// <summary>
/// Delivers reminders stored in the database. A BackgroundService runs for the
/// lifetime of the app and is cancelled cleanly on shutdown. Polling the database
/// (instead of one timer per reminder) means reminders survive restarts.
/// </summary>
public sealed class ReminderService(
    DiscordSocketClient client,
    ReminderRepository reminders,
    ILogger<ReminderService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                if (client.ConnectionState != ConnectionState.Connected) continue;
                try
                {
                    foreach (var reminder in await reminders.DueAsync())
                    {
                        await DeliverAsync(reminder);
                        await reminders.RemoveAsync(reminder.Id);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Reminder tick failed");
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Normal shutdown.
        }
    }

    private async Task DeliverAsync(ReminderRow reminder)
    {
        var embed = Display.Embed(Display.Info)
            .WithTitle("⏰ Reminder")
            .WithDescription(Display.Truncate(reminder.Message, 4000))
            .AddField("Set", Display.Time(reminder.CreatedAt))
            .Build();
        // Only ping the person who set the reminder.
        var mentions = new AllowedMentions { UserIds = [reminder.UserId] };

        if (client.GetChannel(reminder.ChannelId) is IMessageChannel channel)
        {
            try
            {
                await channel.SendMessageAsync($"<@{reminder.UserId}>", embed: embed, allowedMentions: mentions);
                return;
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "Channel delivery failed, trying DM");
            }
        }

        // Channel deleted or no access? Fall back to a DM.
        try
        {
            var user = await client.GetUserAsync(reminder.UserId);
            if (user is not null) await user.SendMessageAsync(embed: embed);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not deliver reminder {Id}", reminder.Id);
        }
    }
}
