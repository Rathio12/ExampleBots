# Message Events

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Events</sub>

| | |
|---|---|
| **Events** | `on_message`, `on_message_edit`, `on_message_delete`, `on_raw_message_*`, `on_raw_bulk_message_delete` |
| **Intents** | `messages`, `message_content` (privileged) for the text |
| **Used in** | [03-expert leveling.py](../../python/03-expert/bot/cogs/leveling.py) · [audit.py](../../python/03-expert/bot/cogs/audit.py) |

## New messages

```python
intents = discord.Intents.default()
intents.message_content = True      # privileged: needed to read message.content

class Responder(commands.Cog):
    @commands.Cog.listener()
    async def on_message(self, message: discord.Message) -> None:
        if message.author.bot or message.guild is None:
            return
        if message.content.lower() == "hello":
            await message.reply("Hi there!", mention_author=False)
```

Without the intent, `content` is empty except for messages mentioning the bot, DMs, and the bot's own messages.

## Useful attributes

| Attribute | Meaning |
|---|---|
| `content`, `clean_content` | Text (`clean_content` resolves mentions to names) |
| `author`, `guild`, `channel` | Who and where |
| `mentions`, `role_mentions`, `mention_everyone` | Mentions |
| `bot.user.mentioned_in(message)` | Does it mention the bot? |
| `attachments`, `embeds`, `stickers` | Media |
| `reference` | Reply target (`reference.resolved`) |
| `created_at`, `edited_at` | Timestamps |
| `jump_url` | Link to the message |
| `webhook_id` | Set if sent by a webhook |

## Prefix commands with commands.Bot

```python
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.command()
async def ping(ctx: commands.Context) -> None:
    await ctx.reply("Pong!")

@bot.command()
async def say(ctx: commands.Context, *, text: str) -> None:   # * = rest of the message
    await ctx.send(text, allowed_mentions=discord.AllowedMentions.none())
```

**Hybrid commands** work as both prefix and slash commands:

```python
@commands.hybrid_command(description="Ping")
async def ping(self, ctx: commands.Context) -> None:
    await ctx.send("Pong!")
```

## Edits

```python
@commands.Cog.listener()
async def on_message_edit(self, before: discord.Message, after: discord.Message) -> None:
    if after.author.bot or before.content == after.content:   # link previews also trigger edits
        return
    print(f"{after.author} edited: {before.content!r} → {after.content!r}")
```

`on_message_edit` only fires for cached messages. Use `on_raw_message_edit` for all.

## Deletes

```python
@commands.Cog.listener()
async def on_raw_message_delete(self, payload: discord.RawMessageDeleteEvent) -> None:
    message = payload.cached_message
    if message is None:
        print(f"Uncached message {payload.message_id} deleted")
    else:
        print(f"{message.author} deleted: {message.content}")

@commands.Cog.listener()
async def on_raw_bulk_message_delete(self, payload: discord.RawBulkMessageDeleteEvent) -> None:
    print(f"{len(payload.message_ids)} messages deleted, {len(payload.cached_messages)} were cached")
```

Increase the cache with `commands.Bot(max_messages=5000)` for better edit/delete logs.

## XP for chatting (expert bot)

```python
@commands.Cog.listener()
async def on_message(self, message: discord.Message) -> None:
    if message.guild is None or message.author.bot:
        return
    key = (message.guild.id, message.author.id)
    if self._cooldowns.get(key, 0) > time.monotonic():
        return
    self._cooldowns[key] = time.monotonic() + 60
    total = await self.bot.db.levels.add_xp(message.guild.id, message.author.id, random.randint(15, 25))
```

## See also
- [Events](28-Events.md) · [Sending Messages](16-Sending-Messages.md) · [Audit Log System](../Audit-Log-System.md)
