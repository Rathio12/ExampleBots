# Cooldowns

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Used in** | [02-enhanced cooldowns.js](../../javascript/02-enhanced/src/utils/cooldowns.js) · [03-expert cooldowns.js](../../javascript/03-expert/src/utils/cooldowns.js) |

Cooldowns stop users from spamming commands, and protect you from rate limits and paid-API bills.

## Simple per-user, per-command cooldown

```js
// utils/cooldowns.js
const cooldowns = new Map();   // "command:userId" → expiresAt (ms)

/** @returns {number} 0 if allowed, otherwise seconds left */
export function checkCooldown(commandName, userId, seconds) {
  const key = `${commandName}:${userId}`;
  const now = Date.now();
  const expiresAt = cooldowns.get(key) ?? 0;
  if (now < expiresAt) return Math.ceil((expiresAt - now) / 1000);

  cooldowns.set(key, now + seconds * 1000);
  setTimeout(() => cooldowns.delete(key), seconds * 1000).unref();   // keep the map small
  return 0;
}
```

## Wiring it into the router

```js
// command file
export default { data, cooldown: 10, async execute(interaction) { /* … */ } };

// interactionCreate
const wait = checkCooldown(command.data.name, interaction.user.id, command.cooldown ?? 3);
if (wait > 0) {
  return interaction.reply({ content: `⏳ Try again in ${wait}s.`, flags: MessageFlags.Ephemeral });
}
await command.execute(interaction);
```

Show the time as a live countdown with a Discord timestamp:

```js
content: `⏳ You can use this again <t:${Math.floor(expiresAt / 1000)}:R>.`
```

## Variations

| Scope | Key |
|---|---|
| Per user, per command | `${command}:${userId}` |
| Per user, global | `${userId}` |
| Per guild | `${command}:${guildId}` |
| Per channel | `${command}:${channelId}` |

### Bypass for moderators

```js
if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
  const wait = checkCooldown(/* … */);
  if (wait) return /* … */;
}
```

### Uses per window ("3 times per minute")

```js
const usage = new Map();   // key → timestamps[]
function allow(key, limit, windowMs) {
  const now = Date.now();
  const recent = (usage.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  usage.set(key, recent);
  return true;
}
```

## Persistence and scale

In-memory cooldowns reset on restart, which is fine for anti-spam. For daily rewards ("once per 24 h"), store the last claim time in the **database**. With multiple processes, use **Redis** (`SET key 1 EX 60 NX`).

## XP cooldown

The expert bot uses the same idea for XP: one award per user per minute (`XP_COOLDOWN_SECONDS`).

## See also
- [Error Handling](34-Error-Handling.md) · [SQLite Database](37-SQLite-Database.md)
