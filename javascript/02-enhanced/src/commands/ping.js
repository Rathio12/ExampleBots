import { SlashCommandBuilder } from 'discord.js';
import { baseEmbed } from '../utils/embeds.js';

// Every command file exports the same shape:
//   data      -> the slash command definition (sent to Discord on deploy)
//   cooldown  -> optional, seconds between uses per user
//   execute() -> runs when someone uses the command
export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot latency'),
  cooldown: 5,

  async execute(interaction) {
    // Round-trip = time between the user's click and our reply being created.
    const sent = Date.now();
    await interaction.deferReply();
    const roundTrip = Date.now() - sent;

    const embed = baseEmbed()
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Gateway', value: `${interaction.client.ws.ping}ms`, inline: true },
        { name: 'API round-trip', value: `${roundTrip}ms`, inline: true },
      );
    await interaction.editReply({ embeds: [embed] });
  },
};
