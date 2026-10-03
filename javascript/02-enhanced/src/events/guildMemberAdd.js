// Welcomes new members. Requires the privileged "Server Members Intent",
// which index.js only requests when WELCOME_CHANNEL_ID is configured.
import { Events } from 'discord.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { Colors, baseEmbed, relativeTime } from '../utils/embeds.js';

export default {
  name: Events.GuildMemberAdd,

  async execute(member) {
    if (!config.welcomeChannelId) return;

    try {
      const channel = await member.client.channels.fetch(config.welcomeChannelId);
      // Ignore joins from other servers the bot is in.
      if (channel.guildId !== member.guild.id) return;

      const embed = baseEmbed(Colors.success)
        .setTitle(`👋 Welcome to ${member.guild.name}!`)
        .setDescription(`Hey ${member}, glad you're here! You are member **#${member.guild.memberCount}**.`)
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .addFields({ name: 'Account created', value: relativeTime(member.user.createdTimestamp) });

      await channel.send({ embeds: [embed] });
    } catch (error) {
      logger.error('Failed to send welcome message:', error);
    }
  },
};
