# Autocomplete

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key APIs** | `@app_commands.autocomplete`, `@command.autocomplete("param")`, `app_commands.Choice` |
| **Used in** | [03-expert tags.py](../../python/03-expert/bot/cogs/tags.py) |

Autocomplete suggests values while the user types. Your callback receives the current text and returns up to 25 `Choice`s within 3 seconds.

## With a decorator (used in the expert bot)

```python
class Tags(commands.Cog):
    tag = app_commands.Group(name="tag", description="Tags")

    async def tag_name_autocomplete(self, interaction: discord.Interaction, current: str) -> list[app_commands.Choice[str]]:
        names = await self.bot.db.tags.search(interaction.guild_id, current.lower(), 25)
        return [app_commands.Choice(name=name, value=name) for name in names]

    @tag.command(name="show", description="Post a tag")
    @app_commands.autocomplete(name=tag_name_autocomplete)
    async def show(self, interaction: discord.Interaction, name: str) -> None:
        row = await self.bot.db.tags.get(interaction.guild_id, name.lower())
        if row is None:                                                  # always validate!
            return await interaction.response.send_message("No such tag.", ephemeral=True)
        await interaction.response.send_message(row["content"])
```

## With the command's `.autocomplete` method

```python
@app_commands.command()
async def fruit(self, interaction: discord.Interaction, name: str) -> None:
    await interaction.response.send_message(f"You picked {name}")

@fruit.autocomplete("name")
async def fruit_autocomplete(self, interaction: discord.Interaction, current: str) -> list[app_commands.Choice[str]]:
    fruits = ["Apple", "Banana", "Cherry", "Mango", "Orange"]
    return [app_commands.Choice(name=f, value=f) for f in fruits if current.lower() in f.lower()][:25]
```

## Depending on other options

`interaction.namespace` holds the values the user has already filled in:

```python
@city.autocomplete("city")
async def city_autocomplete(self, interaction: discord.Interaction, current: str):
    country = interaction.namespace.country           # another option of the same command
    cities = CITIES.get(country, [])
    return [app_commands.Choice(name=c, value=c) for c in cities if c.lower().startswith(current.lower())][:25]
```

## Label vs value

```python
return [app_commands.Choice(name=f"{p.title} ({p.price} €)", value=str(p.id)) for p in products]
```

The user sees `name`, and your command receives `value`. Type the value consistently (`str` above, so the parameter is `str`).

## Rules

- Max **25** choices, respond within **3 s** (no deferring).
- Exceptions in the callback are logged, and the user sees no suggestions.
- Users can submit text that isn't a suggestion, so **validate in the command**.
- Escape `%` and `_` when using the input in SQL `LIKE` ([SQLite](37-SQLite-Database.md)).

## See also
- [Choices](07-Choices.md) · [Command Options](05-Command-Options.md)
