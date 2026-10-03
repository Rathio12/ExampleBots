# Background Tasks

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key APIs** | `PeriodicTimer`, `BackgroundService`, `IHostedService` |
| **Used in** | [02-enhanced StatusUpdater.cs](../../csharp/02-enhanced/Services/StatusUpdater.cs) · [03-expert ReminderService.cs](../../csharp/03-expert/src/ExpertBot/Services/ReminderService.cs) |

## PeriodicTimer (no host)

```csharp
public sealed class StatusUpdater(DiscordSocketClient client, MinecraftService minecraft)
{
    private bool _started;

    public void Initialize() => client.Ready += () =>
    {
        if (_started) return Task.CompletedTask;     // Ready fires again on reconnect
        _started = true;
        _ = Task.Run(RunAsync);                      // fire-and-forget loop
        return Task.CompletedTask;
    };

    private async Task RunAsync()
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));
        do
        {
            try { await UpdateAsync(); }
            catch (Exception ex) { Console.WriteLine($"Status update failed: {ex.Message}"); }
        } while (await timer.WaitForNextTickAsync());
    }
}
```

`PeriodicTimer` never overlaps ticks, and doesn't drift like `Task.Delay` loops.

## BackgroundService (Generic Host)

```csharp
public sealed class ReminderService(DiscordSocketClient client, ReminderRepository reminders, ILogger<ReminderService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(15));
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
        catch (OperationCanceledException) { }   // normal shutdown
    }
}

// Program.cs
builder.Services.AddHostedService<ReminderService>();
```

The host starts it automatically and cancels `stoppingToken` on Ctrl+C or SIGTERM.

## Durable scheduling

Never `await Task.Delay(TimeSpan.FromDays(3))` for a reminder: it's lost on restart. Store `remind_at` in the database and poll, as above. The same pattern works for temp bans, giveaways and scheduled posts.

## Daily jobs

```csharp
while (!stoppingToken.IsCancellationRequested)
{
    var now = DateTimeOffset.UtcNow;
    var next = now.Date.AddDays(now.Hour >= 9 ? 1 : 0).AddHours(9);   // next 09:00 UTC
    await Task.Delay(next - now, stoppingToken);
    await PostDailyAsync();
}
```

For complex schedules, use [Quartz.NET](https://www.quartz-scheduler.net/) or [Cronos](https://github.com/HangfireIO/Cronos).

## Rate limits

| Task | Safe frequency |
|---|---|
| `SetActivityAsync` | ≥ 15–60 s |
| Channel rename/topic | ≥ 5 min (2 per 10 min) |
| Database polling | seconds |

## See also
- [Background Tasks](../Background-Tasks.md) · [Project Structure](38-Project-Structure.md) · [SQLite Database](37-SQLite-Database.md)
