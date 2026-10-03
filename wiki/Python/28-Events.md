# Events

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[Python portal](README.md) › Events</sub>

| | |
|---|---|
| **Key APIs** | `@client.event`, `@commands.Cog.listener()`, `bot.add_listener`, `bot.wait_for` |
| **Used in** | [02-enhanced welcome.py](../../python/02-enhanced/bot/cogs/welcome.py) · [03-expert audit.py](../../python/03-expert/bot/cogs/audit.py) |

## Three ways to listen

```python
# 1. @client.event: replaces the default handler (one per event name)
@client.event
async def on_ready():
    print(f"Logged in as {client.user}")

# 2. In a cog: many listeners per event, organised by feature
class Welcome(commands.Cog):
    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        ...

    @commands.Cog.listener("on_message")          # custom method name
    async def award_xp(self, message: discord.Message):
        ...

# 3. Programmatically
async def log_guild(guild): print("Joined", guild.name)
bot.add_listener(log_guild, "on_guild_join")
```

With `commands.Bot`, avoid `@bot.event async def on_message`. It overrides the default handler that processes prefix commands. Use a listener instead.

## Event reference

| Event | Arguments | Intent |
|---|---|---|
| `on_ready` | — | — |
| `on_guild_join` / `on_guild_remove` | `guild` | guilds |
| `on_guild_update` | `before, after` | guilds |
| `on_guild_channel_create/delete` | `channel` | guilds |
| `on_guild_channel_update` | `before, after` | guilds |
| `on_guild_role_create/delete` | `role` | guilds |
| `on_guild_role_update` | `before, after` | guilds |
| `on_thread_create` | `thread` | guilds |
| `on_message` | `message` | messages |
| `on_message_edit` | `before, after` (cached only) | messages |
| `on_message_delete` | `message` (cached only) | messages |
| `on_raw_message_edit` / `on_raw_message_delete` | `payload` | messages |
| `on_raw_bulk_message_delete` | `payload` | messages |
| `on_reaction_add` / `on_raw_reaction_add` | `reaction, user` / `payload` | reactions |
| `on_member_join` / `on_member_remove` | `member` | members ✱ |
| `on_raw_member_remove` | `payload` | members ✱ |
| `on_member_update` | `before, after` | members ✱ |
| `on_presence_update` | `before, after` | presences ✱ |
| `on_member_ban` / `on_member_unban` | `guild, user` | moderation |
| `on_audit_log_entry_create` | `entry` | moderation (+ View Audit Log) |
| `on_voice_state_update` | `member, before, after` | voice_states |
| `on_invite_create` / `on_invite_delete` | `invite` | invites |
| `on_typing` | `channel, user, when` | typing |
| `on_poll_vote_add` | `user, answer` | polls |
| `on_automod_action` | `execution` | auto_moderation_execution |
| `on_app_command_completion` | `interaction, command` | — |
| `on_error` | `event, *args` | — |

✱ privileged.

## Waiting for an event inline

```python
await interaction.response.send_message("Type your answer in the next 30 seconds…")

def check(m: discord.Message) -> bool:
    return m.author == interaction.user and m.channel == interaction.channel

try:
    reply = await bot.wait_for("message", check=check, timeout=30)
except asyncio.TimeoutError:
    await interaction.followup.send("Too slow!")
else:
    await interaction.followup.send(f"You said: {reply.content}")
```

## Raw events

Normal events only fire if the object is cached. `on_raw_*` events always fire, and carry a payload with IDs plus the cached object if available:

```python
@commands.Cog.listener()
async def on_raw_message_delete(self, payload: discord.RawMessageDeleteEvent):
    cached = payload.cached_message          # Message or None
    print(payload.message_id, payload.channel_id, cached.content if cached else "(not cached)")
```

## Errors in listeners

Exceptions in listeners are logged by discord.py and don't crash the bot. Override `on_error` to report them:

```python
async def on_error(self, event_method: str, /, *args, **kwargs) -> None:
    log.exception("Error in %s", event_method)
```

## See also
- [Message Events](29-Message-Events.md) · [Member Events](30-Member-Events.md) · [Events & Intents](../Events-and-Intents.md)
