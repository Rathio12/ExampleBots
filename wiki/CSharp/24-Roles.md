# Roles

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Server-FF9F0A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key types** | `SocketRole`, `IRole`, `GuildPermissions` |
| **Permission** | Manage Roles. The bot's highest role must be above the role it manages. |

## Finding roles

```csharp
var role = Context.Guild.GetRole(roleId);
var byName = Context.Guild.Roles.FirstOrDefault(r => r.Name == "Moderator");
var everyone = Context.Guild.EveryoneRole;
```

## Assigning and removing

```csharp
await member.AddRoleAsync(role);
await member.AddRoleAsync(roleId, new RequestOptions { AuditLogReason = "Verified" });
await member.AddRolesAsync([roleIdA, roleIdB]);
await member.RemoveRoleAsync(role);
await member.RemoveRolesAsync([roleIdA]);

var hasRole = member.Roles.Any(r => r.Id == roleId);
```

## Creating roles

```csharp
var newRole = await Context.Guild.CreateRoleAsync(
    name: "Event Winner",
    permissions: new GuildPermissions(sendMessages: true, attachFiles: true),
    color: new Color(0xF1C40F),
    isHoisted: true,
    isMentionable: false);
```

## Editing and deleting

```csharp
await newRole.ModifyAsync(p =>
{
    p.Name = "Champion";
    p.Hoist = false;
    p.Permissions = GuildPermissions.None;
});
await newRole.DeleteAsync();
```

## Role properties

| Property | Meaning |
|---|---|
| `Name`, `Id`, `Mention` | |
| `Position` | Higher = more powerful |
| `Permissions` | `GuildPermissions` (`.RawValue`, `.ToList()`) |
| `Members` | Cached members with the role |
| `IsManaged` | Owned by an integration/bot |
| `IsEveryone` | The @everyone role |
| `IsHoisted`, `IsMentionable` | |
| `Colors.PrimaryColor` | Role colour (the older `Color` property is deprecated) |

## Hierarchy check

```csharp
if (Context.Guild.CurrentUser.Hierarchy <= role.Position)
{
    await RespondAsync("My role must be above that role. Move it higher in Server Settings → Roles.", ephemeral: true);
    return;
}
```

## Level roles

```csharp
private static readonly Dictionary<int, ulong> LevelRoles = new() { [5] = 111111111111111111, [10] = 222222222222222222 };

public static async Task OnLevelUpAsync(SocketGuildUser member, int level)
{
    if (LevelRoles.TryGetValue(level, out var roleId))
        await member.AddRoleAsync(roleId, new RequestOptions { AuditLogReason = $"Reached level {level}" });
}
```

## See also
- [Members](23-Members.md) · [Permissions](26-Permissions.md) · [Select Menus](13-Select-Menus.md)
