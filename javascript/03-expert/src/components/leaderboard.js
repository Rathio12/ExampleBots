import { buildLeaderboardPage } from '../commands/leveling/leaderboard.js';

// Handles the ◀️ / ▶️ buttons. Custom ID: "leaderboard:<page>".
export default {
  id: 'leaderboard',

  async execute(interaction, { repos }, page) {
    await interaction.update(buildLeaderboardPage(repos, interaction.guild, Number(page)));
  },
};
