using System.Collections.Concurrent;
using Discord;
using Discord.WebSocket;
using ExpertBot.Configuration;
using ExpertBot.Data;
using ExpertBot.Utils;
using Microsoft.Extensions.Logging;

namespace ExpertBot.Services;

/// <summary>Awards XP for chatting, announces level-ups and builds rank cards.</summary>
public sealed class LevelingService(
    DiscordSocketClient client,
    LevelRepository levels,
    BotOptions options,
    ILogger<LevelingService> logger)
{
    // (guild, user) -> when the user may earn XP again.
    private readonly ConcurrentDictionary<(ulong, ulong), DateTimeOffset> _cooldowns = new();

    public void Attach() => client.MessageReceived += message =>
    {
        // Don't block the gateway thread with database work — hand it off.
        _ = Task.Run(() => HandleMessageAsync(message));
        return Task.CompletedTask;
    };

    private async Task HandleMessageAsync(SocketMessage message)
    {
        if (message is not SocketUserMessage { Author.IsBot: false } userMessage) return;
        if (userMessage.Channel is not SocketGuildChannel guildChannel) return;

        var key = (guildChannel.Guild.Id, userMessage.Author.Id);
        var now = DateTimeOffset.UtcNow;
        if (_cooldowns.TryGetValue(key, out var until) && until > now) return;
        _cooldowns[key] = now.AddSeconds(options.XpCooldownSeconds);

        try
        {
            var gained = Random.Shared.Next(options.XpMin, options.XpMax + 1);
            var total = await levels.AddXpAsync(guildChannel.Guild.Id, userMessage.Author.Id, gained);
            var before = LevelMath.FromXp(total - gained).Level;
            var after = LevelMath.FromXp(total).Level;

            if (after > before)
                await userMessage.Channel.SendMessageAsync($"🎉 {userMessage.Author.Mention} reached **level {after}**!",
                    allowedMentions: new AllowedMentions { UserIds = [userMessage.Author.Id] });
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to award XP");
        }
    }

    /// <summary>Builds the embed used by /rank and the "Show Rank" context menu.</summary>
    public async Task<Embed> BuildRankEmbedAsync(ulong guildId, IUser user)
    {
        var xp = await levels.GetXpAsync(guildId, user.Id);
        var info = LevelMath.FromXp(xp);
        var rank = xp > 0 ? await levels.GetRankAsync(guildId, xp) : (long?)null;

        return Display.Embed(Display.Primary)
            .WithAuthor(user.Username, user.GetDisplayAvatarUrl())
            .WithThumbnailUrl(user.GetDisplayAvatarUrl(size: 256))
            .AddField("Level", $"**{info.Level}**", inline: true)
            .AddField("Rank", rank is { } r ? $"#{r}" : "Unranked", inline: true)
            .AddField("Total XP", xp, inline: true)
            .AddField($"Progress — {info.CurrentXp}/{info.NeededXp} XP", LevelMath.ProgressBar(info.CurrentXp, info.NeededXp, 20))
            .Build();
    }
}
