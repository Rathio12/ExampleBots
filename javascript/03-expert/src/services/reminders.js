// Delivers reminders stored in the database.
//
// Instead of one setTimeout per reminder (lost on restart, and limited to
// ~24 days), we poll the database every few seconds for reminders that are
// due. Reminders therefore survive restarts and can be months away.
import { Colors, embed, timestamp, truncate } from '../lib/format.js';

const POLL_INTERVAL_MS = 15_000;

export function createReminderService({ client, repos, logger }) {
  let timer = null;
  let running = false;

  async function deliver(reminder) {
    const message = {
      content: `<@${reminder.userId}>`,
      embeds: [
        embed(Colors.info)
          .setTitle('⏰ Reminder')
          .setDescription(truncate(reminder.message, 4000))
          .addFields({ name: 'Set', value: timestamp(reminder.createdAt) }),
      ],
      // Only ping the person who set the reminder — never @everyone etc.
      allowedMentions: { users: [reminder.userId] },
    };

    try {
      const channel = await client.channels.fetch(reminder.channelId);
      await channel.send(message);
    } catch {
      // Channel deleted or no access? Fall back to a DM.
      try {
        const user = await client.users.fetch(reminder.userId);
        await user.send(message);
      } catch (error) {
        logger.warn(`Could not deliver reminder ${reminder.id}`, error);
      }
    }
  }

  async function tick() {
    if (running) return; // never overlap if a tick is slow
    running = true;
    try {
      for (const reminder of repos.reminders.due()) {
        await deliver(reminder);
        repos.reminders.remove(reminder.id);
      }
    } catch (error) {
      logger.error('Reminder tick failed', error);
    } finally {
      running = false;
    }
  }

  return {
    start() {
      timer = setInterval(tick, POLL_INTERVAL_MS);
      tick();
      logger.info('Reminder scheduler started');
    },
    stop: () => clearInterval(timer),
  };
}
