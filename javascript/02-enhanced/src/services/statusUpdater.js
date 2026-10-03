// Periodically shows the game server's player count in the bot's presence
// ("Watching 12/100 players") and optionally in a channel name.
import { ActivityType } from 'discord.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { fetchMinecraftStatus } from './minecraft.js';

let lastChannelName = null;

async function update(client) {
  try {
    const status = await fetchMinecraftStatus(config.gameServerAddress);
    const label = status.online ? `${status.players}/${status.maxPlayers} players` : 'server offline';

    client.user.setActivity(label, { type: ActivityType.Watching });

    if (config.statusChannelId) {
      const name = status.online ? `🟢 Players: ${status.players}/${status.maxPlayers}` : '🔴 Server offline';
      // Only rename when something changed — renames are rate limited (2 / 10 min).
      if (name !== lastChannelName) {
        const channel = await client.channels.fetch(config.statusChannelId);
        await channel.setName(name, 'Player count update');
        lastChannelName = name;
      }
    }
    logger.debug(`Status updated: ${label}`);
  } catch (error) {
    logger.warn('Could not update server status:', error.message);
  }
}

export function startStatusUpdater(client) {
  if (!config.gameServerAddress) return;
  logger.info(`Tracking ${config.gameServerAddress} every ${config.statusIntervalMinutes} min`);
  update(client);
  setInterval(() => update(client), config.statusIntervalMinutes * 60_000);
}
