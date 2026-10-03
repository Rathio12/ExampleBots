using Discord;
using Discord.Rest;
using Discord.WebSocket;
using ExpertBot.Data;
using Microsoft.Extensions.Logging;

namespace ExpertBot.Services;

/// <summary>
/// The audit-log service: a readable, permanent replacement for Discord's built-in
/// audit log (which keeps 45 days and never shows message content).
/// <see cref="AuditEventHandlers"/> builds embeds and calls <see cref="SendAsync"/>.
/// <see cref="FindExecutorAsync"/> asks Discord's audit log *who* did something —
/// the bot needs the "View Audit Log" permission for that.
/// </summary>
public sealed class AuditLogService(SettingsRepository settings, ILogger<AuditLogService> logger)
{
    public async Task<ulong?> ChannelIdAsync(ulong guildId) => (await settings.GetAsync(guildId)).AuditlogChannelId;

    public async Task<bool> IsEnabledAsync(ulong guildId) => await ChannelIdAsync(guildId) is not null;

    public async Task SendAsync(SocketGuild guild, Embed embed, FileAttachment? file = null)
    {
        var channelId = await ChannelIdAsync(guild.Id);
        if (channelId is null || guild.GetTextChannel(channelId.Value) is not { } channel) return;

        try
        {
            if (file is { } attachment)
                await channel.SendFileAsync(attachment, embed: embed, allowedMentions: AllowedMentions.None);
            else
                await channel.SendMessageAsync(embed: embed, allowedMentions: AllowedMentions.None);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not write to audit log in {Guild}", guild.Id);
        }
    }

    /// <summary>
    /// Finds the most recent audit-log entry of <paramref name="type"/> targeting
    /// <paramref name="targetId"/> from the last 15 seconds.
    /// </summary>
    public async Task<(IUser? User, string? Reason)?> FindExecutorAsync(SocketGuild guild, ActionType type, ulong targetId)
    {
        try
        {
            var entries = await guild.GetAuditLogsAsync(5, actionType: type).FlattenAsync();
            var entry = entries.FirstOrDefault(e =>
                TargetId(e.Data) == targetId && DateTimeOffset.UtcNow - e.CreatedAt < TimeSpan.FromSeconds(15));
            return entry is null ? null : (entry.User, entry.Reason);
        }
        catch
        {
            return null; // missing View Audit Log permission — skip the executor
        }
    }

    private static ulong? TargetId(IAuditLogData? data) => data switch
    {
        KickAuditLogData d => d.Target?.Id,
        BanAuditLogData d => d.Target?.Id,
        UnbanAuditLogData d => d.Target?.Id,
        MemberRoleAuditLogData d => d.Target?.Id,
        MemberUpdateAuditLogData d => d.Target?.Id,
        ChannelCreateAuditLogData d => d.ChannelId,
        ChannelDeleteAuditLogData d => d.ChannelId,
        ChannelUpdateAuditLogData d => d.ChannelId,
        RoleCreateAuditLogData d => d.RoleId,
        RoleDeleteAuditLogData d => d.RoleId,
        RoleUpdateAuditLogData d => d.RoleId,
        _ => null,
    };
}
