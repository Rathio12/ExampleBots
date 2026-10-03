using System.Text;
using Discord;
using Discord.WebSocket;
using ExpertBot.Utils;
using Microsoft.Extensions.Logging;

namespace ExpertBot.Services;

/// <summary>
/// Subscribes to Discord gateway events and turns them into audit-log embeds:
/// message edits/deletes (with content), bulk deletes (with a transcript),
/// joins/leaves/kicks, nickname/role/timeout changes, bans, channel and role
/// changes, and voice activity. Configure the channel with /settings auditlog.
/// </summary>
public sealed class AuditEventHandlers(DiscordSocketClient client, AuditLogService audit, ILogger<AuditEventHandlers> logger)
{
    private const int NewAccountDays = 7;

    public void Attach()
    {
        client.MessageDeleted += (message, channel) => Fire(() => OnMessageDeletedAsync(message, channel));
        client.MessageUpdated += (before, after, channel) => Fire(() => OnMessageUpdatedAsync(before, after, channel));
        client.MessagesBulkDeleted += (messages, channel) => Fire(() => OnBulkDeletedAsync(messages, channel));
        client.UserJoined += member => Fire(() => OnUserJoinedAsync(member));
        client.UserLeft += (guild, user) => Fire(() => OnUserLeftAsync(guild, user));
        client.GuildMemberUpdated += (before, after) => Fire(() => OnMemberUpdatedAsync(before, after));
        client.UserBanned += (user, guild) => Fire(() => OnBanAsync(user, guild, banned: true));
        client.UserUnbanned += (user, guild) => Fire(() => OnBanAsync(user, guild, banned: false));
        client.ChannelCreated += channel => Fire(() => OnChannelCreatedOrDeletedAsync(channel, created: true));
        client.ChannelDestroyed += channel => Fire(() => OnChannelCreatedOrDeletedAsync(channel, created: false));
        client.ChannelUpdated += (before, after) => Fire(() => OnChannelUpdatedAsync(before, after));
        client.RoleCreated += role => Fire(() => OnRoleCreatedOrDeletedAsync(role, created: true));
        client.RoleDeleted += role => Fire(() => OnRoleCreatedOrDeletedAsync(role, created: false));
        client.RoleUpdated += (before, after) => Fire(() => OnRoleUpdatedAsync(before, after));
        client.UserVoiceStateUpdated += (user, before, after) => Fire(() => OnVoiceStateUpdatedAsync(user, before, after));
    }

    /// <summary>
    /// Event handlers run on the gateway thread. Anything slow (HTTP calls to the
    /// audit log) is moved to the thread pool so the connection never stalls.
    /// </summary>
    private Task Fire(Func<Task> handler)
    {
        _ = Task.Run(async () =>
        {
            try { await handler(); }
            catch (Exception ex) { logger.LogError(ex, "Audit handler failed"); }
        });
        return Task.CompletedTask;
    }

    private static string By((IUser? User, string? Reason)? executor) => Display.User(executor?.User);

    // --------------------------------------------------------------------- Messages

    private async Task OnMessageDeletedAsync(Cacheable<IMessage, ulong> cached, Cacheable<IMessageChannel, ulong> cachedChannel)
    {
        if (client.GetChannel(cachedChannel.Id) is not SocketGuildChannel channel) return;
        var channelId = await audit.ChannelIdAsync(channel.Guild.Id);
        if (channelId is null || channelId == channel.Id) return; // disabled, or the log channel itself

        var message = cached.HasValue ? cached.Value : null;
        if (message?.Author.IsBot == true) return;

        var content = message is null
            ? "*Not cached — the message was sent before the bot started.*"
            : Display.Truncate(message.Content) is { Length: > 0 } text ? text : "*No text content*";

        var embed = Display.Embed(Display.Danger)
            .WithTitle("🗑️ Message deleted")
            .AddField("Author", message is null ? "Unknown" : Display.User(message.Author), inline: true)
            .AddField("Channel", $"<#{channel.Id}>", inline: true)
            .AddField("Content", content)
            .WithFooter($"Message ID: {cached.Id}" + (message is null ? "" : $" • User ID: {message.Author.Id}"));

        if (message is { Attachments.Count: > 0 })
            embed.AddField("Attachments", Display.Truncate(string.Join('\n', message.Attachments.Select(a => a.Filename))));

        await audit.SendAsync(channel.Guild, embed.Build());
    }

