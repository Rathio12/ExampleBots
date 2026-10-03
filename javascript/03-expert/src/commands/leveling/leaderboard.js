import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { Colors, embed } from '../../lib/format.js';
import { levelFromXp } from '../../lib/levels.js';

const PAGE_SIZE = 10;
const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Builds one page of the leaderboard. Exported so the button handler in
 * src/components/leaderboard.js can reuse it.
 */
export function buildLeaderboardPage(repos, guild, requestedPage) {
  const total = repos.levels.count(guild.id);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(0, requestedPage), pages - 1);

  const rows = repos.levels.getTop(guild.id, PAGE_SIZE, page * PAGE_SIZE);
  const lines = rows.map((row, i) => {
    const position = page * PAGE_SIZE + i + 1;
    const badge = MEDALS[position - 1] ?? `\`#${position}\``;
    return `${badge} <@${row.userId}> — Level **${levelFromXp(row.xp).level}** (${row.xp} XP)`;
  });

  const board = embed(Colors.warning)
    .setTitle(`🏆 ${guild.name} leaderboard`)
    .setDescription(lines.join('\n') || 'Nobody has earned XP yet — start chatting!')
    .setFooter({ text: `Page ${page + 1}/${pages} • ${total} ranked member(s)` });

  // Buttons encode the page they lead to: "leaderboard:<page>".
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`leaderboard:${page - 1}`)
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`leaderboard:${page + 1}`)
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= pages - 1),
  );

  return { embeds: [board], components: pages > 1 ? [row] : [], allowedMentions: { parse: [] } };
}

export default {
  category: 'Leveling',
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the most active members')
    .setContexts(InteractionContextType.Guild),
  cooldown: 10,

  async execute(interaction, { repos }) {
    await interaction.reply(buildLeaderboardPage(repos, interaction.guild, 0));
  },
};
