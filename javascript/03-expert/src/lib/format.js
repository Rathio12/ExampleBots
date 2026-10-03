// Formatting helpers shared by commands and the audit log.
import { EmbedBuilder } from 'discord.js';

export const Colors = Object.freeze({
  primary: 0x5865f2,
  success: 0x57f287,
  warning: 0xfee75c,
  danger: 0xed4245,
  info: 0x3498db,
  neutral: 0x99aab5,
});

export const embed = (color = Colors.primary) => new EmbedBuilder().setColor(color).setTimestamp();

/** Discord rejects embed fields over 1024 characters — always truncate user content. */
export function truncate(text, max = 1024) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** "<@id> `name`" — the mention is clickable, the name survives if the user leaves. */
export const userLabel = (user) => (user ? `${user} \`${user.tag ?? user.username}\`` : 'Unknown');

/** Discord timestamp tags render in each viewer's own timezone. */
export const timestamp = (seconds, style = 'R') => `<t:${Math.floor(seconds)}:${style}>`;
