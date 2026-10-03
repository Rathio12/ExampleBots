# Permissions

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Moderation-FF453A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key classes** | `PermissionFlagsBits`, `PermissionsBitField`, `PermissionOverwriteManager` |
| **Used in** | [03-expert settings.js](../../javascript/03-expert/src/commands/utility/settings.js) · [permissions.js](../../javascript/03-expert/src/lib/permissions.js) |

## Command visibility

```js
new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Delete messages')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);    // several: A | B

.setDefaultMemberPermissions(0);   // hidden from everyone except admins
```

Admins can override per role and channel (Server Settings → Integrations).

## Checking a member's permissions

```js
// In the current channel (includes overwrites), the most accurate for commands
interaction.memberPermissions.has(PermissionFlagsBits.BanMembers);

// Server-wide
member.permissions.has(PermissionFlagsBits.ManageGuild);

// In a specific channel
channel.permissionsFor(member).has(PermissionFlagsBits.SendMessages);

// Several at once (all must be present)
member.permissions.has([PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers]);

// Administrator bypasses everything: has() returns true for admins by default
member.permissions.has(PermissionFlagsBits.ManageMessages, false);   // false = don't treat admin as having it
```

## Checking the bot's permissions

```js
interaction.appPermissions.has(PermissionFlagsBits.EmbedLinks);          // in this channel
guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles);       // server-wide

const required = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks];
const missing = channel.permissionsFor(guild.members.me).missing(required);
if (missing.length) return interaction.reply(`I need: ${missing.join(', ')}`);
```

`missing()` returns readable names like `['EmbedLinks']`.

## Channel overwrites

```js
// Allow / deny / reset (null = inherit) for a role or member
await channel.permissionOverwrites.edit(role, { ViewChannel: true, SendMessages: false });
await channel.permissionOverwrites.edit(member, { SendMessages: true });
await channel.permissionOverwrites.edit(role, { SendMessages: null });
await channel.permissionOverwrites.delete(role);

// Replace all overwrites at once
await channel.permissionOverwrites.set([
  { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
  { id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
]);

// Copy overwrites from the category
await channel.lockPermissions();
```

## Bitfields

```js
const perms = new PermissionsBitField([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]);
perms.bitfield;          // 18432n (BigInt)
perms.toArray();         // ['SendMessages', 'EmbedLinks']
perms.add(PermissionFlagsBits.AttachFiles);
perms.has(PermissionFlagsBits.SendMessages);
```

Comparing a role before and after an update (used by the audit log):

```js
const before = new Set(oldRole.permissions.toArray());
const after = new Set(newRole.permissions.toArray());
const granted = [...after].filter((p) => !before.has(p));
const revoked = [...before].filter((p) => !after.has(p));
```

## Owner-only commands

```js
const app = await client.application.fetch();
const ownerId = app.owner?.id;   // for team-owned apps: app.owner.members
if (interaction.user.id !== ownerId) return interaction.reply({ content: 'Owner only.', flags: MessageFlags.Ephemeral });
```

## Common flags

`Administrator`, `ManageGuild`, `ManageRoles`, `ManageChannels`, `KickMembers`, `BanMembers`, `ModerateMembers`, `ManageMessages`, `ViewAuditLog`, `ViewChannel`, `SendMessages`, `EmbedLinks`, `AttachFiles`, `ReadMessageHistory`, `MentionEveryone`, `ManageWebhooks`, `ManageThreads`, `Connect`, `Speak`, `MoveMembers`, `MuteMembers`.

## See also
- [Moderation](25-Moderation.md) · [Roles](24-Roles.md) · [Permissions & Moderation](../Permissions-and-Moderation.md)
