using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using ExpertBot.Data;
using ExpertBot.Services;
using ExpertBot.Utils;

namespace ExpertBot.Modules;

[CommandContextType(InteractionContextType.Guild)]
public sealed class LevelingModule(LevelingService leveling, LevelRepository levels) : InteractionModuleBase<SocketInteractionContext>
{
    private const int PageSize = 10;
    private static readonly string[] Medals = ["🥇", "🥈", "🥉"];

    [SlashCommand("rank", "Show your (or someone else's) level and XP")]
    public async Task RankAsync([Summary("user", "Whose rank? (default: you)")] IUser? user = null)
    {
        user ??= Context.User;
        if (user.IsBot)
        {
            await RespondAsync("🤖 Bots do not earn XP.");
            return;
        }
        await RespondAsync(embed: await leveling.BuildRankEmbedAsync(Context.Guild.Id, user));
    }

    // A USER context menu: right-click a member → Apps → "Show Rank".
    [UserCommand("Show Rank")]
    public async Task ShowRankAsync(IUser user) =>
        await RespondAsync(embed: await leveling.BuildRankEmbedAsync(Context.Guild.Id, user), ephemeral: true);

    [SlashCommand("leaderboard", "Show the most active members")]
    public async Task LeaderboardAsync()
    {
        var (embed, components) = await BuildPageAsync(0);
        await RespondAsync(embed: embed, components: components, allowedMentions: AllowedMentions.None);
    }

    // Buttons encode the page they lead to: "leaderboard:<page>".
    [ComponentInteraction("leaderboard:*")]
    public async Task PageAsync(string page)
    {
        var (embed, components) = await BuildPageAsync(int.Parse(page));
        await ((SocketMessageComponent)Context.Interaction).UpdateAsync(m =>
        {
            m.Embed = embed;
            m.Components = components;
        });
    }

    private async Task<(Embed, MessageComponent)> BuildPageAsync(int requestedPage)
    {
        var total = await levels.CountAsync(Context.Guild.Id);
        var pages = Math.Max(1, (int)Math.Ceiling(total / (double)PageSize));
        var page = Math.Clamp(requestedPage, 0, pages - 1);

        var rows = await levels.GetTopAsync(Context.Guild.Id, PageSize, page * PageSize);
        var lines = rows.Select((row, i) =>
        {
            var position = page * PageSize + i + 1;
            var badge = position <= 3 ? Medals[position - 1] : $"`#{position}`";
            return $"{badge} <@{row.UserId}> — Level **{LevelMath.FromXp(row.Xp).Level}** ({row.Xp} XP)";
        }).ToList();

        var embed = Display.Embed(Display.Warning)
            .WithTitle($"🏆 {Context.Guild.Name} leaderboard")
            .WithDescription(lines.Count > 0 ? string.Join('\n', lines) : "Nobody has earned XP yet — start chatting!")
            .WithFooter($"Page {page + 1}/{pages} • {total} ranked member(s)")
            .Build();

        var components = pages > 1
            ? new ComponentBuilder()
                .WithButton(customId: $"leaderboard:{page - 1}", emote: new Emoji("◀️"), style: ButtonStyle.Secondary, disabled: page == 0)
                .WithButton(customId: $"leaderboard:{page + 1}", emote: new Emoji("▶️"), style: ButtonStyle.Secondary, disabled: page >= pages - 1)
                .Build()
            : new ComponentBuilder().Build();

        return (embed, components);
    }
}
