// Shared embed colours/helpers so every reply looks consistent.
import { EmbedBuilder } from 'discord.js';

export const Colors = Object.freeze({
  primary: 0x5865f2, // Discord blurple
  success: 0x57f287,
  warning: 0xfee75c,
  danger: 0xed4245,
});

/** Convert a JS timestamp (ms) into a Discord timestamp tag like "3 days ago". */
export const relativeTime = (ms) => `<t:${Math.floor(ms / 1000)}:R>`;

export const baseEmbed = (color = Colors.primary) => new EmbedBuilder().setColor(color).setTimestamp();
