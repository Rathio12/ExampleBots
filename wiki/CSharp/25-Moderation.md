# Moderation

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Moderation-FF453A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key APIs** | `SetTimeOutAsync`, `RemoveTimeOutAsync`, `KickAsync`, `AddBanAsync`, `RemoveBanAsync`, `DeleteMessagesAsync` |
| **Used in** | [03-expert ModerationModule.cs](../../csharp/03-expert/src/ExpertBot/Modules/ModerationModule.cs) |

## Actions

```csharp
var reason = new RequestOptions { AuditLogReason = "Spamming" };

await member.SetTimeOutAsync(TimeSpan.FromMinutes(10), reason);     // max 28 days
await member.RemoveTimeOutAsync(reason);

await member.KickAsync("Breaking rule 3");

await Context.Guild.AddBanAsync(user, pruneDays: 1, reason: "Raiding");   // works for users who already left
await Context.Guild.RemoveBanAsync(userId);

var ban = await Context.Guild.GetBanAsync(userId);                   // null if not banned
var bans = await Context.Guild.GetBansAsync(1000).FlattenAsync();

await ((ITextChannel)Context.Channel).DeleteMessagesAsync(messages);
```

| Action | Permission |
|---|---|
| Timeout | Moderate Members |
| Kick | Kick Members |
| Ban / unban | Ban Members |
| Purge | Manage Messages |

## A complete, safe moderation command

```csharp
[SlashCommand("kick", "Kick a member")]
[DefaultMemberPermissions(GuildPermission.KickMembers)]      // 1. hidden from non-moderators
[RequireBotPermission(GuildPermission.KickMembers)]          // 2. bot can actually do it
[CommandContextType(InteractionContextType.Guild)]
public async Task KickAsync(SocketGuildUser member, [MaxLength(500)] string? reason = null)
{
    if (CheckHierarchy((SocketGuildUser)Context.User, member) is { } problem)   // 3. role hierarchy
    {
        await RespondAsync($"❌ {problem}", ephemeral: true);
        return;
    }

    reason ??= "No reason provided";
    try { await member.SendMessageAsync($"You were kicked from {Context.Guild.Name}: {reason}"); } catch { }   // 4. DM first
    await member.KickAsync(options: new RequestOptions { AuditLogReason = $"{Context.User.Username}: {reason}" });   // 5. real moderator in audit log

    await modlog.LogAsync(Context.Guild, "Kick", Context.User, member, reason);
    await RespondAsync($"👢 Kicked {member.Mention}.", ephemeral: true);           // 6. ephemeral confirmation
}
```

## Hierarchy check

```csharp
public static string? CheckHierarchy(SocketGuildUser moderator, SocketGuildUser target)
{
    var guild = target.Guild;
    if (target.Id == moderator.Id) return "You can't use this on yourself.";
    if (target.Id == guild.OwnerId) return "You can't moderate the server owner.";
    if (moderator.Id != guild.OwnerId && moderator.Hierarchy <= target.Hierarchy) return "That member has an equal or higher role than you.";
    if (guild.CurrentUser.Hierarchy <= target.Hierarchy) return "My role is not high enough.";
    return null;
}
```

## Purge with a filter

```csharp
var messages = await Context.Channel.GetMessagesAsync(amount).FlattenAsync();
var deletable = messages
    .Where(m => user is null || m.Author.Id == user.Id)
    .Where(m => DateTimeOffset.UtcNow - m.Timestamp < TimeSpan.FromDays(14))
    .ToList();
await ((ITextChannel)Context.Channel).DeleteMessagesAsync(deletable);
```

## Lockdown and slowmode

```csharp
var channel = (SocketTextChannel)Context.Channel;
await channel.AddPermissionOverwriteAsync(Context.Guild.EveryoneRole, new OverwritePermissions(sendMessages: PermValue.Deny));
await channel.RemovePermissionOverwriteAsync(Context.Guild.EveryoneRole);     // back to inherit
await channel.ModifyAsync(p => p.SlowModeInterval = 30);
```

## AutoMod rules

```csharp
await Context.Guild.CreateAutoModRuleAsync(p =>
{
    p.Name = "Block invites";
    p.EventType = AutoModEventType.MessageSend;
    p.TriggerType = AutoModTriggerType.Keyword;
    p.RegexPatterns = new[] { @"discord\.gg/\w+" };
    p.Actions = new[] { new AutoModRuleActionProperties { Type = AutoModActionType.BlockMessage } };
    p.Enabled = true;
});
```

## See also
- [Permissions](26-Permissions.md) · [Permissions & Moderation](../Permissions-and-Moderation.md) · [Audit Log System](../Audit-Log-System.md)
