# Channels

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Server-FF9F0A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key classes** | `discord.TextChannel`, `VoiceChannel`, `CategoryChannel`, `StageChannel`, `ForumChannel`, `discord.ChannelType` |
| **Permission** | Manage Channels |
| **Used in** | [02-enhanced gameserver.py](../../python/02-enhanced/bot/cogs/gameserver.py) (status rename) |

## Getting channels

```python
channel = guild.get_channel(channel_id)              # cache
channel = bot.get_channel(channel_id)                # any guild
channel = await bot.fetch_channel(channel_id)        # API
channel = discord.utils.get(guild.text_channels, name="general")

guild.text_channels, guild.voice_channels, guild.categories, guild.forums, guild.threads
```

`isinstance(channel, discord.TextChannel)` is the usual type check.

## Creating channels

```python
category = await guild.create_category("Support")

text = await guild.create_text_channel(
    "help-desk",
    category=category,
    topic="Ask for help here",
    slowmode_delay=10,
    overwrites={
        guild.default_role: discord.PermissionOverwrite(send_messages=False),
        staff_role: discord.PermissionOverwrite(send_messages=True),
    },
    reason="Support setup",
)

voice = await guild.create_voice_channel("Lounge", category=category, user_limit=10, bitrate=64_000)
stage = await guild.create_stage_channel("Town Hall", category=category)
forum = await guild.create_forum("Bug reports", category=category)
```

## Editing

```python
await channel.edit(name="new-name")            # ⚠ 2 renames per 10 minutes per channel
await channel.edit(topic="New topic", slowmode_delay=5, nsfw=False)
await channel.edit(category=other_category, sync_permissions=True)
await channel.edit(position=0)
await voice.edit(user_limit=5)
```

## Deleting and cloning

```python
await channel.delete(reason="Cleanup")
copy = await channel.clone(name="general-new")   # same settings and overwrites, no messages
```

## Status channel (Enhanced bot)

```python
name = f"🟢 Players: {players}/{max_players}" if online else "🔴 Server offline"
if name != self._last_channel_name:            # only rename when it changes (rate limit)
    await channel.edit(name=name, reason="Player count update")
    self._last_channel_name = name
```

## Channel events

```python
@commands.Cog.listener()
async def on_guild_channel_create(self, channel): ...
@commands.Cog.listener()
async def on_guild_channel_update(self, before, after): ...
@commands.Cog.listener()
async def on_guild_channel_delete(self, channel): ...
@commands.Cog.listener()
async def on_guild_channel_pins_update(self, channel, last_pin): ...
```

## See also
- [Permissions](26-Permissions.md) · [Threads & Forums](20-Threads-and-Forums.md) · [Voice](31-Voice.md)
