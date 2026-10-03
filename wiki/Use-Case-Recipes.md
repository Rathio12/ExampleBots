# Use-Case Recipes

Ready-to-adapt solutions for the bots people most often want to build. Each recipe lists the pieces you need and the approach, with working code. The JavaScript version is shown here. Every building block is explained per library in the language portals: [JavaScript](JavaScript/README.md) · [Python](Python/README.md) · [C#](CSharp/README.md).

| Recipe | Difficulty | Builds on |
|---|---|---|
| [Game-server player count](#game-server-player-count) | ★★ | Enhanced bot (`/players`, status updater) |
| [Fun commands](#fun-commands) | ★ | Basic bot |
| [Welcome & goodbye messages](#welcome--goodbye-messages) | ★ | Enhanced bot |
| [Self-assignable roles](#self-assignable-roles) | ★★ | Select menus |
| [Moderation bot](#moderation-bot) | ★★★ | Expert bot |
| [Audit log](#audit-log) | ★★★ | Expert bot |
| [Ticket system](#ticket-system) | ★★★ | Buttons, private threads |
| [Suggestions board](#suggestions-board) | ★★ | Modals, reactions, threads |
| [Starboard](#starboard) | ★★ | Reaction events |
| [Giveaways](#giveaways) | ★★★ | Buttons, database, scheduler |
| [Leveling / XP](#leveling--xp) | ★★ | Expert bot |
| [Reminders & scheduled announcements](#reminders--scheduled-announcements) | ★★ | Expert bot |
| [Verification gate](#verification-gate) | ★★ | Buttons, roles |
| [Auto-responder & word filter](#auto-responder--word-filter) | ★ | Message events / AutoMod |
| [Temporary voice channels](#temporary-voice-channels) | ★★★ | Voice state events |
| [Live notifications](#live-notifications) | ★★ | Background tasks, webhooks |
| [Invite tracker](#invite-tracker) | ★★★ | Invite events |
| [Counting game](#counting-game) | ★ | Message events |
| [AI chat bot](#ai-chat-bot) | ★★ | HTTP APIs, defer |
| [Music bot](#music-bot) | ★★★★ | Voice |

---

## Game-server player count

**Goal:** show live player counts with `/players`, in the bot's status ("Watching 12/100 players"), and in a channel name ("🟢 Players: 12/100").

**Already built:** the Enhanced bots do exactly this for Minecraft ([JS](../javascript/02-enhanced/src/services/statusUpdater.js) · [Py](../python/02-enhanced/bot/cogs/gameserver.py) · [C#](../csharp/02-enhanced/Services/StatusUpdater.cs)). Set `GAME_SERVER_ADDRESS` and optionally `STATUS_CHANNEL_ID`.

**Other games:** only the fetch function changes. Normalise every game to the same shape:

```js
// { online: boolean, players: number, maxPlayers: number, playerNames: string[] }

// FiveM (GTA V roleplay) exposes JSON on the game port
async function fetchFiveM(host) {
  const [info, players] = await Promise.all([
    fetch(`http://${host}/info.json`, { signal: AbortSignal.timeout(5000) }).then((r) => r.json()),
    fetch(`http://${host}/players.json`, { signal: AbortSignal.timeout(5000) }).then((r) => r.json()),
  ]);
  return { online: true, players: players.length, maxPlayers: Number(info.vars.sv_maxClients), playerNames: players.map((p) => p.name) };
}

// Steam games (CS2, Rust, ARK, Valheim…) via the Steam Web API (free API key)
async function fetchSteam(ip, port, key) {
  const url = `https://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${key}&filter=\\addr\\${ip}:${port}`;
  const server = (await (await fetch(url)).json()).response.servers?.[0];
  return server
    ? { online: true, players: server.players, maxPlayers: server.max_players, playerNames: [] }
    : { online: false, players: 0, maxPlayers: 0, playerNames: [] };
}
```

Games without HTTP APIs usually speak the [Source query protocol](https://developer.valvesoftware.com/wiki/Server_queries): use `gamedig` (npm, 300+ games) or `python-a2s`.

**Gotchas**
- Channel renames are limited to **2 per 10 minutes**: update at most every 5 minutes, and only when the text changed.
- Cache the last result for ~60 s so `/players` spam doesn't hammer the game server.
- A voice channel makes a nice status display: allow *View Channel*, deny *Connect* for `@everyone`.

---

## Fun commands

```js
// /choose options:"pizza, burger, sushi"
const options = interaction.options.getString('options', true).split(',').map((s) => s.trim()).filter(Boolean);
await interaction.reply(`🤔 I choose **${options[Math.floor(Math.random() * options.length)]}**`);

// /rps choice:rock|paper|scissors
const beats = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
const bot = Object.keys(beats)[Math.floor(Math.random() * 3)];
const you = interaction.options.getString('choice', true);
const result = you === bot ? "It's a tie!" : beats[you] === bot ? 'You win! 🎉' : 'I win! 😎';
await interaction.reply(`You: **${you}** · Me: **${bot}**: ${result}`);

// /joke (free API, no key). ||spoiler|| hides the punchline
const joke = await (await fetch('https://official-joke-api.appspot.com/random_joke')).json();
await interaction.reply(`${joke.setup}\n||${joke.punchline}||`);

// /ship user1 user2: deterministic "compatibility" from the two IDs
const score = Number((BigInt(a.id) + BigInt(b.id)) % 101n);
await interaction.reply(`💘 ${a} + ${b} = **${score}%**`);
```

---

## Welcome & goodbye messages

**Needs:** Server Members intent. **Built in:** Enhanced bots. Adding an auto-role:

```js
client.on(Events.GuildMemberAdd, async (member) => {
  await member.roles.add(MEMBER_ROLE_ID).catch(() => {});   // bot's role must be above MEMBER_ROLE_ID
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  await channel?.send({ content: `Welcome ${member}!`, allowedMentions: { users: [member.id] } });
});

client.on(Events.GuildMemberRemove, async (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  await channel?.send(`👋 **${member.user.username}** left the server.`);
});
```

---

## Self-assignable roles

Use a select menu or buttons posted once by an admin. They're clearer than reaction roles and need no extra intents.

```js
// /rolemenu (admin): post the menu once
const menu = new StringSelectMenuBuilder()
  .setCustomId('roles:pick')
  .setPlaceholder('Choose your roles')
  .setMinValues(0)
  .setMaxValues(3)
  .addOptions(
    { label: 'Announcements', value: '111111111111111111', emoji: '📢' },
    { label: 'Events', value: '222222222222222222', emoji: '🎉' },
    { label: 'Gaming', value: '333333333333333333', emoji: '🎮' },
  );
await interaction.channel.send({ content: 'Pick your roles:', components: [new ActionRowBuilder().addComponents(menu)] });

// Handler for "roles:pick": reads the menu's own options, so it works forever (even after restarts)
const offered = interaction.component.options.map((o) => o.value);
const chosen = new Set(interaction.values);
await interaction.member.roles.add(offered.filter((id) => chosen.has(id)));
await interaction.member.roles.remove(offered.filter((id) => !chosen.has(id)));
await interaction.reply({ content: '✅ Roles updated!', flags: MessageFlags.Ephemeral });
```

The bot needs **Manage Roles**, and its role must be above the roles it hands out. Never offer roles with dangerous permissions.

---

## Moderation bot

Fully built in the expert bots. See [Permissions & Moderation](Permissions-and-Moderation.md). Popular extensions:

```js
// Auto-escalation inside /warn
const count = repos.warnings.list(guildId, member.id).length;
if (count === 3) await member.timeout(60 * 60_000, 'Automatic: 3 warnings');
if (count >= 5) await member.ban({ reason: 'Automatic: 5 warnings' });

// /lockdown: deny Send Messages for @everyone in this channel
await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });

// /slowmode seconds:30
await interaction.channel.setRateLimitPerUser(30);

// Temporary bans: store { guild_id, user_id, unban_at } and unban from a background loop when due
```

---

## Audit log

Fully built in the expert bots. See [Audit Log System](Audit-Log-System.md).

---

## Ticket system

A "Create ticket" button opens a private thread between the user and staff:

```js
// One-time panel (admin)
const open = new ButtonBuilder().setCustomId('ticket:open').setLabel('Open a ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary);
await channel.send({ content: 'Need help? Click below.', components: [new ActionRowBuilder().addComponents(open)] });

// Handler "ticket:open"
const thread = await interaction.channel.threads.create({
  name: `ticket-${interaction.user.username}`,
  type: ChannelType.PrivateThread,
  invitable: false,
});
await thread.members.add(interaction.user.id);
const close = new ButtonBuilder().setCustomId('ticket:close').setLabel('Close').setStyle(ButtonStyle.Danger);
await thread.send({
  content: `${interaction.user} <@&${STAFF_ROLE_ID}>: describe your issue here.`,
  allowedMentions: { users: [interaction.user.id], roles: [STAFF_ROLE_ID] },
  components: [new ActionRowBuilder().addComponents(close)],
});
await interaction.reply({ content: `🎫 Ticket created: ${thread}`, flags: MessageFlags.Ephemeral });

// Handler "ticket:close"
await interaction.reply('🔒 Closing ticket…');
await interaction.channel.setLocked(true);
await interaction.channel.setArchived(true);
```

Prefer real channels? `guild.channels.create({ name, parent: CATEGORY_ID, permissionOverwrites: [...] })`, denying `@everyone` and allowing the user and staff. For transcripts, fetch the messages before closing and attach them as a `.txt` (see the expert bots' bulk-delete handler).

---

## Suggestions board

```js
// /suggest → modal → post in #suggestions with reactions and a discussion thread
const embed = new EmbedBuilder()
  .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
  .setDescription(text)
  .setColor(0x5865f2);
const message = await suggestionsChannel.send({ embeds: [embed] });
await message.react('👍');
await message.react('👎');
await message.startThread({ name: 'Discussion' });
```

For strict one-vote-per-person, use buttons and a `(message_id, user_id)` primary key in the database.

---

## Starboard

**Needs:** the `GuildMessageReactions` intent, plus `Partials.Message` and `Partials.Reaction` for older messages.

```js
const THRESHOLD = 3;
client.on(Events.MessageReactionAdd, async (reaction) => {
  if (reaction.partial) await reaction.fetch();
  if (reaction.emoji.name !== '⭐' || reaction.count < THRESHOLD) return;
  if (repos.starboard.has(reaction.message.id)) return;    // post each message once

  const msg = reaction.message;
  const embed = new EmbedBuilder()
    .setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL() })
    .setDescription(msg.content || null)
    .addFields({ name: 'Source', value: `[Jump](${msg.url})` })
    .setImage(msg.attachments.first()?.url ?? null)
    .setColor(0xffac33);
  const posted = await starboardChannel.send({ content: `⭐ **${reaction.count}** ${msg.channel}`, embeds: [embed] });
  repos.starboard.add(msg.id, posted.id);
});
```

---

## Giveaways

```sql
CREATE TABLE giveaways (id INTEGER PRIMARY KEY, guild_id TEXT, channel_id TEXT, message_id TEXT,
                        prize TEXT, winners INTEGER, ends_at INTEGER, ended INTEGER DEFAULT 0);
CREATE TABLE giveaway_entries (giveaway_id INTEGER, user_id TEXT, PRIMARY KEY (giveaway_id, user_id));
```

```js
// "Enter" button giveaway:<id>: INSERT OR IGNORE stops double entries
db.prepare('INSERT OR IGNORE INTO giveaway_entries VALUES (?, ?)').run(id, interaction.user.id);

// Every 15 s: finish due giveaways
for (const g of db.prepare('SELECT * FROM giveaways WHERE ended = 0 AND ends_at <= ?').all(now())) {
  const entries = db.prepare('SELECT user_id FROM giveaway_entries WHERE giveaway_id = ?').all(g.id).map((r) => r.user_id);
  const winners = shuffle(entries).slice(0, g.winners);   // Fisher–Yates with crypto.randomInt
  const channel = await client.channels.fetch(g.channel_id);
  await channel.send({
    content: winners.length ? `🎉 ${winners.map((w) => `<@${w}>`).join(', ')} won **${g.prize}**!` : 'No valid entries.',
    allowedMentions: { users: winners },
  });
  db.prepare('UPDATE giveaways SET ended = 1 WHERE id = ?').run(g.id);
}
```

---

## Leveling / XP

Built into the expert bots. Extensions:
- **Level roles:** after a level-up, `member.roles.add(LEVEL_ROLES[newLevel])`.
- **Voice XP:** record join times from voice state events and award XP per minute.
- **No-XP channels:** skip configured channel IDs.
- **Rank card images:** `@napi-rs/canvas` (JS), Pillow (Python), SkiaSharp (C#). Send as an attachment.

---

## Reminders & scheduled announcements

Built in (`/remind`). Recurring announcements use the same table plus an interval: after sending, set `next_run_at += interval`. See [Background Tasks](Background-Tasks.md).

---

## Verification gate

New members only see `#verify` until they click a button:

```js
// @everyone cannot see other channels; the "Verified" role can.
await interaction.member.roles.add(VERIFIED_ROLE_ID, 'Passed verification');
await interaction.reply({ content: '✅ Welcome! You now have access.', flags: MessageFlags.Ephemeral });
```

Harden it with a minimum account age (`Date.now() - user.createdTimestamp`) or a modal question. Discord's built-in **Onboarding** may be enough.

---

## Auto-responder & word filter

**Prefer Discord AutoMod for blocking words.** It works even while your bot is offline. Custom replies:

```js
const responses = new Map([['!rules', 'Read <#123456789012345678> please!'], ['good bot', '😊']]);
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  const reply = responses.get(message.content.toLowerCase().trim());
  if (reply) await message.reply({ content: reply, allowedMentions: { repliedUser: false } });
});
```

Needs the `GuildMessages` and `MessageContent` intents.

---

## Temporary voice channels

```js
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (newState.channelId === HUB_CHANNEL_ID) {
    const channel = await newState.guild.channels.create({
      name: `${newState.member.displayName}'s room`,
      type: ChannelType.GuildVoice,
      parent: newState.channel.parentId,
      permissionOverwrites: [{ id: newState.member.id, allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers] }],
    });
    tempChannels.add(channel.id);
    await newState.setChannel(channel);
  }
  if (oldState.channel && tempChannels.has(oldState.channelId) && oldState.channel.members.size === 0) {
    tempChannels.delete(oldState.channelId);
    await oldState.channel.delete();
  }
});
```

Needs `GuildVoiceStates`, **Manage Channels** and **Move Members**. Persist the set of temp channels so a restart can clean up.

---

## Live notifications

1. Poll a feed or API on an interval (RSS every 5–10 min; Twitch/YouTube APIs or their webhooks).
2. Store the last seen item ID per feed.
3. Post new items oldest first, optionally via a **webhook** for a custom name and avatar.

```js
const feed = await parser.parseURL(url);          // rss-parser package
const fresh = feed.items.filter((i) => !repos.seen.has(url, i.guid)).reverse();
for (const item of fresh) {
  await channel.send(`📰 **${item.title}**\n${item.link}`);
  repos.seen.add(url, item.guid);
}
```

---

## Invite tracker

Compare invite use counts before and after a join (`GuildInvites` intent, **Manage Server** permission):

```js
client.on(Events.GuildMemberAdd, async (member) => {
  const before = inviteCache.get(member.guild.id) ?? new Map();
  const invites = await member.guild.invites.fetch();
  const used = invites.find((i) => (before.get(i.code) ?? 0) < i.uses);
  inviteCache.set(member.guild.id, new Map(invites.map((i) => [i.code, i.uses])));
  // used?.inviter → who invited them (undefined for vanity URLs)
});
```

Fill the cache on ready and on `inviteCreate`/`inviteDelete`.

---

## Counting game

```js
client.on(Events.MessageCreate, async (message) => {
  if (message.channelId !== COUNTING_CHANNEL_ID || message.author.bot) return;
  const state = repos.counting.get(message.guildId);            // { current, lastUserId }
  const n = Number(message.content);
  if (n === state.current + 1 && message.author.id !== state.lastUserId) {
    repos.counting.set(message.guildId, { current: n, lastUserId: message.author.id });
    await message.react('✅');
  } else {
    repos.counting.set(message.guildId, { current: 0, lastUserId: null });
    await message.react('❌');
    await message.channel.send(`💥 ${message.author} ruined it at **${state.current}**! Start again from 1.`);
  }
});
```

---

## AI chat bot

Always **defer**: model responses take longer than 3 seconds.

```js
await interaction.deferReply();
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-5-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: interaction.options.getString('question', true) }],
  }),
});
const data = await response.json();
await interaction.editReply({ content: (data.content?.[0]?.text ?? 'No answer.').slice(0, 2000), allowedMentions: { parse: [] } });
```

Add cooldowns (API calls cost money) and consider the official SDKs (`@anthropic-ai/sdk`, `anthropic`, `Anthropic` for .NET).

---

## Music bot

- Libraries: `@discordjs/voice` (JS), discord.py voice + PyNaCl + FFmpeg (Python), Discord.Net audio + opus/libsodium + FFmpeg (C#). Large bots offload audio to **Lavalink**.
- Needs the `GuildVoiceStates` intent.
- **Legal:** ripping audio from YouTube or Spotify violates their terms. Use your own files, royalty-free music, or radio streams you may play.

```js
import { joinVoiceChannel, createAudioPlayer, createAudioResource } from '@discordjs/voice';

const connection = joinVoiceChannel({ channelId: member.voice.channelId, guildId: guild.id, adapterCreator: guild.voiceAdapterCreator });
const player = createAudioPlayer();
player.play(createAudioResource('./sounds/airhorn.mp3'));
connection.subscribe(player);
```
