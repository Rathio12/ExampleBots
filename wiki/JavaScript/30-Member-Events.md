# Member Events

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Events</sub>

| | |
|---|---|
| **Events** | `GuildMemberAdd`, `GuildMemberRemove`, `GuildMemberUpdate`, `PresenceUpdate`, `UserUpdate` |
| **Intents** | `GuildMembers` ✱, `GuildPresences` ✱ (✱ privileged) |
| **Used in** | [02-enhanced guildMemberAdd.js](../../javascript/02-enhanced/src/events/guildMemberAdd.js) · [03-expert audit/](../../javascript/03-expert/src/events/audit) |

## Joins

```js
client.on(Events.GuildMemberAdd, async (member) => {
  const channel = member.guild.systemChannel;               // the server's "system messages" channel
  await channel?.send(`Welcome ${member}! You are member #${member.guild.memberCount}.`);
  await member.roles.add(AUTO_ROLE_ID).catch(() => {});     // auto-role
});
```

`member.pending` is `true` while a member hasn't completed Membership Screening. Wait for the update event before giving roles if you use screening.

## Leaves and kicks

```js
client.on(Events.GuildMemberRemove, async (member) => {
  // member may be partial (enable Partials.GuildMember): roles/joinedAt may be missing
  const logs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 5 }).catch(() => null);
  const kick = logs?.entries.find((e) => e.targetId === member.id && Date.now() - e.createdTimestamp < 15_000);
  console.log(kick ? `${member.user.tag} was kicked by ${kick.executor.tag}` : `${member.user.tag} left`);
});
```

There's no separate kick event, so the audit log tells the two apart.

## Member updates

```js
client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  if (oldMember.partial) return;

  if (oldMember.nickname !== newMember.nickname) console.log('Nickname changed');

  const added = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
  const removed = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));
  if (added.size) console.log('Roles added:', added.map((r) => r.name));
  if (removed.size) console.log('Roles removed:', removed.map((r) => r.name));

  if (!oldMember.premiumSince && newMember.premiumSince) console.log(`${newMember.user.tag} boosted!`);
  if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) console.log('Timeout changed');
  if (oldMember.pending && !newMember.pending) console.log('Passed membership screening');
});
```

## Boost announcements

```js
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (!oldMember.premiumSince && newMember.premiumSince) {
    await newMember.guild.systemChannel?.send(`💜 Thanks for boosting, ${newMember}!`);
  }
});
```

## Presence (status and activities)

Requires the **Presence** privileged intent. Use it only if you really need it:

```js
client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
  const playing = newPresence.activities.find((a) => a.type === ActivityType.Playing);
  if (playing) console.log(`${newPresence.user?.tag} is playing ${playing.name}`);
  console.log(newPresence.status);   // online, idle, dnd, offline
});
```

## Global user changes

```js
client.on(Events.UserUpdate, (oldUser, newUser) => {
  if (oldUser.username !== newUser.username) console.log(`${oldUser.username} → ${newUser.username}`);
});
```

Fires for users the bot shares a server with (cached members).

## See also
- [Members](23-Members.md) · [Events](28-Events.md) · [Audit Log System](../Audit-Log-System.md)
