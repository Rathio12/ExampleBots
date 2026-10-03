# Voice

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square)

<sub>[JavaScript portal](README.md) › Events</sub>

| | |
|---|---|
| **Packages** | `@discordjs/voice`, `@discordjs/opus` (or `opusscript`), `ffmpeg-static`, an encryption library |
| **Intents** | `GuildVoiceStates` |
| **Used in** | [03-expert voiceStateUpdate.js](../../javascript/03-expert/src/events/audit/voiceStateUpdate.js) |

There are two separate topics: **voice state events** (who joined/left, built into discord.js) and **audio** (joining and playing, via `@discordjs/voice`).

## Voice state events

```js
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  const member = newState.member;
  if (!oldState.channelId && newState.channelId) console.log(`${member.displayName} joined ${newState.channel.name}`);
  else if (oldState.channelId && !newState.channelId) console.log(`${member.displayName} left ${oldState.channel.name}`);
  else if (oldState.channelId !== newState.channelId) console.log(`${member.displayName} moved`);

  if (!oldState.streaming && newState.streaming) console.log('Started streaming');
  if (oldState.selfMute !== newState.selfMute) console.log('Toggled mute');
});
```

| VoiceState property | Meaning |
|---|---|
| `channel` / `channelId` | Current voice channel (null = not in voice) |
| `selfMute` / `selfDeaf` | Muted/deafened themselves |
| `serverMute` / `serverDeaf` | Muted by a moderator |
| `streaming` | Go Live |
| `selfVideo` | Camera on |

## Who is in a channel?

```js
const channel = guild.channels.cache.get(VOICE_ID);
const members = channel.members;   // Collection of GuildMembers currently connected
console.log(`${members.size} people in ${channel.name}`);
```

## Playing audio

```bash
npm install @discordjs/voice @discordjs/opus ffmpeg-static
# plus an encryption library; run generateDependencyReport() to see what's missing
```

```js
import {
  AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState,
  generateDependencyReport, joinVoiceChannel, VoiceConnectionStatus,
} from '@discordjs/voice';

console.log(generateDependencyReport());   // run once to check your setup

const channel = interaction.member.voice.channel;
if (!channel) return interaction.reply('Join a voice channel first.');

const connection = joinVoiceChannel({
  channelId: channel.id,
  guildId: channel.guild.id,
  adapterCreator: channel.guild.voiceAdapterCreator,
  selfDeaf: true,
});
await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

const player = createAudioPlayer();
player.play(createAudioResource('./sounds/airhorn.mp3'));
connection.subscribe(player);

player.on(AudioPlayerStatus.Idle, () => connection.destroy());   // leave when finished
player.on('error', (error) => console.error('Audio error', error));

await interaction.reply('🔊 Playing!');
```

Bot permissions needed: **Connect** and **Speak**.

## Leaving

```js
import { getVoiceConnection } from '@discordjs/voice';
getVoiceConnection(guild.id)?.destroy();
```

## Legal note

Streaming from YouTube/Spotify violates their terms. Use your own files, royalty-free audio, or radio streams you're allowed to play. Large music bots usually use **Lavalink** (e.g. with the `shoukaku` or `lavalink-client` packages).

## Moving and muting members

```js
await member.voice.setChannel(otherChannel);   // Move Members
await member.voice.setMute(true, 'Too loud');  // Mute Members
await member.voice.disconnect();
```

## See also
- [Use-Case Recipes → Temporary voice channels](../Use-Case-Recipes.md#temporary-voice-channels) · [Events](28-Events.md)
