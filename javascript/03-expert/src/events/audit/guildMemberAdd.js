import { Events } from 'discord.js';
import { Colors, embed, timestamp, userLabel } from '../../lib/format.js';

const NEW_ACCOUNT_DAYS = 7;

export default {
  name: Events.GuildMemberAdd,

  async execute({ audit }, member) {
    if (!audit.isEnabled(member.guild.id)) return;

    const created = Math.floor(member.user.createdTimestamp / 1000);
    const ageDays = (Date.now() - member.user.createdTimestamp) / 86_400_000;

    const entry = embed(Colors.success)
      .setTitle('📥 Member joined')
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: 'Member', value: userLabel(member.user), inline: true },
        { name: 'Account created', value: `${timestamp(created)}`, inline: true },
        { name: 'Member count', value: `${member.guild.memberCount}`, inline: true },
      )
      .setFooter({ text: `User ID: ${member.id}` });

    // A classic anti-raid signal: brand-new accounts.
    if (ageDays < NEW_ACCOUNT_DAYS) {
      entry.setColor(Colors.warning).addFields({ name: '⚠️ New account', value: `Created less than ${NEW_ACCOUNT_DAYS} days ago.` });
    }

    await audit.send(member.guild, entry);
  },
};
