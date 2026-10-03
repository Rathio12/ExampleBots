import { ApplicationCommandType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/format.js';

export default {
  category: 'General',
  data: new SlashCommandBuilder().setName('help').setDescription('List all commands by category'),

  async execute(interaction, { client }) {
    // Group commands by their `category` field.
    const groups = new Map();
    for (const command of client.commands.values()) {
      const json = command.data.toJSON();
      const isContextMenu = json.type === ApplicationCommandType.User || json.type === ApplicationCommandType.Message;
      const line = isContextMenu
        ? `**${json.name}** — right-click → Apps`
        : `**/${json.name}** — ${json.description}`;
      const category = command.category ?? 'Other';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(line);
    }

    const help = embed().setTitle('📖 Help').setDescription('Commands you lack permissions for are hidden by Discord.');
    for (const [category, lines] of groups) help.addFields({ name: category, value: lines.join('\n') });

    await interaction.reply({ embeds: [help], flags: MessageFlags.Ephemeral });
  },
};
