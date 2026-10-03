import { SlashCommandBuilder } from 'discord.js';
import { embed } from '../../lib/format.js';

export default {
  category: 'General',
  data: new SlashCommandBuilder().setName('ping').setDescription('Check latency and uptime'),
  cooldown: 5,

  async execute(interaction, { client, db }) {
    const started = Date.now();
    await interaction.deferReply();
    const roundTrip = Date.now() - started;

    // A trivial query proves the database is healthy.
    const dbStart = process.hrtime.bigint();
    db.prepare('SELECT 1').get();
    const dbMs = Number(process.hrtime.bigint() - dbStart) / 1e6;

    const uptime = Math.floor((Date.now() - client.readyTimestamp) / 1000);

    await interaction.editReply({
      embeds: [
        embed()
          .setTitle('🏓 Pong!')
          .addFields(
            { name: 'Gateway', value: `${client.ws.ping}ms`, inline: true },
            { name: 'Round-trip', value: `${roundTrip}ms`, inline: true },
            { name: 'Database', value: `${dbMs.toFixed(2)}ms`, inline: true },
            { name: 'Online since', value: `<t:${Math.floor(Date.now() / 1000) - uptime}:R>`, inline: true },
          ),
      ],
    });
  },
};
