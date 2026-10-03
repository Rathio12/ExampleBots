using Discord;
using Discord.WebSocket;

namespace ExpertBot.Utils;

/// <summary>Formatting helpers shared by modules and the audit log.</summary>
public static class Display
{
    public static readonly Color Primary = new(0x5865F2);
    public static readonly Color Success = new(0x57F287);
    public static readonly Color Warning = new(0xFEE75C);
    public static readonly Color Danger = new(0xED4245);
    public static readonly Color Info = new(0x3498DB);
    public static readonly Color Neutral = new(0x99AAB5);

    public static EmbedBuilder Embed(Color? color = null) => new EmbedBuilder().WithColor(color ?? Primary).WithCurrentTimestamp();

    /// <summary>Embed fields max out at 1024 characters — always truncate user content.</summary>
    public static string Truncate(string? text, int max = 1024) =>
        string.IsNullOrEmpty(text) ? "" : text.Length <= max ? text : text[..(max - 1)] + "…";

    /// <summary>"&lt;@id&gt; `name`" — clickable mention plus a name that survives if they leave.</summary>
    public static string User(IUser? user) => user is null ? "Unknown" : $"{user.Mention} `{user.Username}`";

    /// <summary>Discord timestamp tag, rendered in each viewer's own timezone.</summary>
    public static string Time(long unixSeconds, char style = 'R') => $"<t:{unixSeconds}:{style}>";
    public static string Time(DateTimeOffset time, char style = 'R') => Time(time.ToUnixTimeSeconds(), style);

    /// <summary>
    /// Role-hierarchy check for moderation. Returns an error message, or null if allowed.
    /// Discord refuses the action anyway, but a friendly message beats an API error.
    /// </summary>
    public static string? CheckHierarchy(SocketGuildUser moderator, SocketGuildUser target)
    {
        var guild = target.Guild;
        if (target.Id == moderator.Id) return "You can't use this on yourself.";
        if (target.Id == guild.OwnerId) return "You can't moderate the server owner.";
        if (target.Id == guild.CurrentUser.Id) return "I won't moderate myself. 🙃";
        if (moderator.Id != guild.OwnerId && moderator.Hierarchy <= target.Hierarchy)
            return "That member has an equal or higher role than you.";
        if (guild.CurrentUser.Hierarchy <= target.Hierarchy)
            return "My highest role is not above that member — move my role higher in Server Settings → Roles.";
        return null;
    }

    /// <summary>Audit-log reasons show "Moderator: reason" so the real moderator is visible.</summary>
    public static RequestOptions Reason(IUser moderator, string reason) =>
        new() { AuditLogReason = Truncate($"{moderator.Username}: {reason}", 512) };
}
