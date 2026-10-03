using System.Diagnostics;
using Discord.Interactions;
using ExpertBot.Data;
using ExpertBot.Utils;

namespace ExpertBot.Modules;

public sealed class GeneralModule(InteractionService interactions, Database db) : InteractionModuleBase<SocketInteractionContext>
{
    private static readonly DateTimeOffset StartedAt = DateTimeOffset.UtcNow;

    [SlashCommand("ping", "Check latency and uptime")]
    public async Task PingAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        await DeferAsync();
        var roundTrip = stopwatch.ElapsedMilliseconds;

        stopwatch.Restart();
        await db.ScalarAsync<long>("SELECT 1;"); // proves the database is healthy
        var dbMs = stopwatch.Elapsed.TotalMilliseconds;

        var embed = Display.Embed()
            .WithTitle("🏓 Pong!")
            .AddField("Gateway", $"{Context.Client.Latency}ms", inline: true)
            .AddField("Round-trip", $"{roundTrip}ms", inline: true)
            .AddField("Database", $"{dbMs:F2}ms", inline: true)
            .AddField("Online since", Display.Time(StartedAt), inline: true)
            .Build();
        await FollowupAsync(embed: embed);
    }

    [SlashCommand("help", "List all commands by category")]
    public async Task HelpAsync()
    {
        var embed = Display.Embed().WithTitle("📖 Help").WithDescription("Commands you lack permissions for are hidden by Discord.");

        // Each module becomes one category; subcommands show as "/group sub".
        foreach (var module in interactions.Modules.Where(m => m.SlashCommands.Count > 0 && !m.IsSubModule))
        {
            var lines = module.SlashCommands
                .Concat(module.SubModules.SelectMany(s => s.SlashCommands))
                .Select(c => $"**/{(c.Module.IsSlashGroup ? c.Module.SlashGroupName + " " : "")}{c.Name}** — {c.Description}");
            embed.AddField(module.Name.Replace("Module", ""), string.Join('\n', lines));
        }

        var menus = interactions.ContextCommands.Select(c => c.Name).ToList();
        if (menus.Count > 0) embed.AddField("Context menus (right-click → Apps)", string.Join(", ", menus));

        await RespondAsync(embed: embed.Build(), ephemeral: true);
    }
}
