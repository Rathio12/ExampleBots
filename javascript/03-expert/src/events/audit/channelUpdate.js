import { AuditLogEvent, Events } from 'discord.js';
import { Colors, embed, truncate, userLabel } from '../../lib/format.js';

// Serialises permission overwrites so we can detect changes cheaply.
const overwriteKey = (channel) =>
  JSON.stringify(
    [...(channel.permissionOverwrites?.cache.values() ?? [])]
      .map((o) => [o.id, o.allow.bitfield.toString(), o.deny.bitfield.toString()])
      .sort(),
  );

export default {
  name: Events.ChannelUpdate,

  async execute({ audit }, oldChannel, newChannel) {
    if (!newChannel.guild || !audit.isEnabled(newChannel.guild.id)) return;

    const changes = [];
    if (oldChannel.name !== newChannel.name) {
      changes.push({ name: 'Name', value: `\`${oldChannel.name}\` → \`${newChannel.name}\`` });
    }
    if ((oldChannel.topic ?? '') !== (newChannel.topic ?? '')) {
      changes.push({ name: 'Topic', value: truncate(`${oldChannel.topic || '*none*'} → ${newChannel.topic || '*none*'}`) });
    }
    if (oldChannel.nsfw !== newChannel.nsfw) {
      changes.push({ name: 'NSFW', value: `${oldChannel.nsfw} → ${newChannel.nsfw}`, inline: true });
    }
    if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
      changes.push({ name: 'Slowmode', value: `${oldChannel.rateLimitPerUser ?? 0}s → ${newChannel.rateLimitPerUser ?? 0}s`, inline: true });
    }
    if (oldChannel.parentId !== newChannel.parentId) {
      changes.push({ name: 'Category', value: `${oldChannel.parent?.name ?? 'none'} → ${newChannel.parent?.name ?? 'none'}`, inline: true });
    }
    if (overwriteKey(oldChannel) !== overwriteKey(newChannel)) {
      changes.push({ name: 'Permissions', value: 'Permission overwrites were changed', inline: true });
    }

    // Position-only changes happen whenever channels are reordered — ignore them.
    if (changes.length === 0) return;

    const info = await audit.findExecutor(newChannel.guild, AuditLogEvent.ChannelUpdate, newChannel.id);

    const entry = embed(Colors.info)
      .setTitle('🔧 Channel updated')
      .addFields(
        { name: 'Channel', value: `${newChannel}`, inline: true },
        { name: 'By', value: info?.executor ? userLabel(info.executor) : 'Unknown', inline: true },
        ...changes,
      )
      .setFooter({ text: `Channel ID: ${newChannel.id}` });

    await audit.send(newChannel.guild, entry);
  },
};
