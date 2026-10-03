# Permissions & Moderation

Moderation bots are the most common kind of bot, and the easiest to get wrong. This page explains how Discord permissions work and how the expert bots use them safely.

## How Discord decides what someone can do

1. **Server owner**: can do everything, always.
2. **Administrator** permission: can do everything, ignores channel overwrites.
3. **Role permissions**: the union of all the member's roles (plus `@everyone`).
4. **Channel overwrites**: per-channel allow/deny for roles and members, applied in order: `@everyone` → roles → the member.

Bots follow exactly the same rules. A bot is just a member with roles.

## Role hierarchy

Roles are ordered (Server Settings → Roles; higher is more powerful). You can only:

- kick, ban or time out members whose **highest role is below yours**
- assign or edit roles **below your highest role**

This applies to the bot too. The most common support question, "my bot can't ban anyone", usually means the bot's role sits below the target's role. Move the bot's role higher.

The expert bots check this **before** calling Discord, so users get a clear explanation:

```js
// javascript/03-expert/src/lib/permissions.js
if (target.id === guild.ownerId) return "You can't moderate the server owner.";
if (moderator.id !== guild.ownerId && moderator.roles.highest.position <= target.roles.highest.position)
  return 'That member has an equal or higher role than you.';
if (me.roles.highest.position <= target.roles.highest.position)
  return 'My highest role is not above that member.';
```

Python compares roles directly (`moderator.top_role <= target.top_role`). Discord.Net exposes `SocketGuildUser.Hierarchy` (the owner is `int.MaxValue`).

## Three layers of command protection

| Layer | Purpose | JS | Python | C# |
|---|---|---|---|---|
| **Default member permissions** | Hide the command from members without the permission | `.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)` | `@app_commands.default_permissions(ban_members=True)` | `[DefaultMemberPermissions(GuildPermission.BanMembers)]` |
| **Bot permission check** | Fail clearly if the bot can't do it | `member.bannable`, `interaction.appPermissions` | `@app_commands.checks.bot_has_permissions(ban_members=True)` | `[RequireBotPermission(GuildPermission.BanMembers)]` |
| **Hierarchy check** | Respect role order | `checkHierarchy()` | `check_hierarchy()` | `Display.CheckHierarchy()` |

Default member permissions are a **default**. Admins can override them per role and channel in Server Settings → Integrations. That's a feature: it lets servers give `/warn` to trial moderators without giving them the real permission. If you need a hard rule regardless of overrides, also check at runtime:

```js
if (!interaction.memberPermissions.has(PermissionFlagsBits.BanMembers)) return interaction.reply('No.');
```

```python
@app_commands.checks.has_permissions(ban_members=True)
```

```csharp
[RequireUserPermission(GuildPermission.BanMembers)]
```

## Moderation actions

| Action | JS | Python | C# |
|---|---|---|---|
| Timeout | `member.timeout(ms, reason)` | `member.timeout(timedelta, reason=)` | `member.SetTimeOutAsync(TimeSpan, options)` |
| Remove timeout | `member.timeout(null)` | `member.timeout(None)` | `member.RemoveTimeOutAsync()` |
| Kick | `member.kick(reason)` | `member.kick(reason=)` | `member.KickAsync(reason)` |
| Ban | `guild.members.ban(user, { reason, deleteMessageSeconds })` | `guild.ban(user, reason=, delete_message_seconds=)` | `guild.AddBanAsync(user, pruneDays, reason)` |
| Unban | `guild.members.unban(id, reason)` | `guild.unban(discord.Object(id), reason=)` | `guild.RemoveBanAsync(id)` |
| Bulk delete | `channel.bulkDelete(msgs, true)` | `channel.purge(limit=, check=)` | `channel.DeleteMessagesAsync(msgs)` |
| Add role | `member.roles.add(role)` | `member.add_roles(role)` | `member.AddRoleAsync(role)` |
| Nickname | `member.setNickname('x')` | `member.edit(nick='x')` | `member.ModifyAsync(p => p.Nickname = "x")` |

### Good moderation UX (what the examples do)

1. **DM before kick/ban.** Once they're gone you may no longer share a server, and DMs then fail.
2. **Put the real moderator in the audit-log reason.** The bot performs the action, so Discord's audit log shows the bot. `"ModName: reason"` keeps it traceable.
3. **Log every action** to a mod-log channel (`/settings modlog`).
4. **Reply ephemerally** to the moderator so the channel isn't spammed.
5. **Ban by user ID**, so you can ban people who already left (`/ban` takes a user option, which accepts IDs).
6. **Validate durations** (`parseDuration`), and cap timeouts at 28 days.

## Warnings system

The expert bots store warnings in SQLite:

```sql
CREATE TABLE warnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL, user_id TEXT NOT NULL, moderator_id TEXT NOT NULL,
  reason TEXT NOT NULL, created_at INTEGER NOT NULL
);
```

Ideas to extend it:

- **Auto-punish:** after 3 warnings, time out for 1 hour. After 5, ban. Check `count` in `/warn`.
- **Expiry:** ignore warnings older than 90 days (`WHERE created_at > ?`).
- **Remove one warning:** `/unwarn id`.

## AutoMod vs bot moderation

Discord's native **AutoMod** (keyword filters, spam, mention spam) runs on Discord's servers, blocks messages before anyone sees them, and keeps working when your bot is offline. Bots can create AutoMod rules through the API. Prefer AutoMod for word filters, and use bot code for things AutoMod can't do (warn systems, custom logic, logging).

## Permission values

Permissions are bit flags. Common ones:

| Permission | Bit value |
|---|---|
| Kick Members | 2 |
| Ban Members | 4 |
| Administrator | 8 |
| Manage Channels | 16 |
| Manage Guild | 32 |
| View Audit Log | 128 |
| View Channel | 1024 |
| Send Messages | 2048 |
| Manage Messages | 8192 |
| Embed Links | 16384 |
| Attach Files | 32768 |
| Read Message History | 65536 |
| Manage Roles | 268435456 |
| Moderate Members (timeout) | 1099511627776 |

Add the values together for an invite link's `permissions=` parameter (see [Getting Started](Getting-Started.md#4-invite-the-bot)).
