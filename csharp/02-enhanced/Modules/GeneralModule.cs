using System.Diagnostics;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using EnhancedBot.Preconditions;
using EnhancedBot.Utils;

namespace EnhancedBot.Modules;

/// <summary>
/// A module is a class whose methods are commands. The InteractionService creates
/// a new instance per interaction and injects constructor parameters from DI.
/// </summary>
public sealed class GeneralModule(InteractionService interactions) : InteractionModuleBase<SocketInteractionContext>
{
    [SlashCommand("ping", "Check the bot latency")]
    [Cooldown(5)]
    public async Task PingAsync()
    {
        var stopwatch = Stopwatch.StartNew();
        await DeferAsync(); // "Bot is thinking…"
        var roundTrip = stopwatch.ElapsedMilliseconds;

        var embed = Embeds.Base()
            .WithTitle("🏓 Pong!")
            .AddField("Gateway", $"{Context.Client.Latency}ms", inline: true)
            .AddField("API round-trip", $"{roundTrip}ms", inline: true)
            .Build();
        await FollowupAsync(embed: embed);
    }

    [SlashCommand("help", "List every command")]
    public async Task HelpAsync()
    {
        // Built from the InteractionService, so it never goes out of date.
        var lines = interactions.SlashCommands
            .OrderBy(c => c.Name)
            .Select(c => $"**/{c.Name}** — {c.Description}");

        await RespondAsync(embed: Embeds.Base().WithTitle("📖 Commands").WithDescription(string.Join('\n', lines)).Build(), ephemeral: true);
    }

    [SlashCommand("serverinfo", "Show information about this server")]
    [CommandContextType(InteractionContextType.Guild)] // hidden in DMs
    public async Task ServerInfoAsync()
    {
        var guild = Context.Guild;
        var embed = Embeds.Base()
            .WithTitle(guild.Name)
            .WithThumbnailUrl(guild.IconUrl)
            .AddField("👑 Owner", $"<@{guild.OwnerId}>", inline: true)
            .AddField("👥 Members", guild.MemberCount, inline: true)
            .AddField("🚀 Boosts", guild.PremiumSubscriptionCount, inline: true)
            .AddField("💬 Channels", guild.Channels.Count, inline: true)
            .AddField("🎭 Roles", guild.Roles.Count, inline: true)
            .AddField("📅 Created", Embeds.Relative(guild.CreatedAt), inline: true)
            .WithFooter($"ID: {guild.Id}")
            .Build();
        await RespondAsync(embed: embed);
    }

    [SlashCommand("userinfo", "Show information about a member")]
    [CommandContextType(InteractionContextType.Guild)]
    public async Task UserInfoAsync([Summary("user", "Who? (default: you)")] IUser? user = null)
    {
        user ??= Context.User;
        // In a server, users resolve to SocketGuildUser, which has roles and a join date.
        if (user is not SocketGuildUser member)
        {
            await RespondAsync($"**{user.Username}** is not a member of this server.");
            return;
        }

        var roles = member.Roles
            .Where(r => !r.IsEveryone)
            .OrderByDescending(r => r.Position)
            .Select(r => r.Mention)
            .ToList();

        var roleText = string.Join(' ', roles.Take(15)) + (roles.Count > 15 ? " …" : "");
        var embed = Embeds.Base()
            .WithAuthor(member.Username, member.GetDisplayAvatarUrl())
            .WithThumbnailUrl(member.GetDisplayAvatarUrl(size: 256))
            .AddField("🆔 ID", member.Id, inline: true)
            .AddField("🤖 Bot", member.IsBot ? "Yes" : "No", inline: true)
            .AddField("📅 Account created", Embeds.Relative(member.CreatedAt), inline: true)
            .AddField("📥 Joined server", Embeds.Relative(member.JoinedAt), inline: true)
            .AddField($"🎭 Roles ({roles.Count})", roleText.Length > 0 ? roleText : "None")
            .Build();
        await RespondAsync(embed: embed);
    }
}
