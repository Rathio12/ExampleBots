import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { baseEmbed, relativeTime } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show information about this server')
    // Only usable inside servers (not in DMs).
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const { guild } = interaction;

    const embed = baseEmbed()
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
        { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount ?? 0}`, inline: true },
        { name: '💬 Channels', value: `${guild.channels.cache.size}`, inline: true },
        { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: '📅 Created', value: relativeTime(guild.createdTimestamp), inline: true },
      )
      .setFooter({ text: `ID: ${guild.id}` });

    await interaction.reply({ embeds: [embed] });
  },
};
