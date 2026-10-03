# Choices

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[Python portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key APIs** | `@app_commands.choices`, `app_commands.Choice`, `typing.Literal`, `enum.Enum` |
| **Used in** | [03-expert moderation.py](../../python/03-expert/bot/cogs/moderation.py) (`/ban delete_messages`) |

Choices give an option a fixed dropdown. discord.py offers three ways to declare them.

## 1. `@app_commands.choices` (names differ from values)

```python
@app_commands.command(description="Ban a user")
@app_commands.choices(delete_messages=[
    app_commands.Choice(name="Don't delete any", value=0),
    app_commands.Choice(name="Previous hour", value=3600),
    app_commands.Choice(name="Previous 24 hours", value=86_400),
    app_commands.Choice(name="Previous 7 days", value=604_800),
])
async def ban(
    self,
    interaction: discord.Interaction,
    user: discord.User,
    delete_messages: app_commands.Choice[int] | None = None,
) -> None:
    seconds = delete_messages.value if delete_messages else 0
    label = delete_messages.name if delete_messages else "none"
```

Typing the parameter as `Choice[int]` gives you both `.name` and `.value`. You can also type it as plain `int` to receive only the value.

## 2. `Literal` (name = value)

```python
from typing import Literal

async def rps(self, interaction, choice: Literal["rock", "paper", "scissors"]):
    ...
```

## 3. Enums

```python
import enum

class Category(enum.Enum):
    dogs = "dogs"
    cats = "cats"
    birds = "birds"

async def animal(self, interaction, category: Category):
    await interaction.response.send_message(f"You picked {category.value}")
```

The member **names** are shown to users, and you receive the enum member.

## Choices vs autocomplete

| | Choices | Autocomplete |
|---|---|---|
| Values | Fixed at sync time | Computed live |
| Max | 25 | 25 shown at a time |
| Validation | Discord enforces it | You must validate |
| Use for | Small static lists | Database records, search |

## See also
- [Autocomplete](08-Autocomplete.md) · [Command Options](05-Command-Options.md)
