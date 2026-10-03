# Editing, Deleting & Pinning

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[Python portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key APIs** | `fetch_message`, `history`, `Message.edit`, `Message.delete`, `TextChannel.purge`, `Message.pin` |
| **Used in** | [03-expert moderation.py](../../python/03-expert/bot/cogs/moderation.py) (`/purge`) |

## Fetching messages

```python
message = await channel.fetch_message(123456789012345678)

async for msg in channel.history(limit=50):              # newest first
    print(msg.author, msg.content)

async for msg in channel.history(limit=None, after=some_datetime, oldest_first=True):
    ...

messages = [m async for m in channel.history(limit=100)]
```

Reading history needs **Read Message History**.

## Editing (own messages only)

```python
await message.edit(content="New content")
await message.edit(content=None, embed=new_embed, view=None)   # remove content and buttons
await message.edit(attachments=[])                             # remove files
```

## Deleting

```python
await message.delete()
await message.delete(delay=10)                 # self-destruct after 10 s
await channel.send("Temporary", delete_after=10)
```

## Purging (bulk delete)

```python
from datetime import timedelta

deleted = await channel.purge(
    limit=100,
    check=lambda m: m.author.id == user.id,       # optional filter
    after=discord.utils.utcnow() - timedelta(days=14),
    oldest_first=False,                           # newest first even when `after` is set
    reason="Cleanup",
)
await interaction.followup.send(f"Deleted {len(deleted)} messages.", ephemeral=True)
```

`purge` uses bulk delete for messages younger than 14 days. Older ones would be deleted one by one (slowly), so the `after=` above skips them. Needs **Manage Messages**.

## Pinning

```python
await message.pin(reason="Important")
await message.unpin()
pinned = [m async for m in channel.pins()]
```

## Publishing (announcement channels)

```python
if channel.is_news():
    await message.publish()
```

## Handling already-deleted messages

```python
try:
    await message.delete()
except discord.NotFound:
    pass
```

## See also
- [Sending Messages](16-Sending-Messages.md) · [Moderation](25-Moderation.md) · [Message Events](29-Message-Events.md)
