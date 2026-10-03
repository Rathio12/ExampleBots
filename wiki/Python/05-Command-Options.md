# Command Options

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[Python portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key APIs** | type hints, `app_commands.Range`, `describe`, `rename`, `Transform` |
| **Used in** | [01-basic/bot.py](../../python/01-basic/bot.py) (`/roll`, `/avatar`, `/8ball`) |

In discord.py, **parameters are options**. The type hint chooses the option type, and a default value makes it optional.

## Type hints → option types

| Type hint | Discord option |
|---|---|
| `str` | String |
| `int` | Integer |
| `float` | Number |
| `bool` | Boolean |
| `discord.User` / `discord.Member` | User |
| `discord.abc.GuildChannel`, `discord.TextChannel`, `discord.VoiceChannel`, `discord.Thread`… | Channel (filtered by type) |
| `discord.Role` | Role |
| `discord.User \| discord.Role` | Mentionable |
| `discord.Attachment` | Attachment |
| `app_commands.Range[int, 1, 100]` | Integer with min/max |
| `app_commands.Range[str, 3, 200]` | String with min/max length |
| `Literal["a", "b"]` / an `Enum` | [Choices](07-Choices.md) |

## Example with every type

```python
from typing import Literal

@app_commands.command(description="Shows every option type")
@app_commands.describe(
    text="Some text", amount="1-100", ratio="0.0-1.0", public="Show to everyone?",
    user="A user", channel="A text channel", role="A role", file="Upload a file",
)
async def example(
    self,
    interaction: discord.Interaction,
    text: app_commands.Range[str, 3, 200],                 # required (no default)
    amount: app_commands.Range[int, 1, 100] = 10,          # optional, default 10
    ratio: app_commands.Range[float, 0.0, 1.0] = 0.5,
    public: bool = False,
    user: discord.Member | None = None,
    channel: discord.TextChannel | None = None,
    role: discord.Role | None = None,
    file: discord.Attachment | None = None,
    mode: Literal["fast", "safe"] = "safe",
) -> None:
    user = user or interaction.user
    await interaction.response.send_message(f"{text=} {amount=} {user=}", ephemeral=not public)
```

**Rules:** required parameters must come before optional ones, there are at most 25 options, and names must be lowercase and 1–32 characters.

## Descriptions and names

```python
@app_commands.describe(sides="How many sides the die has")
@app_commands.rename(when="in")           # Python can't name a parameter "in"
async def remind(self, interaction, when: str, sides: int = 6): ...
```

## Members vs users

`discord.Member` gives server data (roles, nickname, joined_at). If the selected user isn't in the server, discord.py raises an error before your function runs, so use `discord.User` when that's possible (e.g. `/ban` for people who already left):

```python
async def userinfo(self, interaction, member: discord.Member | None = None):
    member = member or interaction.user
    roles = [r.mention for r in reversed(member.roles) if r != interaction.guild.default_role]
```

## Channel type filtering

The type hint restricts which channels show up:

```python
channel: discord.TextChannel                           # text channels only
channel: discord.TextChannel | discord.Thread          # text channels and threads
channel: discord.VoiceChannel                          # voice only
channel: discord.abc.GuildChannel                      # any
```

## Attachments

```python
async def upload(self, interaction, file: discord.Attachment):
    if not (file.content_type or "").startswith("image/"):
        return await interaction.response.send_message("Please upload an image.", ephemeral=True)
    data = await file.read()          # bytes
    await interaction.response.send_message(f"{file.filename}: {file.size} bytes, {file.width}x{file.height}")
```

## Transformers: custom parsing

Convert raw input into your own type before the command runs:

```python
class DurationTransformer(app_commands.Transformer):
    async def transform(self, interaction: discord.Interaction, value: str) -> int:
        seconds = parse_duration(value)
        if seconds is None:
            raise app_commands.AppCommandError("Use a duration like 10m or 2h.")
        return seconds


async def timeout(self, interaction, member: discord.Member,
                  duration: app_commands.Transform[int, DurationTransformer]): ...
```

## Full example: `/roll`

```python
@app_commands.command(description="Roll dice")
@app_commands.describe(sides="Sides per die", count="How many dice")
async def roll(
    self,
    interaction: discord.Interaction,
    sides: app_commands.Range[int, 2, 1000] = 6,
    count: app_commands.Range[int, 1, 20] = 1,
) -> None:
    rolls = [random.randint(1, sides) for _ in range(count)]
    await interaction.response.send_message(f"🎲 {count}d{sides}: {', '.join(map(str, rolls))} = **{sum(rolls)}**")
```

## See also
- [Choices](07-Choices.md) · [Autocomplete](08-Autocomplete.md) · [Subcommands & Groups](06-Subcommands-and-Groups.md)
