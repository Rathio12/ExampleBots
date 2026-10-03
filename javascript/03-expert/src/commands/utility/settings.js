import { ChannelType, InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/format.js';

// Permissions the bot needs in a log channel.
const LOG_PERMISSIONS = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks];

export default {
  category: 'Admin',
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Configure the bot for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) =>
      sub
        .setName('modlog')
        .setDescription('Set (or clear) the moderation log channel')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Leave empty to disable').addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('auditlog')
        .setDescription('Set (or clear) the audit log channel (message edits/deletes, joins, roles…)')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('Leave empty to disable').addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('Show current settings')),

  async execute(interaction, { repos }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'view') {
      const settings = repos.settings.get(guildId);
      const show = (id) => (id ? `<#${id}>` : '*not set*');
      await interaction.reply({
        embeds: [
          embed()
            .setTitle('⚙️ Settings')
            .addFields(
              { name: 'Mod log', value: show(settings.modlogChannelId), inline: true },
              { name: 'Audit log', value: show(settings.auditlogChannelId), inline: true },
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = interaction.options.getChannel('channel');
    if (channel) {
      const missing = channel.permissionsFor(interaction.guild.members.me).missing(LOG_PERMISSIONS);
      if (missing.length) {
        await interaction.reply({ content: `❌ I need these permissions in ${channel}: ${missing.join(', ')}`, flags: MessageFlags.Ephemeral });
        return;
      }
    }

    if (sub === 'modlog') repos.settings.setModlogChannel(guildId, channel?.id ?? null);
    else repos.settings.setAuditlogChannel(guildId, channel?.id ?? null);

    await interaction.reply({
      content: channel ? `✅ ${sub === 'modlog' ? 'Mod log' : 'Audit log'} will be sent to ${channel}.` : `✅ ${sub} disabled.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
