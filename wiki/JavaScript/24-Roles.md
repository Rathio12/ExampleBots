# Roles

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Server-FF9F0A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key classes** | `Role`, `RoleManager`, `GuildMemberRoleManager` |
| **Permission** | Manage Roles (and the bot's role must be **above** the role it manages) |

## Finding roles

```js
const role = guild.roles.cache.get('123456789012345678');
const byName = guild.roles.cache.find((r) => r.name === 'Moderator');
const everyone = guild.roles.everyone;
const highest = guild.roles.highest;
const fetched = await guild.roles.fetch(roleId);
```

## Assigning and removing

```js
await member.roles.add(role, 'Verified');
await member.roles.add([roleIdA, roleIdB]);
await member.roles.remove(role);
await member.roles.set([roleIdA]);           // replace all roles (except managed ones)

const hasRole = member.roles.cache.has(roleId);
const hasAny = member.roles.cache.some((r) => ['Admin', 'Mod'].includes(r.name));
```

## Creating roles

```js
import { PermissionFlagsBits } from 'discord.js';

const role = await guild.roles.create({
  name: 'Event Winner',
  color: 0xf1c40f,                         // newer versions also accept colors: { primaryColor: 0xf1c40f }
  hoist: true,                             // show separately in the member list
  mentionable: false,
  permissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
  reason: 'Monthly event',
});
```

Roles can have a gradient: recent discord.js versions accept `colors: { primaryColor, secondaryColor }` (the server needs the feature unlocked).

## Editing and deleting

```js
await role.setName('Champion');
await role.edit({ color: 0xe74c3c, hoist: false, permissions: [] });
await role.setPosition(5);
await role.delete('Event over');
```

## Role properties

| Property | Meaning |
|---|---|
| `role.name`, `role.id` | |
| `role.hexColor` | e.g. `#f1c40f` |
| `role.position` | Higher number = higher in the list |
| `role.permissions` | `PermissionsBitField` |
| `role.members` | Cached members with this role |
| `role.managed` | Owned by an integration (bot role, boost role). Can't be assigned manually. |
| `role.editable` | Can the bot edit it (hierarchy check)? |
| `role.mentionable`, `role.hoist` | |
| `role.icon`, `role.unicodeEmoji` | Role icon (boosted servers) |

## Hierarchy check before assigning

```js
if (!role.editable) {
  return interaction.reply('My role must be above that role. Drag my role higher in Server Settings → Roles.');
}
```

Users also can't hand out roles above their own: `interaction.member.roles.highest.comparePositionTo(role) > 0`.

## Level roles example

```js
const LEVEL_ROLES = { 5: '111111111111111111', 10: '222222222222222222', 25: '333333333333333333' };

async function onLevelUp(member, level) {
  const roleId = LEVEL_ROLES[level];
  if (roleId) await member.roles.add(roleId, `Reached level ${level}`).catch(() => {});
}
```

## See also
- [Members](23-Members.md) · [Permissions](26-Permissions.md) · [Select Menus](13-Select-Menus.md) (role pickers)
