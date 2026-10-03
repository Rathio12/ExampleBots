import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { formatDuration, parseDuration } from '../../lib/duration.js';
import { Colors, embed, timestamp, truncate } from '../../lib/format.js';

const MAX_SECONDS = 365 * 86_400;
const MAX_PER_USER = 25;

export default {
  category: 'Utility',
  // Subcommands group related actions under one command: /remind create|list|delete
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Reminders that survive bot restarts')
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a reminder')
        .addStringOption((o) => o.setName('in').setDescription('When? e.g. 10m, 2h, 1d12h, 2w').setRequired(true))
        .addStringOption((o) => o.setName('message').setDescription('What should I remind you about?').setRequired(true).setMaxLength(1000)),
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List your reminders'))
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Delete one of your reminders')
        .addIntegerOption((o) => o.setName('id').setDescription('Reminder ID from /remind list').setRequired(true)),
    ),

  async execute(interaction, { repos }) {
    const userId = interaction.user.id;

    switch (interaction.options.getSubcommand()) {
      case 'create': {
        const seconds = parseDuration(interaction.options.getString('in', true));
        if (!seconds || seconds > MAX_SECONDS) {
          await interaction.reply({ content: '❌ Use a duration like `30m`, `2h`, `1d` (max 365d).', flags: MessageFlags.Ephemeral });
          return;
        }
        if (repos.reminders.countForUser(userId) >= MAX_PER_USER) {
          await interaction.reply({ content: `❌ You already have ${MAX_PER_USER} reminders.`, flags: MessageFlags.Ephemeral });
          return;
        }

        const remindAt = Math.floor(Date.now() / 1000) + seconds;
        const id = repos.reminders.add(userId, interaction.channelId, interaction.options.getString('message', true), remindAt);
        await interaction.reply({
          content: `⏰ Reminder **#${id}** set for ${timestamp(remindAt, 'f')} (in ${formatDuration(seconds)}).`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      case 'list': {
        const reminders = repos.reminders.listForUser(userId);
        const lines = reminders.map((r) => `**#${r.id}** • ${timestamp(r.remindAt)} — ${truncate(r.message, 80)}`);
        await interaction.reply({
          embeds: [embed(Colors.info).setTitle('⏰ Your reminders').setDescription(lines.join('\n') || 'You have no reminders.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      case 'delete': {
        const id = interaction.options.getInteger('id', true);
        const removed = repos.reminders.removeForUser(id, userId);
        await interaction.reply({
          content: removed ? `🗑️ Deleted reminder #${id}.` : `❌ You have no reminder #${id}.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
