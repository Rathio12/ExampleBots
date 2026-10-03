# Modals

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Components-AF52DE?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `discord.ui.Modal`, `discord.ui.TextInput`, `discord.TextStyle`, `discord.ui.Label` |
| **Used in** | [02-enhanced interactive.py](../../python/02-enhanced/bot/cogs/interactive.py) (feedback) |

## Defining a modal

```python
class FeedbackModal(discord.ui.Modal, title="Send feedback"):
    subject = discord.ui.TextInput(label="Subject", max_length=100)
    message = discord.ui.TextInput(
        label="Your feedback",
        style=discord.TextStyle.paragraph,          # multi-line
        placeholder="What do you like? What could be better?",
        min_length=10,
        max_length=1000,
        required=True,
        default="",                                 # pre-filled text
    )

    async def on_submit(self, interaction: discord.Interaction) -> None:
        await interaction.response.send_message(f"Thanks! Got: **{self.subject.value}**", ephemeral=True)

    async def on_error(self, interaction: discord.Interaction, error: Exception) -> None:
        await interaction.response.send_message("Something went wrong.", ephemeral=True)
```

## Showing it

```python
@app_commands.command()
async def feedback(self, interaction: discord.Interaction) -> None:
    await interaction.response.send_modal(FeedbackModal())   # must be the first response
```

From a button callback: `await interaction.response.send_modal(FeedbackModal())`.

## Passing context into a modal

```python
class EditTagModal(discord.ui.Modal, title="Edit tag"):
    content = discord.ui.TextInput(label="Content", style=discord.TextStyle.paragraph)

    def __init__(self, tag_name: str, current: str) -> None:
        super().__init__()
        self.tag_name = tag_name
        self.content.default = current               # pre-fill with the current text

    async def on_submit(self, interaction: discord.Interaction) -> None:
        await db.update_tag(interaction.guild_id, self.tag_name, self.content.value)
        await interaction.response.send_message("Updated!", ephemeral=True)
```

## Labels and selects in modals

discord.py 2.6+ supports Discord's label component, which can wrap a text input **or a select menu**:

```python
class ReportModal(discord.ui.Modal, title="Report a problem"):
    category = discord.ui.Label(
        text="Category",
        description="What kind of problem?",
        component=discord.ui.Select(options=[
            discord.SelectOption(label="Bug", value="bug"),
            discord.SelectOption(label="Abuse", value="abuse"),
        ]),
    )
    details = discord.ui.Label(
        text="Details",
        component=discord.ui.TextInput(style=discord.TextStyle.paragraph),
    )

    async def on_submit(self, interaction: discord.Interaction) -> None:
        category = self.category.component.values[0]
        details = self.details.component.value
        await interaction.response.send_message(f"Reported {category}: {details}", ephemeral=True)
```

## Rules

- `send_modal` can't come after `defer()`, and can't respond to another modal.
- Title max 45 characters, max 5 components.
- Validate text in `on_submit` (only length/required are enforced by Discord).
- Modals have a timeout (`Modal(timeout=…)`). Long forms can expire.

## See also
- [Buttons](12-Buttons.md) · [Context Menus](09-Context-Menus.md) · [Select Menus](13-Select-Menus.md)
