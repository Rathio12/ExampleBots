using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using ExpertBot.Data;
using ExpertBot.Services;
using ExpertBot.Utils;

namespace ExpertBot.Modules;

/// <summary>Choices for /ban. Enums become dropdown choices automatically.</summary>
public enum DeleteMessages
{
    [ChoiceDisplay("Don't delete any")] None = 0,
    [ChoiceDisplay("Previous 24 hours")] Day = 1,
    [ChoiceDisplay("Previous 7 days")] Week = 7,
}

/// <summary>
/// Moderation commands. <c>DefaultMemberPermissions</c> hides a command from members
/// without that permission (admins can override in Server Settings → Integrations).
/// <c>RequireBotPermission</c> checks the bot can actually perform the action.
/// </summary>
[CommandContextType(InteractionContextType.Guild)]
public sealed class ModerationModule(WarningRepository warnings, ModLogService modlog) : InteractionModuleBase<SocketInteractionContext>
{
    private const long MaxTimeoutSeconds = 28 * 86_400; // Discord's limit is 28 days

    private SocketGuildUser Moderator => (SocketGuildUser)Context.User;

    /// <summary>Replies with an error and returns false when the hierarchy forbids the action.</summary>
    private async Task<bool> EnsureCanModerateAsync(SocketGuildUser target)
    {
        if (Display.CheckHierarchy(Moderator, target) is not { } problem) return true;
        await RespondAsync($"❌ {problem}", ephemeral: true);
        return false;
    }

    // ------------------------------------------------------------------ Warnings

    [SlashCommand("warn", "Warn a member (stored permanently)")]
    [DefaultMemberPermissions(GuildPermission.ModerateMembers)]
    public async Task WarnAsync(SocketGuildUser member, [MaxLength(500)] string reason)
    {
        if (!await EnsureCanModerateAsync(member)) return;

        var id = await warnings.AddAsync(Context.Guild.Id, member.Id, Context.User.Id, reason);
        var count = (await warnings.ListAsync(Context.Guild.Id, member.Id)).Count;

        var dmSent = await ModLogService.NotifyAsync(member, Context.Guild, $"You were warned: {reason}");
        await modlog.LogAsync(Context.Guild, "Warn", Context.User, member, reason, ("Total warnings", count.ToString(), true));

        var embed = Display.Embed(Display.Warning)
            .WithDescription($"⚠️ Warned {Display.User(member)} (warning #{id}, total {count}).")
            .WithFooter(dmSent ? "The member was notified by DM." : "Could not DM the member.")
            .Build();
        await RespondAsync(embed: embed, ephemeral: true);
    }

    [SlashCommand("warnings", "List a member's warnings")]
    [DefaultMemberPermissions(GuildPermission.ModerateMembers)]
    public async Task WarningsAsync(IUser user)
    {
        var rows = await warnings.ListAsync(Context.Guild.Id, user.Id);
        var lines = rows.Take(15).Select(w =>
            $"**#{w.Id}** • {Display.Time(w.CreatedAt)} by <@{w.ModeratorId}>\n> {Display.Truncate(w.Reason, 200)}");

        var embed = Display.Embed(rows.Count > 0 ? Display.Warning : Display.Success)
            .WithAuthor($"{user.Username} — {rows.Count} warning(s)", user.GetDisplayAvatarUrl())
            .WithDescription(rows.Count > 0 ? string.Join("\n\n", lines) : "No warnings. ✨");
        if (rows.Count > 15) embed.WithFooter($"Showing the 15 most recent of {rows.Count}");

        await RespondAsync(embed: embed.Build(), ephemeral: true, allowedMentions: AllowedMentions.None);
    }

    [SlashCommand("clearwarnings", "Delete all warnings of a member")]
    [DefaultMemberPermissions(GuildPermission.ManageGuild)]
    public async Task ClearWarningsAsync(IUser user, [MaxLength(500)] string? reason = null)
    {
        var removed = await warnings.ClearAsync(Context.Guild.Id, user.Id);
        if (removed > 0)
            await modlog.LogAsync(Context.Guild, "Clear warnings", Context.User, user, reason, ("Removed", removed.ToString(), true));

        await RespondAsync(removed > 0 ? $"🧹 Removed {removed} warning(s) from **{user.Username}**." : $"**{user.Username}** has no warnings.", ephemeral: true);
    }

    // ------------------------------------------------------------------ Timeouts

    [SlashCommand("timeout", "Temporarily mute a member")]
    [DefaultMemberPermissions(GuildPermission.ModerateMembers)]
    [RequireBotPermission(GuildPermission.ModerateMembers)]
    public async Task TimeoutAsync(
        SocketGuildUser member,
        [Summary(description: "e.g. 10m, 1h, 1d12h (max 28d)")] string duration,
        [MaxLength(500)] string? reason = null)
    {
        if (Duration.Parse(duration) is not { } seconds || seconds > MaxTimeoutSeconds)
        {
            await RespondAsync("❌ Use a duration like `10m`, `2h` or `1d` (max 28d).", ephemeral: true);
            return;
        }
        if (!await EnsureCanModerateAsync(member)) return;

        reason ??= "No reason provided";
        await member.SetTimeOutAsync(TimeSpan.FromSeconds(seconds), Display.Reason(Context.User, reason));

        var endsAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds() + seconds;
        await ModLogService.NotifyAsync(member, Context.Guild, $"You were timed out for {Duration.Format(seconds)}: {reason}");
        await modlog.LogAsync(Context.Guild, "Timeout", Context.User, member, reason,
            ("Duration", Duration.Format(seconds), true), ("Ends", Display.Time(endsAt), true));

        await RespondAsync($"🔇 {Display.User(member)} is timed out until {Display.Time(endsAt, 'f')}.", ephemeral: true);
    }

