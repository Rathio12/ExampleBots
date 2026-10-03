import { InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
  category: 'Moderation',
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk-delete recent messages in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setContexts(InteractionContextType.Guild)
    .addIntegerOption((o) =>
      o.setName('amount').setDescription('How many messages to check (1-100)').setRequired(true).setMinValue(1).setMaxValue(100),
    )
    .addUserOption((o) => o.setName('user').setDescription('Only delete messages from this user')),
  cooldown: 5,

  async execute(interaction, { modlog }) {
    const amount = interaction.options.getInteger('amount', true);
    const user = interaction.options.getUser('user');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let messages = await interaction.channel.messages.fetch({ limit: amount });
    if (user) messages = messages.filter((m) => m.author.id === user.id);

    // `true` = silently skip messages older than 14 days, which Discord
    // refuses to bulk delete.
    const deleted = await interaction.channel.bulkDelete(messages, true);

    await modlog.log(interaction.guild, {
      action: 'Purge',
      moderator: interaction.user,
      fields: [
        { name: 'Channel', value: `${interaction.channel}`, inline: true },
        { name: 'Deleted', value: `${deleted.size}`, inline: true },
        ...(user ? [{ name: 'Filter', value: `${user}`, inline: true }] : []),
      ],
    });

    const skipped = messages.size - deleted.size;
    await interaction.editReply(
      `🧹 Deleted **${deleted.size}** message(s).${skipped > 0 ? ` Skipped ${skipped} older than 14 days.` : ''}`,
    );
  },
};
