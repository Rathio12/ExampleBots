# Permissions

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Moderation-FF453A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key types** | `GuildPermission`, `GuildPermissions`, `ChannelPermissions`, `OverwritePermissions`, `PreconditionAttribute` |
| **Used in** | [03-expert SettingsModule.cs](../../csharp/03-expert/src/ExpertBot/Modules/SettingsModule.cs) · [Display.cs](../../csharp/03-expert/src/ExpertBot/Utils/Display.cs) |

## Command-level

```csharp
[DefaultMemberPermissions(GuildPermission.ManageMessages)]   // visibility (admins can override)
[RequireUserPermission(GuildPermission.ManageMessages)]      // runtime check: user
[RequireBotPermission(GuildPermission.ManageMessages)]       // runtime check: bot (guild-wide)
[RequireBotPermission(ChannelPermission.ManageMessages)]     // runtime check: bot in this channel
[RequireRole("Moderator")]                                   // by role name (or ID)
[RequireOwner]                                               // application owner only
[RequireContext(ContextType.Guild)]
```

Failed preconditions don't throw. They arrive in `InteractionExecuted` with `InteractionCommandError.UnmetPrecondition` and a readable `ErrorReason` ([Error Handling](34-Error-Handling.md)).

### Custom precondition

```csharp
public sealed class RequireStaffAttribute : PreconditionAttribute
{
    public override Task<PreconditionResult> CheckRequirementsAsync(IInteractionContext context, ICommandInfo commandInfo, IServiceProvider services)
    {
        var isStaff = context.User is IGuildUser { GuildPermissions.ManageMessages: true };
        return Task.FromResult(isStaff ? PreconditionResult.FromSuccess() : PreconditionResult.FromError("Staff only."));
    }
}
```

## Checking permissions in code

```csharp
var perms = Context.Interaction.Permissions;                          // user's permissions in this channel
var canBan = ((SocketGuildUser)Context.User).GuildPermissions.BanMembers;
var inChannel = ((SocketGuildUser)Context.User).GetPermissions((IGuildChannel)Context.Channel);
var bot = Context.Guild.CurrentUser.GetPermissions(channel);
if (!bot.SendMessages || !bot.EmbedLinks) { … }
```

## Channel overwrites

```csharp
await channel.AddPermissionOverwriteAsync(role, new OverwritePermissions(viewChannel: PermValue.Allow, sendMessages: PermValue.Deny));
await channel.AddPermissionOverwriteAsync(member, OverwritePermissions.InheritAll.Modify(sendMessages: PermValue.Allow));
await channel.RemovePermissionOverwriteAsync(role);
await channel.SyncPermissionsAsync();                                 // copy from the category

foreach (var overwrite in channel.PermissionOverwrites)
    Console.WriteLine($"{overwrite.TargetType} {overwrite.TargetId}: +{overwrite.Permissions.AllowValue} -{overwrite.Permissions.DenyValue}");
```

`PermValue` is `Allow`, `Deny` or `Inherit`.

## Permission values

```csharp
var p = new GuildPermissions(sendMessages: true, embedLinks: true);
ulong raw = p.RawValue;
List<GuildPermission> list = p.ToList();
var all = GuildPermissions.All;
var none = GuildPermissions.None;

// Diff (audit log)
var granted = after.Permissions.ToList().Except(before.Permissions.ToList());
```

## Invite link

```csharp
var url = $"https://discord.com/oauth2/authorize?client_id={client.CurrentUser.Id}&scope=bot+applications.commands&permissions={new GuildPermissions(sendMessages: true, embedLinks: true).RawValue}";
```

## See also
- [Moderation](25-Moderation.md) · [Roles](24-Roles.md) · [Permissions & Moderation](../Permissions-and-Moderation.md)
