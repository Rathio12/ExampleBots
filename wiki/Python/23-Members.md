# Members

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Server-FF9F0A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key classes** | `discord.Member`, `discord.User` |
| **Intents** | `members` (privileged) for member cache and events |
| **Used in** | [02-enhanced general.py](../../python/02-enhanced/bot/cogs/general.py) (`/userinfo`) |

A `User` is a Discord account. A `Member` is a user inside one guild, with nickname, roles, join date and timeout.

## Getting members

```python
member = interaction.user                               # a Member when used in a guild
member = guild.get_member(user_id)                      # cache (needs members intent to be complete)
member = await guild.fetch_member(user_id)              # API, raises discord.NotFound if not a member
me = guild.me                                           # the bot
```

Safe pattern:

```python
member = guild.get_member(user_id)
if member is None:
    try:
        member = await guild.fetch_member(user_id)
    except discord.NotFound:
        return await interaction.response.send_message("Not in this server.", ephemeral=True)
```

## Member attributes

| Attribute | Meaning |
|---|---|
| `member.display_name` | Nickname → global name → username |
| `member.nick` | Server nickname or None |
| `member.roles` | List of roles (lowest first, includes @everyone) |
| `member.top_role` | Highest role |
| `member.joined_at` | Join datetime |
| `member.premium_since` | Boosting since |
| `member.timed_out_until`, `member.is_timed_out()` | Timeout |
| `member.guild_permissions` | Server-wide permissions |
| `member.display_avatar` | Server avatar or global avatar (`.url`, `.with_size(256)`) |
| `member.colour` | Role colour |
| `member.voice` | `VoiceState` or None |
| `member.status`, `member.activities` | Presence (presences intent) |
| `member.pending` | Hasn't passed membership screening yet |

User attributes: `name`, `global_name`, `display_name`, `id`, `bot`, `created_at`, `display_avatar`, `mention`. For the banner, call `await bot.fetch_user(id)` and read `.banner`.

## Editing members

```python
await member.edit(nick="New Nick", reason="Requested")
await member.edit(nick=None)                                  # reset
await member.edit(roles=[role_a, role_b])                     # replace all roles
await member.edit(mute=True, deafen=False)                    # server voice mute/deafen
await member.move_to(voice_channel)                           # move (None disconnects)
```

## Listing and searching

```python
humans = [m for m in guild.members if not m.bot]              # needs members intent
results = await guild.query_members(query="ali", limit=10)    # username/nickname prefix
role_members = role.members
await guild.chunk()                                           # download all members if not chunked
```

## Account age

```python
age = discord.utils.utcnow() - member.created_at
if age.days < 7:
    await log_channel.send(f"⚠️ {member.mention} has a {age.days}-day-old account")
```

## Hierarchy comparison

```python
if member.top_role >= interaction.user.top_role and interaction.user != interaction.guild.owner:
    ...   # can't moderate someone equal or higher
```

## See also
- [Roles](24-Roles.md) · [Moderation](25-Moderation.md) · [Member Events](30-Member-Events.md)
