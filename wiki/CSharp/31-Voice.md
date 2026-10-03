# Voice

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square)

<sub>[C# portal](README.md) › Events</sub>

| | |
|---|---|
| **Native libraries** | `opus` and `libsodium` (DLLs/shared libraries next to your app), plus FFmpeg for decoding |
| **Key types** | `SocketVoiceState`, `IAudioClient`, `AudioOutStream` |
| **Intents** | `GuildVoiceStates` |

## Voice state events

```csharp
client.UserVoiceStateUpdated += (user, before, after) =>
{
    if (before.VoiceChannel is null && after.VoiceChannel is not null)
        Console.WriteLine($"{user.Username} joined {after.VoiceChannel.Name}");
    else if (before.VoiceChannel is not null && after.VoiceChannel is null)
        Console.WriteLine($"{user.Username} left {before.VoiceChannel.Name}");
    else if (before.VoiceChannel?.Id != after.VoiceChannel?.Id)
        Console.WriteLine($"{user.Username} moved");

    if (!before.IsStreaming && after.IsStreaming) Console.WriteLine("Started streaming");
    return Task.CompletedTask;
};
```

| `SocketVoiceState` | Meaning |
|---|---|
| `VoiceChannel` | Current channel or null |
| `IsSelfMuted`, `IsSelfDeafened` | Self mute/deafen |
| `IsMuted`, `IsDeafened` | Server mute/deafen |
| `IsStreaming`, `IsVideoing` | Go Live / camera |

## Who is connected?

```csharp
var channel = Context.Guild.GetVoiceChannel(voiceId);
var names = channel.ConnectedUsers.Select(u => u.DisplayName);
```

## Playing audio

```csharp
[SlashCommand("airhorn", "Play a sound", runMode: RunMode.Async)]
public async Task AirhornAsync()
{
    if ((Context.User as IGuildUser)?.VoiceChannel is not { } channel)
    {
        await RespondAsync("Join a voice channel first.", ephemeral: true);
        return;
    }
    await RespondAsync("🔊 Playing!");

    using var audio = await channel.ConnectAsync(selfDeaf: true);
    using var ffmpeg = Process.Start(new ProcessStartInfo
    {
        FileName = "ffmpeg",
        Arguments = "-hide_banner -loglevel panic -i sounds/airhorn.mp3 -ac 2 -f s16le -ar 48000 pipe:1",
        UseShellExecute = false,
        RedirectStandardOutput = true,
    })!;
    await using var discord = audio.CreatePCMStream(AudioApplication.Mixed);
    try { await ffmpeg.StandardOutput.BaseStream.CopyToAsync(discord); }
    finally { await discord.FlushAsync(); }
    await channel.DisconnectAsync();
}
```

Requirements:
- `opus` and `libsodium` native libraries in the output folder (or on the system path).
- FFmpeg on the PATH.
- Bot permissions **Connect** and **Speak**.

## Moving and muting members

```csharp
await member.ModifyAsync(p => p.Channel = new Optional<IVoiceChannel>(otherChannel));   // Move Members
await member.ModifyAsync(p => p.Mute = true);                                           // Mute Members
await member.ModifyAsync(p => p.Channel = null);                                        // disconnect
```

## Legal note

Don't rip audio from YouTube or Spotify (it violates their terms). Play your own files or properly licensed audio. Lavalink clients (e.g. `Lavalink4NET`) are the common choice for larger music bots.

## See also
- [Use-Case Recipes → Temporary voice channels](../Use-Case-Recipes.md#temporary-voice-channels) · [Events](28-Events.md)
