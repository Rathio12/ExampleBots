using Discord;

namespace EnhancedBot.Utils;

/// <summary>Shared embed colours and helpers so every reply looks consistent.</summary>
public static class Embeds
{
    public static readonly Color Primary = new(0x5865F2);
    public static readonly Color Success = new(0x57F287);
    public static readonly Color Warning = new(0xFEE75C);
    public static readonly Color Danger = new(0xED4245);

    public static EmbedBuilder Base(Color? color = null) =>
        new EmbedBuilder().WithColor(color ?? Primary).WithCurrentTimestamp();

    /// <summary>A Discord timestamp tag like "3 days ago", shown in each user's own timezone.</summary>
    public static string Relative(DateTimeOffset? time) =>
        time is { } t ? $"<t:{t.ToUnixTimeSeconds()}:R>" : "Unknown";
}
