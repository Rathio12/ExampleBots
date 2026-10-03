import { ActivityType, Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,

  execute(ctx, client) {
    ctx.logger.info(`Logged in as ${client.user.tag} — ${client.guilds.cache.size} guild(s)`);
    client.user.setActivity('/help', { type: ActivityType.Listening });
    ctx.reminders.start();
  },
};
