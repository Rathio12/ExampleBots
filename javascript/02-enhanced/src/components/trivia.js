import { MessageFlags } from 'discord.js';
import { TRIVIA_QUESTIONS } from '../data/trivia.js';

// Handles the select menu from /trivia. Custom ID: "trivia:<questionIndex>".
export default {
  id: 'trivia',

  async execute(interaction, questionIndex) {
    const question = TRIVIA_QUESTIONS[Number(questionIndex)];
    // Select menus deliver the chosen option values as an array of strings.
    const picked = Number(interaction.values[0]);
    const correctAnswer = question.answers[question.correct];

    const content = picked === question.correct
      ? `✅ Correct! The answer is **${correctAnswer}**.`
      : `❌ Not quite — you picked **${question.answers[picked]}**. The answer is **${correctAnswer}**.`;

    // An ephemeral reply means only this user sees whether they were right.
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  },
};
