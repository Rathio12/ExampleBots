# Members

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Server-FF9F0A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key classes** | `GuildMember`, `GuildMemberManager`, `User` |
| **Intents** | `GuildMembers` (privileged) for member lists and events |
| **Used in** | [02-enhanced userinfo.js](../../javascript/02-enhanced/src/commands/userinfo.js) |

A **User** is a Discord account (global). A **GuildMember** is that user *in one server*: nickname, roles, join date, timeout, server avatar.

## Getting a member

```js
const member = interaction.member;                         // who ran the command
const cached = guild.members.cache.get(userId);            // instant, may be undefined
const fetched = await guild.members.fetch(userId);         // API call, throws if not a member
const me = guild.members.me;                               // the bot itself
```

Safe fetch:

```js
const member = await guild.members.fetch(userId).catch(() => null);
if (!member) return interaction.reply('That user is not in this server.');
```

## Member properties

| Property | Meaning |
|---|---|
| `member.user` | The underlying `User` |
| `member.id` | User ID |
| `member.displayName` | Nickname → global display name → username |
| `member.nickname` | Server nickname or `null` |
| `member.roles.cache` | Collection of roles |
| `member.roles.highest` | Highest role (used for hierarchy) |
| `member.joinedAt` / `joinedTimestamp` | When they joined |
| `member.premiumSince` | Boosting since |
| `member.communicationDisabledUntil` | Timeout end, or null |
| `member.isCommunicationDisabled()` | Currently timed out? |
| `member.permissions` | Server-wide permissions |
| `member.displayAvatarURL()` | Server avatar if set, else global |
| `member.displayHexColor` | Colour of the highest coloured role |
| `member.voice.channel` | Current voice channel |
| `member.presence` | Status/activities (Presence intent) |
| `member.kickable` / `bannable` / `moderatable` / `manageable` | Can the bot act on them? |

## User properties

| Property | Meaning |
|---|---|
| `user.username` | Unique username |
| `user.globalName` | Display name |
| `user.tag` | `username` (or `name#1234` for legacy accounts) |
| `user.bot` | Is it a bot? |
| `user.createdAt` | Account creation date |
| `user.displayAvatarURL({ size: 1024 })` | Avatar URL |
| `user.bannerURL()` | Banner (needs `user.fetch()` first) |

## Changing members

```js
await member.setNickname('New Nick', 'Requested by moderator');
await member.setNickname(null);                 // reset
await member.edit({ nick: 'Nick', roles: [roleId1, roleId2] });   // replaces all roles
await member.voice.setChannel(otherVoiceChannel);   // move (Move Members)
await member.voice.disconnect();
await member.voice.setMute(true);               // server mute (Mute Members)
```

## Listing and searching members

```js
const all = await guild.members.fetch();                         // all members (needs GuildMembers intent)
const humans = all.filter((m) => !m.user.bot);
const found = await guild.members.search({ query: 'ali', limit: 10 });   // username/nickname prefix
const withRole = guild.roles.cache.get(roleId).members;          // cached members with a role
```

Fetching all members of a huge server is expensive. Do it rarely and cache the result.

## Account age (anti-raid)

```js
const ageDays = (Date.now() - member.user.createdTimestamp) / 86_400_000;
if (ageDays < 7) logChannel.send(`⚠️ ${member} has a ${Math.floor(ageDays)}-day-old account`);
```

## See also
- [Roles](24-Roles.md) · [Moderation](25-Moderation.md) · [Member Events](30-Member-Events.md)
