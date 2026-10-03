# Voice

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square)

<sub>[Python portal](README.md) › Events</sub>

| | |
|---|---|
| **Install** | `pip install "discord.py[voice]"` plus [FFmpeg](https://ffmpeg.org/download.html) on PATH |
| **Key classes** | `VoiceClient`, `FFmpegPCMAudio`, `PCMVolumeTransformer`, `VoiceState` |
| **Intents** | `voice_states` |

## Voice state events

```python
@commands.Cog.listener()
async def on_voice_state_update(self, member: discord.Member, before: discord.VoiceState, after: discord.VoiceState) -> None:
    if before.channel is None and after.channel is not None:
        print(f"{member} joined {after.channel}")
    elif before.channel is not None and after.channel is None:
        print(f"{member} left {before.channel}")
    elif before.channel != after.channel:
        print(f"{member} moved {before.channel} → {after.channel}")

    if not before.self_stream and after.self_stream:
        print("Started streaming")
```

| VoiceState attribute | Meaning |
|---|---|
| `channel` | Voice channel or None |
| `self_mute`, `self_deaf` | User muted/deafened themselves |
| `mute`, `deaf` | Server mute/deafen |
| `self_stream`, `self_video` | Go Live / camera |

## Who is connected?

```python
channel = guild.get_channel(VOICE_ID)
print([m.display_name for m in channel.members])
```

## Joining and playing audio

```python
@app_commands.command(description="Play a sound")
@app_commands.guild_only()
async def airhorn(self, interaction: discord.Interaction) -> None:
    if interaction.user.voice is None:
        return await interaction.response.send_message("Join a voice channel first.", ephemeral=True)

    channel = interaction.user.voice.channel
    voice = interaction.guild.voice_client or await channel.connect(self_deaf=True)
    if voice.channel != channel:
        await voice.move_to(channel)

    source = discord.PCMVolumeTransformer(discord.FFmpegPCMAudio("sounds/airhorn.mp3"), volume=0.5)

    def after(error: Exception | None) -> None:          # runs in another thread
        if error:
            print("Player error:", error)
        asyncio.run_coroutine_threadsafe(voice.disconnect(), self.bot.loop)

    voice.play(source, after=after)
    await interaction.response.send_message("🔊 Playing!")
```

Controls: `voice.pause()`, `voice.resume()`, `voice.stop()`, `voice.is_playing()`, `voice.source.volume = 0.2`.

Bot permissions needed: **Connect** and **Speak**.

## Leaving

```python
if interaction.guild.voice_client:
    await interaction.guild.voice_client.disconnect()
```

## Moving and muting members

```python
await member.move_to(other_channel)     # Move Members
await member.edit(mute=True)            # Mute Members
await member.move_to(None)              # disconnect
```

## Legal note

Downloading from YouTube or Spotify violates their terms. Play your own files, royalty-free audio, or streams you're allowed to use. Large music bots use **Lavalink** (e.g. the `wavelink` library).

## See also
- [Use-Case Recipes → Temporary voice channels](../Use-Case-Recipes.md#temporary-voice-channels) · [Events](28-Events.md)
