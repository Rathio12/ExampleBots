import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { baseEmbed, relativeTime } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show information about a member')
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('Who? (default: you)')),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    // getMember gives the server-specific profile (roles, nickname, join date).
    const member = interaction.options.getUser('user') ? interaction.options.getMember('user') : interaction.member;
    if (!member) {
      await interaction.reply(`**${user.tag}** is not a member of this server.`);
      return;
    }

    const roles = member.roles.cache
      .filter((role) => role.id !== interaction.guild.id) // skip @everyone
      .sort((a, b) => b.position - a.position)
      .map((role) => role.toString());

    const embed = baseEmbed(member.displayColor || undefined)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '🤖 Bot', value: user.bot ? 'Yes' : 'No', inline: true },
        { name: '📅 Account created', value: relativeTime(user.createdTimestamp), inline: true },
        { name: '📥 Joined server', value: relativeTime(member.joinedTimestamp), inline: true },
        {
          name: `🎭 Roles (${roles.length})`,
          value: roles.slice(0, 15).join(' ') + (roles.length > 15 ? ' …' : '') || 'None',
        },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
