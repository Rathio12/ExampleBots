# Embeds

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[Python portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key class** | `discord.Embed` |
| **Limits** | 10 per message, 6,000 characters total, 25 fields |
| **Used in** | [02-enhanced general.py](../../python/02-enhanced/bot/cogs/general.py) |

## Every embed field

```python
embed = discord.Embed(
    title="Title",                                   # 256 chars
    url="https://discordpy.readthedocs.io",          # makes the title a link
    description="Supports **Markdown** and <@123>",  # 4,096 chars
    colour=discord.Colour.blurple(),                 # or 0x5865F2
    timestamp=discord.utils.utcnow(),
)
embed.set_author(name="Author", url="https://example.com", icon_url="https://i.imgur.com/AfFp7pu.png")
embed.set_thumbnail(url="https://i.imgur.com/AfFp7pu.png")
embed.add_field(name="Regular field", value="Full width", inline=False)
embed.add_field(name="Inline 1", value="Side by side")      # inline=True is the default
embed.add_field(name="Inline 2", value="Side by side")
embed.set_image(url="https://i.imgur.com/AfFp7pu.png")
embed.set_footer(text="Footer", icon_url="https://i.imgur.com/AfFp7pu.png")

await interaction.response.send_message(embed=embed)
```

## Colours

```python
discord.Colour.green()
discord.Colour.from_rgb(255, 0, 0)
discord.Colour(0xED4245)
member.colour              # role colour (Colour.default() if none)
```

## Fields

```python
embed.add_field(name="Members", value=str(guild.member_count))   # value must be a non-empty string
embed.insert_field_at(0, name="First", value="…")
embed.set_field_at(1, name="Changed", value="…")
embed.remove_field(2)
embed.clear_fields()
len(embed)                 # total characters (check against 6,000)
```

## Truncating user content

```python
def truncate(text: str | None, limit: int = 1024) -> str:
    if not text:
        return ""
    return text if len(text) <= limit else text[: limit - 1] + "…"

embed.add_field(name="Content", value=truncate(message.content) or "*empty*", inline=False)
```

## Timestamps

```python
embed.add_field(name="Joined", value=discord.utils.format_dt(member.joined_at, "R"))   # "3 days ago"
```

Styles: `t`, `T`, `d`, `D`, `f`, `F`, `R` (see [Embeds & Messages](../Embeds-and-Messages.md#timestamps)).

## Local images

```python
file = discord.File("chart.png", filename="chart.png")
embed.set_image(url="attachment://chart.png")
await channel.send(embed=embed, file=file)
```

## Editing an existing embed

```python
embed = message.embeds[0]
embed.colour = discord.Colour.red()
embed.set_footer(text="Closed")
await message.edit(embed=embed)
```

## From/to dict

```python
data = embed.to_dict()
embed = discord.Embed.from_dict(data)   # handy for storing templates in a database
```

## Helper used in the examples

```python
def embed(colour: discord.Colour = PRIMARY, **kwargs) -> discord.Embed:
    return discord.Embed(colour=colour, timestamp=discord.utils.utcnow(), **kwargs)
```

## Common errors

| Error | Cause |
|---|---|
| `In embeds.0.fields.0.value: This field is required` | Empty field value |
| `Must be 1024 or fewer in length` | Untruncated content |
| `Embed size exceeds maximum size of 6000` | Too much text in total |

## See also
- [Components V2](15-Components-V2.md) · [Files & Attachments](19-Files-and-Attachments.md) · [Embeds & Messages](../Embeds-and-Messages.md)
