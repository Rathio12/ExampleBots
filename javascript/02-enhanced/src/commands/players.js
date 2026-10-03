import { SlashCommandBuilder } from 'discord.js';
import { config } from '../config.js';
import { fetchMinecraftStatus } from '../services/minecraft.js';
import { Colors, baseEmbed } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('players')
    .setDescription('Show the live player count of a Minecraft server')
    .addStringOption((option) =>
      option.setName('address').setDescription('Server address (default: the configured server)').setMaxLength(100),
    ),
  cooldown: 10,

  async execute(interaction) {
    const address = interaction.options.getString('address') ?? config.gameServerAddress;
    if (!address) {
      await interaction.reply('Please provide an `address` — no default server is configured.');
      return;
    }

    // External HTTP calls can take longer than Discord's 3-second limit,
    // so acknowledge first ("Bot is thinking…") and edit the reply later.
    await interaction.deferReply();

    try {
      const status = await fetchMinecraftStatus(address);

      if (!status.online) {
        await interaction.editReply({
          embeds: [baseEmbed(Colors.danger).setTitle(`🔴 ${address} is offline`)],
        });
        return;
      }

      const names = status.playerNames.length
        ? status.playerNames.slice(0, 20).join(', ') + (status.playerNames.length > 20 ? ' …' : '')
        : status.players > 0 ? '*Player list hidden by the server*' : '*Nobody online*';

      const embed = baseEmbed(Colors.success)
        .setTitle(`🟢 ${address}`)
        .setDescription(status.motd ? `\`\`\`\n${status.motd}\n\`\`\`` : null)
        .addFields(
          { name: '👥 Players', value: `${status.players}/${status.maxPlayers}`, inline: true },
          { name: '🧩 Version', value: status.version, inline: true },
          { name: '📋 Online now', value: names },
        );
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply(`⚠️ Could not reach the status API: ${error.message}`);
    }
  },
};