    private async Task OnMessageUpdatedAsync(Cacheable<IMessage, ulong> before, SocketMessage after, ISocketMessageChannel channel)
    {
        if (channel is not SocketGuildChannel guildChannel || after.Author.IsBot) return;
        if (!await audit.IsEnabledAsync(guildChannel.Guild.Id)) return;
        // Link previews also fire updates; real edits set EditedTimestamp and change content.
        if (after.EditedTimestamp is null) return;
        if (before.HasValue && before.Value.Content == after.Content) return;

        var old = before.HasValue ? Display.Truncate(before.Value.Content) : "*Not cached*";
        var embed = Display.Embed(Display.Warning)
            .WithTitle("✏️ Message edited")
            .WithDescription($"[Jump to message]({after.GetJumpUrl()})")
            .AddField("Author", Display.User(after.Author), inline: true)
            .AddField("Channel", $"<#{channel.Id}>", inline: true)
            .AddField("Before", old.Length > 0 ? old : "*Empty*")
            .AddField("After", Display.Truncate(after.Content) is { Length: > 0 } text ? text : "*Empty*")
            .WithFooter($"Message ID: {after.Id} • User ID: {after.Author.Id}")
            .Build();

        await audit.SendAsync(guildChannel.Guild, embed);
    }

    private async Task OnBulkDeletedAsync(IReadOnlyCollection<Cacheable<IMessage, ulong>> messages, Cacheable<IMessageChannel, ulong> cachedChannel)
    {
        if (client.GetChannel(cachedChannel.Id) is not SocketGuildChannel channel) return;
        var channelId = await audit.ChannelIdAsync(channel.Guild.Id);
        if (channelId is null || channelId == channel.Id) return;

        var cached = messages.Where(m => m.HasValue).Select(m => m.Value).OrderBy(m => m.Timestamp).ToList();
        var transcript = new StringBuilder();
        foreach (var m in cached)
        {
            var files = m.Attachments.Count > 0 ? $" [attachments: {string.Join(", ", m.Attachments.Select(a => a.Url))}]" : "";
            transcript.AppendLine($"[{m.Timestamp:O}] {m.Author.Username} ({m.Author.Id}): {m.Content}{files}");
        }

        var embed = Display.Embed(Display.Danger)
            .WithTitle("🧹 Messages bulk deleted")
            .AddField("Channel", $"<#{channel.Id}>", inline: true)
            .AddField("Count", messages.Count, inline: true)
            .AddField("Transcript", cached.Count > 0 ? $"{cached.Count} cached message(s) attached" : "No messages were cached", inline: true)
            .Build();

        if (cached.Count == 0)
        {
            await audit.SendAsync(channel.Guild, embed);
            return;
        }

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(transcript.ToString()));
        await audit.SendAsync(channel.Guild, embed, new FileAttachment(stream, $"deleted-messages-{channel.Id}.txt"));
    }

    // ---------------------------------------------------------------------- Members

    private async Task OnUserJoinedAsync(SocketGuildUser member)
    {
        if (!await audit.IsEnabledAsync(member.Guild.Id)) return;

        var embed = Display.Embed(Display.Success)
            .WithTitle("📥 Member joined")
            .WithThumbnailUrl(member.GetDisplayAvatarUrl())
            .AddField("Member", Display.User(member), inline: true)
            .AddField("Account created", Display.Time(member.CreatedAt), inline: true)
            .AddField("Member count", member.Guild.MemberCount, inline: true)
            .WithFooter($"User ID: {member.Id}");

        // A classic anti-raid signal: brand-new accounts.
        if (DateTimeOffset.UtcNow - member.CreatedAt < TimeSpan.FromDays(NewAccountDays))
            embed.WithColor(Display.Warning).AddField("⚠️ New account", $"Created less than {NewAccountDays} days ago.");

        await audit.SendAsync(member.Guild, embed.Build());
    }

    private async Task OnUserLeftAsync(SocketGuild guild, SocketUser user)
    {
        if (!await audit.IsEnabledAsync(guild.Id)) return;

        // Discord has no "kick" event — a kick looks like a leave, so check the audit log.
        var kick = await audit.FindExecutorAsync(guild, ActionType.Kick, user.Id);

        var embed = Display.Embed(kick is null ? Display.Neutral : Display.Danger)
            .WithTitle(kick is null ? "📤 Member left" : "👢 Member kicked")
            .WithThumbnailUrl(user.GetDisplayAvatarUrl())
            .AddField("Member", Display.User(user), inline: true)
            .WithFooter($"User ID: {user.Id}");

        if (kick is { } k)
            embed.AddField("Kicked by", By(k), inline: true).AddField("Reason", k.Reason ?? "No reason provided");

        await audit.SendAsync(guild, embed.Build());
    }

    private async Task OnMemberUpdatedAsync(Cacheable<SocketGuildUser, ulong> cachedBefore, SocketGuildUser after)
    {
        if (!cachedBefore.HasValue || !await audit.IsEnabledAsync(after.Guild.Id)) return;
        var before = cachedBefore.Value;

        var changes = new List<(string Name, string Value)>();
        if (before.Nickname != after.Nickname)
            changes.Add(("Nickname", $"`{before.Nickname ?? "none"}` → `{after.Nickname ?? "none"}`"));

        var added = after.Roles.Where(r => before.Roles.All(b => b.Id != r.Id)).ToList();
        var removed = before.Roles.Where(r => after.Roles.All(a => a.Id != r.Id)).ToList();
        if (added.Count > 0) changes.Add(("Roles added", Display.Truncate(string.Join(' ', added.Select(r => r.Mention)))));
        if (removed.Count > 0) changes.Add(("Roles removed", Display.Truncate(string.Join(' ', removed.Select(r => r.Mention)))));

        if (before.TimedOutUntil != after.TimedOutUntil)
        {
            changes.Add(after.TimedOutUntil is { } until && until > DateTimeOffset.UtcNow
                ? ("Timed out", $"Until {Display.Time(until, 'f')}")
                : ("Timeout removed", "✅"));
        }

        if (changes.Count == 0) return; // avatar, boost or pending changes we don't log

        var type = added.Count > 0 || removed.Count > 0 ? ActionType.MemberRoleUpdated : ActionType.MemberUpdated;
        var executor = await audit.FindExecutorAsync(after.Guild, type, after.Id);

        var embed = Display.Embed(Display.Info)
            .WithTitle("👤 Member updated")
            .WithThumbnailUrl(after.GetDisplayAvatarUrl())
            .AddField("Member", Display.User(after), inline: true);
        if (executor is not null) embed.AddField("By", By(executor), inline: true);
        foreach (var (name, value) in changes) embed.AddField(name, value);
        embed.WithFooter($"User ID: {after.Id}");

        await audit.SendAsync(after.Guild, embed.Build());
    }

    private async Task OnBanAsync(SocketUser user, SocketGuild guild, bool banned)
    {
        if (!await audit.IsEnabledAsync(guild.Id)) return;
        var executor = await audit.FindExecutorAsync(guild, banned ? ActionType.Ban : ActionType.Unban, user.Id);

        var embed = Display.Embed(banned ? Display.Danger : Display.Success)
            .WithTitle(banned ? "🔨 Member banned" : "🕊️ Member unbanned")
            .WithThumbnailUrl(user.GetDisplayAvatarUrl())
            .AddField("User", Display.User(user), inline: true)
            .AddField(banned ? "Banned by" : "Unbanned by", By(executor), inline: true)
            .WithFooter($"User ID: {user.Id}");
        if (banned) embed.AddField("Reason", executor?.Reason ?? "No reason provided");

        await audit.SendAsync(guild, embed.Build());
    }

    // --------------------------------------------------------------------- Channels

    private async Task OnChannelCreatedOrDeletedAsync(SocketChannel socketChannel, bool created)
    {
        if (socketChannel is not SocketGuildChannel channel || !await audit.IsEnabledAsync(channel.Guild.Id)) return;
        var executor = await audit.FindExecutorAsync(channel.Guild, created ? ActionType.ChannelCreated : ActionType.ChannelDeleted, channel.Id);

        var embed = Display.Embed(created ? Display.Success : Display.Danger)
            .WithTitle(created ? "➕ Channel created" : "➖ Channel deleted")
            .AddField(created ? "Channel" : "Name", created ? $"<#{channel.Id}> `{channel.Name}`" : $"`#{channel.Name}`", inline: true)
            .AddField("Type", channel.GetChannelType()?.ToString() ?? "Unknown", inline: true)
            .AddField("By", By(executor), inline: true)
            .WithFooter($"Channel ID: {channel.Id}")
            .Build();

        await audit.SendAsync(channel.Guild, embed);
    }

    private static string OverwriteKey(SocketGuildChannel channel) =>
        string.Join('|', channel.PermissionOverwrites
            .Select(o => $"{o.TargetId}:{o.Permissions.AllowValue}:{o.Permissions.DenyValue}")
            .OrderBy(s => s));

    private async Task OnChannelUpdatedAsync(SocketChannel beforeChannel, SocketChannel afterChannel)
    {
        if (beforeChannel is not SocketGuildChannel before || afterChannel is not SocketGuildChannel after) return;
        if (!await audit.IsEnabledAsync(after.Guild.Id)) return;

        var changes = new List<(string Name, string Value)>();
        if (before.Name != after.Name) changes.Add(("Name", $"`{before.Name}` → `{after.Name}`"));

        if (before is SocketTextChannel textBefore && after is SocketTextChannel textAfter)
        {
            if (textBefore.Topic != textAfter.Topic)
                changes.Add(("Topic", Display.Truncate($"{textBefore.Topic ?? "*none*"} → {textAfter.Topic ?? "*none*"}")));
            if (textBefore.IsNsfw != textAfter.IsNsfw)
                changes.Add(("NSFW", $"{textBefore.IsNsfw} → {textAfter.IsNsfw}"));
            if (textBefore.SlowModeInterval != textAfter.SlowModeInterval)
                changes.Add(("Slowmode", $"{textBefore.SlowModeInterval}s → {textAfter.SlowModeInterval}s"));
        }
        if (before is INestedChannel nestedBefore && after is INestedChannel nestedAfter && nestedBefore.CategoryId != nestedAfter.CategoryId)
            changes.Add(("Category", "Moved to another category"));
        if (OverwriteKey(before) != OverwriteKey(after))
            changes.Add(("Permissions", "Permission overwrites were changed"));

        if (changes.Count == 0) return; // position-only changes happen whenever channels are reordered

        var executor = await audit.FindExecutorAsync(after.Guild, ActionType.ChannelUpdated, after.Id);
        var embed = Display.Embed(Display.Info)
            .WithTitle("🔧 Channel updated")
            .AddField("Channel", $"<#{after.Id}>", inline: true)
            .AddField("By", By(executor), inline: true);
        foreach (var (name, value) in changes) embed.AddField(name, value);
        embed.WithFooter($"Channel ID: {after.Id}");

        await audit.SendAsync(after.Guild, embed.Build());
    }

    // ------------------------------------------------------------------------ Roles

    private async Task OnRoleCreatedOrDeletedAsync(SocketRole role, bool created)
    {
        if (!await audit.IsEnabledAsync(role.Guild.Id)) return;
        var executor = await audit.FindExecutorAsync(role.Guild, created ? ActionType.RoleCreated : ActionType.RoleDeleted, role.Id);

        var embed = Display.Embed(created ? Display.Success : Display.Danger)
            .WithTitle(created ? "➕ Role created" : "➖ Role deleted")
            .AddField(created ? "Role" : "Name", created ? $"{role.Mention} `{role.Name}`" : $"`{role.Name}`", inline: true)
            .AddField("By", By(executor), inline: true)
            .WithFooter($"Role ID: {role.Id}")
            .Build();

        await audit.SendAsync(role.Guild, embed);
    }

    private async Task OnRoleUpdatedAsync(SocketRole before, SocketRole after)
    {
        if (!await audit.IsEnabledAsync(after.Guild.Id)) return;

        var changes = new List<(string Name, string Value)>();
        if (before.Name != after.Name) changes.Add(("Name", $"`{before.Name}` → `{after.Name}`"));
        if (before.Colors.PrimaryColor != after.Colors.PrimaryColor)
            changes.Add(("Color", $"{before.Colors.PrimaryColor} → {after.Colors.PrimaryColor}"));
        if (before.IsHoisted != after.IsHoisted) changes.Add(("Displayed separately", $"{before.IsHoisted} → {after.IsHoisted}"));
        if (before.IsMentionable != after.IsMentionable) changes.Add(("Mentionable", $"{before.IsMentionable} → {after.IsMentionable}"));

        // Permission diffs are the most security-relevant part of role changes.
        if (before.Permissions.RawValue != after.Permissions.RawValue)
        {
            var old = before.Permissions.ToList();
            var now = after.Permissions.ToList();
            var granted = now.Except(old).ToList();
            var revoked = old.Except(now).ToList();
            if (granted.Count > 0) changes.Add(("✅ Permissions granted", Display.Truncate(string.Join(", ", granted))));
            if (revoked.Count > 0) changes.Add(("❌ Permissions revoked", Display.Truncate(string.Join(", ", revoked))));
        }

        if (changes.Count == 0) return; // position-only change

        var executor = await audit.FindExecutorAsync(after.Guild, ActionType.RoleUpdated, after.Id);
        var embed = Display.Embed(Display.Info)
            .WithTitle("🔧 Role updated")
            .AddField("Role", after.Mention, inline: true)
            .AddField("By", By(executor), inline: true);
        foreach (var (name, value) in changes) embed.AddField(name, value);
        embed.WithFooter($"Role ID: {after.Id}");

        await audit.SendAsync(after.Guild, embed.Build());
    }

    // ------------------------------------------------------------------------ Voice

    private async Task OnVoiceStateUpdatedAsync(SocketUser user, SocketVoiceState before, SocketVoiceState after)
    {
        // Mute/deafen/stream changes keep the same channel — only log movement.
        if (user is not SocketGuildUser member || member.IsBot) return;
        if (before.VoiceChannel?.Id == after.VoiceChannel?.Id) return;
        if (!await audit.IsEnabledAsync(member.Guild.Id)) return;

        EmbedBuilder embed;
        if (before.VoiceChannel is null)
            embed = Display.Embed(Display.Success).WithTitle("🔊 Joined voice").AddField("Channel", $"<#{after.VoiceChannel!.Id}>", inline: true);
        else if (after.VoiceChannel is null)
            embed = Display.Embed(Display.Neutral).WithTitle("🔇 Left voice").AddField("Channel", $"<#{before.VoiceChannel.Id}>", inline: true);
        else
            embed = Display.Embed(Display.Info).WithTitle("🔀 Moved voice channel")
                .AddField("From", $"<#{before.VoiceChannel.Id}>", inline: true)
                .AddField("To", $"<#{after.VoiceChannel.Id}>", inline: true);

        embed.AddField("Member", Display.User(member), inline: true).WithFooter($"User ID: {member.Id}");
        await audit.SendAsync(member.Guild, embed.Build());
    }
}
