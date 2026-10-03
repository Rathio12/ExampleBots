// In-memory poll storage, shared by the /poll command and the button handler.
// Note: polls are lost when the bot restarts. The Expert bot shows how to use
// a database when data must survive restarts.
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { baseEmbed } from '../utils/embeds.js';

/** @type {Map<string, {question: string, authorTag: string, yes: Set<string>, no: Set<string>}>} */
export const polls = new Map();

export function buildPollMessage(pollId) {
  const poll = polls.get(pollId);
  const total = poll.yes.size + poll.no.size;
  const percent = (count) => (total === 0 ? 0 : Math.round((count / total) * 100));
  const bar = (count) => '█'.repeat(Math.round(percent(count) / 10)).padEnd(10, '░');

  const embed = baseEmbed()
    .setTitle(`📊 ${poll.question}`)
    .setDescription(
      `✅ **Yes** — ${poll.yes.size} vote(s)\n\`${bar(poll.yes.size)}\` ${percent(poll.yes.size)}%\n\n` +
        `❌ **No** — ${poll.no.size} vote(s)\n\`${bar(poll.no.size)}\` ${percent(poll.no.size)}%`,
    )
    .setFooter({ text: `Poll by ${poll.authorTag} • ${total} total vote(s) • click again to change your vote` });

  // The custom ID carries the poll ID and the choice: "poll:<id>:yes".
  // The component router splits on ":" and passes the parts to the handler.
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`poll:${pollId}:yes`).setLabel('Yes').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`poll:${pollId}:no`).setLabel('No').setEmoji('❌').setStyle(ButtonStyle.Danger),
  );

  return { embeds: [embed], components: [row] };
}
