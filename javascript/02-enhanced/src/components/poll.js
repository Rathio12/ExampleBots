import { MessageFlags } from 'discord.js';
import { buildPollMessage, polls } from '../state/polls.js';

// Handles buttons whose custom ID starts with "poll:".
// The router passes the remaining ID parts as arguments: "poll:<id>:<choice>".
export default {
  id: 'poll',

  async execute(interaction, pollId, choice) {
    const poll = polls.get(pollId);
    if (!poll) {
      await interaction.reply({ content: '⌛ This poll has expired (the bot restarted).', flags: MessageFlags.Ephemeral });
      return;
    }

    const userId = interaction.user.id;
    const chosen = choice === 'yes' ? poll.yes : poll.no;
    const other = choice === 'yes' ? poll.no : poll.yes;

    // Clicking the same button twice removes your vote; clicking the other switches it.
    if (chosen.has(userId)) chosen.delete(userId);
    else {
      chosen.add(userId);
      other.delete(userId);
    }

    // update() edits the message the button is attached to.
    await interaction.update(buildPollMessage(pollId));
  },
};
