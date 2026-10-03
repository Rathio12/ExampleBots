# Members

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Server-FF9F0A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key types** | `SocketGuildUser`, `IGuildUser`, `IUser`, `RestGuildUser` |
| **Intents** | `GuildMembers` (privileged) for member cache and events |
| **Used in** | [02-enhanced GeneralModule.cs](../../csharp/02-enhanced/Modules/GeneralModule.cs) (`/userinfo`) |

`IUser` is a Discord account. `IGuildUser` / `SocketGuildUser` is that user in one guild, with nickname, roles, join date and timeout.

## Getting members

```csharp
var member = Context.User as SocketGuildUser;                     // invoking member (in guilds)
var cached = Context.Guild.GetUser(userId);                       // cache (null if not cached)
var rest = await Context.Client.Rest.GetGuildUserAsync(Context.Guild.Id, userId);   // REST, null if not a member
var me = Context.Guild.CurrentUser;                               // the bot
```

Fill the cache at startup with `AlwaysDownloadUsers = true`, or on demand with `await Context.Guild.DownloadUsersAsync()`.

## Member properties

| Property | Meaning |
|---|---|
| `DisplayName` | Nickname → global name → username |
| `Nickname` | Server nickname or null |
| `Roles` | Roles (includes @everyone) |
| `Hierarchy` | Position of the highest role (owner = `int.MaxValue`) |
| `JoinedAt` | Join date |
| `PremiumSince` | Boosting since |
| `TimedOutUntil` | Timeout end |
| `GuildPermissions` | Server-wide permissions |
| `GetDisplayAvatarUrl()` / `GetGuildAvatarUrl()` | Avatars |
| `VoiceChannel`, `IsMuted`, `IsDeafened` | Voice state |
| `IsPending` | Hasn't completed membership screening |
| `Status`, `Activities` | Presence (Presence intent) |

User properties: `Username`, `GlobalName`, `Id`, `IsBot`, `CreatedAt`, `Mention`, `GetAvatarUrl()`.

## Editing members

```csharp
await member.ModifyAsync(p => p.Nickname = "New Nick");
await member.ModifyAsync(p => p.Nickname = null);                    // reset
await member.ModifyAsync(p => p.Channel = new Optional<IVoiceChannel>(voiceChannel));   // move
await member.ModifyAsync(p => { p.Mute = true; p.Deaf = false; });   // server mute/deafen
```

## Listing and searching

```csharp
var humans = Context.Guild.Users.Where(u => !u.IsBot);              // cached members
var found = await Context.Guild.SearchUsersAsync("ali", limit: 10);  // username/nickname prefix (REST)
var withRole = role.Members;                                         // cached members with a role
```

## Account age

```csharp
var age = DateTimeOffset.UtcNow - member.CreatedAt;
if (age < TimeSpan.FromDays(7)) await logChannel.SendMessageAsync($"⚠️ {member.Mention} has a {age.Days}-day-old account");
```

## Hierarchy comparison

```csharp
if (moderator.Id != Context.Guild.OwnerId && moderator.Hierarchy <= target.Hierarchy) { /* can't moderate */ }
```

## See also
- [Roles](24-Roles.md) · [Moderation](25-Moderation.md) · [Member Events](30-Member-Events.md)
