// Awards XP for chatting and announces level-ups.
import { Events } from 'discord.js';

export default {
  name: Events.MessageCreate,

  async execute(ctx, message) {
    if (!message.inGuild() || message.author.bot) return;

    const newLevel = ctx.leveling.handleMessage(message.guildId, message.author.id);
    if (newLevel !== null) {
      await message.channel
        .send({ content: `🎉 ${message.author} reached **level ${newLevel}**!`, allowedMentions: { users: [message.author.id] } })
        .catch(() => {}); // no permission to talk here? that's fine
    }
  },
};
