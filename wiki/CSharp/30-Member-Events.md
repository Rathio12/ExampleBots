# Member Events

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Events</sub>

| | |
|---|---|
| **Events** | `UserJoined`, `UserLeft`, `GuildMemberUpdated`, `PresenceUpdated`, `UserUpdated` |
| **Intents** | `GuildMembers` ✱, `GuildPresences` ✱ (✱ privileged) |
| **Used in** | [02-enhanced WelcomeService.cs](../../csharp/02-enhanced/Services/WelcomeService.cs) · [03-expert AuditEventHandlers.cs](../../csharp/03-expert/src/ExpertBot/Services/AuditEventHandlers.cs) |

## Joins

```csharp
client.UserJoined += async member =>
{
    if (member.Guild.SystemChannel is { } channel)
        await channel.SendMessageAsync($"Welcome {member.Mention}! You are member #{member.Guild.MemberCount}.");
    await member.AddRoleAsync(AutoRoleId);
};
```

## Leaves and kicks

```csharp
client.UserLeft += async (guild, user) =>
{
    var entries = await guild.GetAuditLogsAsync(5, actionType: ActionType.Kick).FlattenAsync();
    var kick = entries.FirstOrDefault(e =>
        e.Data is KickAuditLogData d && d.Target?.Id == user.Id && DateTimeOffset.UtcNow - e.CreatedAt < TimeSpan.FromSeconds(15));
    Console.WriteLine(kick is null ? $"{user.Username} left" : $"{user.Username} was kicked by {kick.User.Username}");
};
```

`KickAuditLogData` lives in `Discord.Rest`. Reading the audit log needs **View Audit Log**.

## Member updates

```csharp
client.GuildMemberUpdated += async (cachedBefore, after) =>
{
    if (!cachedBefore.HasValue) return;                 // nothing to compare
    var before = cachedBefore.Value;

    if (before.Nickname != after.Nickname) Console.WriteLine("Nickname changed");

    var added = after.Roles.Where(r => before.Roles.All(b => b.Id != r.Id));
    var removed = before.Roles.Where(r => after.Roles.All(a => a.Id != r.Id));

    if (before.PremiumSince is null && after.PremiumSince is not null && after.Guild.SystemChannel is { } ch)
        await ch.SendMessageAsync($"💜 Thanks for boosting, {after.Mention}!");

    if (before.TimedOutUntil != after.TimedOutUntil) Console.WriteLine("Timeout changed");
};
```

For a "before" state, members must be cached: `AlwaysDownloadUsers = true`.

## Presence

```csharp
client.PresenceUpdated += (user, before, after) =>
{
    var game = after.Activities.OfType<Game>().FirstOrDefault();
    if (game is not null) Console.WriteLine($"{user.Username} is playing {game.Name}");
    Console.WriteLine(after.Status);   // Online, Idle, DoNotDisturb, Offline
    return Task.CompletedTask;
};
```

## Global user changes

```csharp
client.UserUpdated += (before, after) =>
{
    if (before.Username != after.Username) Console.WriteLine($"{before.Username} → {after.Username}");
    return Task.CompletedTask;
};
```

## See also
- [Members](23-Members.md) · [Events](28-Events.md) · [Audit Log System](../Audit-Log-System.md)
