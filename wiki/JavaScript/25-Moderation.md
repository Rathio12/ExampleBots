# Moderation

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Moderation-FF453A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key methods** | `member.timeout`, `member.kick`, `guild.members.ban`, `guild.members.unban`, `channel.bulkDelete` |
| **Used in** | [03-expert/src/commands/moderation/](../../javascript/03-expert/src/commands/moderation) |

## Actions

```js
// Timeout (max 28 days)
await member.timeout(10 * 60_000, 'Spamming');      // milliseconds
await member.timeout(null, 'Appeal accepted');      // remove

// Kick
await member.kick('Breaking rule 3');

// Ban (works on users who already left: pass a user or an ID)
await guild.members.ban(userOrId, {
  reason: 'Raiding',
  deleteMessageSeconds: 24 * 60 * 60,               // delete their last 24 h of messages (max 7 days)
});

// Unban
await guild.members.unban(userId, 'Second chance');

// List bans
const bans = await guild.bans.fetch();
const ban = await guild.bans.fetch(userId).catch(() => null);   // null = not banned

// Bulk delete
await channel.bulkDelete(50, true);
```

| Action | Permission | Bot-side check |
|---|---|---|
| Timeout | Moderate Members | `member.moderatable` |
| Kick | Kick Members | `member.kickable` |
| Ban | Ban Members | `member.bannable` |
| Purge | Manage Messages | — |

## A complete, safe moderation command

This is the structure every expert-bot moderation command follows:

```js
export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)   // 1. hide from non-moderators
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setMaxLength(500)),

  async execute(interaction, { modlog }) {
    const member = interaction.options.getMember('user');
    if (!member) return interaction.reply({ content: 'Not a member.', flags: MessageFlags.Ephemeral });

    const problem = checkHierarchy(interaction.member, member);    // 2. role hierarchy
    if (problem) return interaction.reply({ content: `❌ ${problem}`, flags: MessageFlags.Ephemeral });
    if (!member.kickable) return interaction.reply({ content: '❌ I cannot kick that member.', flags: MessageFlags.Ephemeral });

    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    await member.send(`You were kicked from ${interaction.guild.name}: ${reason}`).catch(() => {});   // 3. DM first
    await member.kick(`${interaction.user.tag}: ${reason}`);                                          // 4. real moderator in audit log

    await modlog.log(interaction.guild, { action: 'Kick', target: member.user, moderator: interaction.user, reason });  // 5. log
    await interaction.reply({ content: `👢 Kicked ${member.user.tag}.`, flags: MessageFlags.Ephemeral });            // 6. ephemeral confirmation
  },
};
```

## Hierarchy check

```js
export function checkHierarchy(moderator, target) {
  const { guild } = target;
  if (target.id === moderator.id) return "You can't use this on yourself.";
  if (target.id === guild.ownerId) return "You can't moderate the server owner.";
  if (moderator.id !== guild.ownerId && moderator.roles.highest.position <= target.roles.highest.position)
    return 'That member has an equal or higher role than you.';
  if (guild.members.me.roles.highest.position <= target.roles.highest.position)
    return 'My role is not high enough.';
  return null;
}
```

## Purge with a filter

```js
const messages = await interaction.channel.messages.fetch({ limit: 100 });
const targets = messages.filter((m) => m.author.id === user.id).first(amount);
const deleted = await interaction.channel.bulkDelete(targets, true);
```

## Lockdown and slowmode

```js
await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }, { reason: 'Lockdown' });
await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });   // reset to inherit
await channel.setRateLimitPerUser(30, 'Slowmode');   // seconds, 0 = off
```

## AutoMod rules

```js
import { AutoModerationRuleEventType, AutoModerationRuleTriggerType, AutoModerationActionType } from 'discord.js';

await guild.autoModerationRules.create({
  name: 'Block invites',
  eventType: AutoModerationRuleEventType.MessageSend,
  triggerType: AutoModerationRuleTriggerType.Keyword,
  triggerMetadata: { regexPatterns: ['discord\\.gg/\\w+'] },
  actions: [{ type: AutoModerationActionType.BlockMessage }],
  enabled: true,
});
```

## See also
- [Permissions](26-Permissions.md) · [Permissions & Moderation](../Permissions-and-Moderation.md) · [Audit Log System](../Audit-Log-System.md)
