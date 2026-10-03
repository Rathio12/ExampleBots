# Sending Messages

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[Python portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key APIs** | `Messageable.send`, `Message.reply`, `User.send`, `discord.AllowedMentions`, `discord.utils` |
| **Limits** | 2,000 characters, 10 embeds, 10 files |

## Sending to a channel

```python
channel = bot.get_channel(123456789012345678)            # cache (may be None)
channel = channel or await bot.fetch_channel(123456789012345678)

await channel.send("Hello!")
await channel.send(
    "With extras",
    embed=embed,
    view=view,
    file=discord.File("image.png"),
    allowed_mentions=discord.AllowedMentions.none(),
    silent=True,                    # no push notification
    suppress_embeds=True,           # no link previews
)
```

Anything "messageable" works: `TextChannel`, `Thread`, `VoiceChannel` (its text chat), `DMChannel`, `User`, `Member`, and `commands.Context`.

## Replying

```python
await message.reply("Got it!")                              # pings the author by default
await message.reply("Got it!", mention_author=False)        # no ping
```

## Direct messages

```python
try:
    await user.send("Hi from the bot!")
except discord.Forbidden:
    pass        # DMs closed or no shared server
```

## Mentions

| Mention | Code |
|---|---|
| User | `user.mention` or `f"<@{user.id}>"` |
| Role | `role.mention` |
| Channel | `channel.mention` |
| Slash command | `f"</ping:{command_id}>"` |
| Custom emoji | `str(emoji)` |

### AllowedMentions

```python
discord.AllowedMentions.none()                                     # ping nobody
discord.AllowedMentions(everyone=False, roles=False, users=True)   # users only
discord.AllowedMentions(users=[member])                            # exactly this member
discord.AllowedMentions(replied_user=False)
```

Set a safe default on the bot (`commands.Bot(..., allowed_mentions=...)`) and use `.none()` for user-provided content.

## Markdown helpers

```python
discord.utils.escape_markdown(member.display_name)    # **bold** names stay literal
discord.utils.escape_mentions(text)                   # neutralise @everyone and mentions
discord.utils.remove_markdown(text)
discord.utils.format_dt(dt, "R")                      # <t:…:R>
```

## Long text

```python
for i in range(0, len(text), 2000):
    await channel.send(text[i : i + 2000])
```

For logs or code, send a file instead ([Files](19-Files-and-Attachments.md)).

## Typing indicator

```python
async with channel.typing():
    result = await slow_work()
await channel.send(result)
```

## Forwarding a message

```python
await message.forward(destination_channel)   # discord.py 2.5+
```

## Common errors

| Exception | Cause |
|---|---|
| `discord.Forbidden` (50013 / 50001 / 50007) | Missing permission, can't see channel, DMs closed |
| `discord.HTTPException: 400 … Must be 2000 or fewer` | Content too long |
| `AttributeError: 'NoneType' object has no attribute 'send'` | `get_channel` returned None (wrong ID or not cached) |

## See also
- [Embeds](11-Embeds.md) · [Editing, Deleting & Pinning](17-Editing-Deleting-Pinning.md)
