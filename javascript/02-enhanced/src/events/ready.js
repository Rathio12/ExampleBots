import { Events } from 'discord.js';
import { logger } from '../logger.js';
import { startStatusUpdater } from '../services/statusUpdater.js';

export default {
  name: Events.ClientReady,
  once: true,

  execute(client) {
    logger.info(`✅ Logged in as ${client.user.tag} — serving ${client.guilds.cache.size} server(s)`);
    startStatusUpdater(client);
  },
};
