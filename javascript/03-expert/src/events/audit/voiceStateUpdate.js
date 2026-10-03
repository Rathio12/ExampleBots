import { Events } from 'discord.js';
import { Colors, embed, userLabel } from '../../lib/format.js';

export default {
  name: Events.VoiceStateUpdate,

  async execute({ audit }, oldState, newState) {
    const guild = newState.guild;
    if (!audit.isEnabled(guild.id)) return;
    // Mute/deafen/stream changes keep the same channel — we only log movement.
    if (oldState.channelId === newState.channelId) return;

    const member = newState.member ?? oldState.member;
    if (!member || member.user.bot) return;

    let entry;
    if (!oldState.channelId) {
      entry = embed(Colors.success).setTitle('🔊 Joined voice').addFields({ name: 'Channel', value: `<#${newState.channelId}>`, inline: true });
    } else if (!newState.channelId) {
      entry = embed(Colors.neutral).setTitle('🔇 Left voice').addFields({ name: 'Channel', value: `<#${oldState.channelId}>`, inline: true });
    } else {
      entry = embed(Colors.info)
        .setTitle('🔀 Moved voice channel')
        .addFields(
          { name: 'From', value: `<#${oldState.channelId}>`, inline: true },
          { name: 'To', value: `<#${newState.channelId}>`, inline: true },
        );
    }

    entry.addFields({ name: 'Member', value: userLabel(member.user), inline: true }).setFooter({ text: `User ID: ${member.id}` });
    await audit.send(guild, entry);
  },
};
