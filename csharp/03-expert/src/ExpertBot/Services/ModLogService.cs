using Discord;
using Discord.WebSocket;
using ExpertBot.Data;
using ExpertBot.Utils;
using Microsoft.Extensions.Logging;

namespace ExpertBot.Services;

/// <summary>Sends a record of every moderation action to the server's mod-log channel.</summary>
public sealed class ModLogService(SettingsRepository settings, ILogger<ModLogService> logger)
{
    private static Color ColorFor(string action) => action switch
    {
        "Warn" or "Timeout" => Display.Warning,
        "Kick" or "Ban" => Display.Danger,
        "Unban" or "Remove timeout" => Display.Success,
        _ => Display.Neutral,
    };

    public async Task LogAsync(
        SocketGuild guild, string action, IUser moderator, IUser? target = null, string? reason = null,
        params (string Name, string Value, bool Inline)[] fields)
    {
        var channelId = (await settings.GetAsync(guild.Id)).ModlogChannelId;
        if (channelId is null || guild.GetTextChannel(channelId.Value) is not { } channel) return;

        var embed = Display.Embed(ColorFor(action)).WithTitle($"🛡️ {action}");
        if (target is not null)
        {
            embed.AddField("Member", Display.User(target), inline: true);
            embed.WithFooter($"User ID: {target.Id}");
        }
        embed.AddField("Moderator", Display.User(moderator), inline: true);
        foreach (var (name, value, inline) in fields) embed.AddField(name, value, inline);
        embed.AddField("Reason", string.IsNullOrWhiteSpace(reason) ? "No reason provided" : reason);

        try
        {
            await channel.SendMessageAsync(embed: embed.Build(), allowedMentions: AllowedMentions.None);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not write to mod-log in {Guild}", guild.Id);
        }
    }

    /// <summary>DM the member before an action. Failing (DMs closed) is fine.</summary>
    public static async Task<bool> NotifyAsync(IUser user, IGuild guild, string text)
    {
        try
        {
            await user.SendMessageAsync($"**{guild.Name}:** {text}");
            return true;
        }
        catch
        {
            return false;
        }
    }
}