    [SlashCommand("untimeout", "Remove a member's timeout")]
    [DefaultMemberPermissions(GuildPermission.ModerateMembers)]
    [RequireBotPermission(GuildPermission.ModerateMembers)]
    public async Task UntimeoutAsync(SocketGuildUser member, [MaxLength(500)] string? reason = null)
    {
        if (!await EnsureCanModerateAsync(member)) return;
        if (member.TimedOutUntil is null || member.TimedOutUntil < DateTimeOffset.UtcNow)
        {
            await RespondAsync("That member is not timed out.", ephemeral: true);
            return;
        }

        reason ??= "No reason provided";
        await member.RemoveTimeOutAsync(Display.Reason(Context.User, reason));
        await modlog.LogAsync(Context.Guild, "Remove timeout", Context.User, member, reason);
        await RespondAsync($"🔊 Removed the timeout from {Display.User(member)}.", ephemeral: true);
    }

    // ------------------------------------------------------------- Kick and ban

    [SlashCommand("kick", "Kick a member from the server")]
    [DefaultMemberPermissions(GuildPermission.KickMembers)]
    [RequireBotPermission(GuildPermission.KickMembers)]
    public async Task KickAsync(SocketGuildUser member, [MaxLength(500)] string? reason = null)
    {
        if (!await EnsureCanModerateAsync(member)) return;

        reason ??= "No reason provided";
        // DM first — after the kick we may no longer share a server.
        await ModLogService.NotifyAsync(member, Context.Guild, $"You were kicked: {reason}");
        await member.KickAsync(options: Display.Reason(Context.User, reason));

        await modlog.LogAsync(Context.Guild, "Kick", Context.User, member, reason);
        await RespondAsync($"👢 Kicked {Display.User(member)}.", ephemeral: true);
    }

    [SlashCommand("ban", "Ban a user (works even if they already left)")]
    [DefaultMemberPermissions(GuildPermission.BanMembers)]
    [RequireBotPermission(GuildPermission.BanMembers)]
    public async Task BanAsync(
        IUser user,
        [MaxLength(500)] string? reason = null,
        [Summary("delete_messages", "Delete their recent messages")] DeleteMessages deleteMessages = DeleteMessages.None)
    {
        reason ??= "No reason provided";
        // Hierarchy only matters if they are still a member.
        if (Context.Guild.GetUser(user.Id) is { } member)
        {
            if (!await EnsureCanModerateAsync(member)) return;
            await ModLogService.NotifyAsync(member, Context.Guild, $"You were banned: {reason}");
        }

        await Context.Guild.AddBanAsync(user, (int)deleteMessages, options: Display.Reason(Context.User, reason));
        await modlog.LogAsync(Context.Guild, "Ban", Context.User, user, reason);
        await RespondAsync($"🔨 Banned {Display.User(user)}.", ephemeral: true);
    }

    [SlashCommand("unban", "Unban a user by ID")]
    [DefaultMemberPermissions(GuildPermission.BanMembers)]
    [RequireBotPermission(GuildPermission.BanMembers)]
    public async Task UnbanAsync(
        // Banned users aren't members, so a user option can't select them — take the ID as text.
        [Summary("user_id", "ID of the banned user")] string userId,
        [MaxLength(500)] string? reason = null)
    {
        if (!ulong.TryParse(userId.Trim(), out var id))
        {
            await RespondAsync("❌ That is not a valid user ID.", ephemeral: true);
            return;
        }
        if (await Context.Guild.GetBanAsync(id) is not { } ban)
        {
            await RespondAsync("❌ That user is not banned.", ephemeral: true);
            return;
        }

        reason ??= "No reason provided";
        await Context.Guild.RemoveBanAsync(id, Display.Reason(Context.User, reason));
        await modlog.LogAsync(Context.Guild, "Unban", Context.User, ban.User, reason);
        await RespondAsync($"✅ Unbanned **{ban.User.Username}**.", ephemeral: true);
    }

    // -------------------------------------------------------------------- Purge

    [SlashCommand("purge", "Bulk-delete recent messages in this channel")]
    [DefaultMemberPermissions(GuildPermission.ManageMessages)]
    [RequireBotPermission(ChannelPermission.ManageMessages)]
    public async Task PurgeAsync(
        [Summary(description: "How many messages to check (1-100)"), MinValue(1), MaxValue(100)] int amount,
        [Summary(description: "Only delete messages from this user")] IUser? user = null)
    {
        await DeferAsync(ephemeral: true);

        var messages = await Context.Channel.GetMessagesAsync(amount).FlattenAsync();
        // Discord can only bulk-delete messages younger than 14 days.
        var deletable = messages
            .Where(m => user is null || m.Author.Id == user.Id)
            .Where(m => DateTimeOffset.UtcNow - m.Timestamp < TimeSpan.FromDays(14))
            .ToList();

        if (deletable.Count > 0)
            await ((ITextChannel)Context.Channel).DeleteMessagesAsync(deletable, Display.Reason(Context.User, "purge"));

        var fields = new List<(string, string, bool)> { ("Channel", $"<#{Context.Channel.Id}>", true), ("Deleted", deletable.Count.ToString(), true) };
        if (user is not null) fields.Add(("Filter", user.Mention, true));
        await modlog.LogAsync(Context.Guild, "Purge", Context.User, fields: [.. fields]);

        await FollowupAsync($"🧹 Deleted **{deletable.Count}** message(s).", ephemeral: true);
    }
}
