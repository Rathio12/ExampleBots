using Discord.Interactions;
using Discord.WebSocket;
using ExpertBot.Configuration;
using ExpertBot.Data;
using ExpertBot.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ExpertBot.Tests;

/// <summary>
/// Builds every interaction module without connecting to Discord. Mistakes in
/// command attributes (bad names, wildcard mismatches, invalid options) or missing
/// DI registrations throw here instead of at runtime.
/// </summary>
public class ModuleTests
{
    [Fact]
    public async Task All_modules_build()
    {
        using var client = new DiscordSocketClient(); // never logs in
        using var interactions = new InteractionService(client);

        // Mirror the registrations from Program.cs (with an in-memory database).
        await using var services = new ServiceCollection()
            .AddLogging()
            .AddSingleton(new BotOptions("test-token", null, ":memory:", LogLevel.Information, false, 15, 25, 60))
            .AddSingleton(client)
            .AddSingleton(interactions)
            .AddSingleton(_ => Database.InMemory())
            .AddSingleton<LevelRepository>()
            .AddSingleton<WarningRepository>()
            .AddSingleton<ReminderRepository>()
            .AddSingleton<TagRepository>()
            .AddSingleton<SettingsRepository>()
            .AddSingleton<LevelingService>()
            .AddSingleton<ModLogService>()
            .BuildServiceProvider();

        await interactions.AddModulesAsync(typeof(DiscordBotService).Assembly, services);

        var slash = interactions.SlashCommands.Select(c => c.Name).ToHashSet();
        foreach (var name in new[] { "ping", "help", "rank", "leaderboard", "warn", "warnings", "clearwarnings",
                     "timeout", "untimeout", "kick", "ban", "unban", "purge", "create", "list", "delete", "show",
                     "modlog", "auditlog", "view" })
            Assert.Contains(name, slash);

        Assert.Equal(["Bookmark", "Show Rank"], interactions.ContextCommands.Select(c => c.Name).Order());
        Assert.Contains(interactions.ComponentCommands, c => c.Name == "leaderboard:*");
    }
}
