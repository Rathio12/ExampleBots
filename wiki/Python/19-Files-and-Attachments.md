# Files & Attachments

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `discord.File`, `discord.Attachment` |
| **Used in** | [03-expert audit.py](../../python/03-expert/bot/cogs/audit.py) (bulk-delete transcripts) |

## Sending files

```python
await channel.send(file=discord.File("images/cat.png"))
await channel.send(files=[discord.File("a.png"), discord.File("b.png")])      # up to 10

# Custom name, spoiler, alt text
await channel.send(file=discord.File("cat.png", filename="cat.png", spoiler=True, description="A cat"))

# From memory
import io
data = io.BytesIO("name,xp\nalice,120\n".encode("utf-8"))
await channel.send("Export:", file=discord.File(data, filename="leaderboard.csv"))
```

A `discord.File` can only be sent **once**. Create a new one for every send.

## Images inside embeds

```python
file = discord.File("logo.png", filename="logo.png")
embed = discord.Embed(title="Report").set_thumbnail(url="attachment://logo.png")
await channel.send(embed=embed, file=file)
```

## Receiving attachments

As a slash command option:

```python
async def upload(self, interaction: discord.Interaction, file: discord.Attachment):
    print(file.filename, file.size, file.content_type, file.url, file.width, file.height)
    data = await file.read()                      # bytes
    await file.save("downloads/" + file.filename)  # straight to disk
```

From messages:

```python
@commands.Cog.listener()
async def on_message(self, message: discord.Message):
    for attachment in message.attachments:
        if (attachment.content_type or "").startswith("image/"):
            print("Image:", attachment.url)
```

Check `attachment.size` before reading so users can't make your bot download huge files.

## Re-uploading an attachment

```python
file = await attachment.to_file()
await other_channel.send(file=file)
```

## Transcript example (expert bot)

```python
lines = [f"[{m.created_at.isoformat()}] {m.author} ({m.author.id}): {m.content}" for m in cached]
file = discord.File(io.BytesIO("\n".join(lines).encode()), filename=f"transcript-{channel_id}.txt")
await log_channel.send(embed=summary, file=file)
```

## Limits

- Upload size depends on the server's boost tier (10 MB without boosts).
- 10 files per message.
- CDN attachment URLs expire. Store the file, not the URL.

## See also
- [Embeds](11-Embeds.md) · [Sending Messages](16-Sending-Messages.md)
