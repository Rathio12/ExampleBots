# Select Menus

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Components-AF52DE?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `discord.ui.Select`, `UserSelect`, `RoleSelect`, `ChannelSelect`, `MentionableSelect`, `discord.SelectOption` |
| **Used in** | [02-enhanced interactive.py](../../python/02-enhanced/bot/cogs/interactive.py) (trivia) |

## String select as a decorator

```python
class ColourView(discord.ui.View):
    @discord.ui.select(
        placeholder="Choose a colour…",
        min_values=1,
        max_values=1,
        options=[
            discord.SelectOption(label="Red", value="red", emoji="🟥", description="Warm"),
            discord.SelectOption(label="Blue", value="blue", emoji="🟦", default=True),
            discord.SelectOption(label="Green", value="green", emoji="🟩"),
        ],
    )
    async def pick(self, interaction: discord.Interaction, select: discord.ui.Select) -> None:
        await interaction.response.edit_message(content=f"You picked **{select.values[0]}**", view=None)
```

## String select as a subclass (dynamic options)

```python
class TriviaSelect(discord.ui.Select):
    def __init__(self, question: dict) -> None:
        self.question = question
        options = [discord.SelectOption(label=a, value=str(i)) for i, a in enumerate(question["answers"])]
        super().__init__(placeholder="Pick your answer…", options=options)

    async def callback(self, interaction: discord.Interaction) -> None:
        correct = int(self.values[0]) == self.question["correct"]
        await interaction.response.send_message("✅ Correct!" if correct else "❌ Wrong!", ephemeral=True)


view = discord.ui.View(timeout=600)
view.add_item(TriviaSelect(question))
await interaction.response.send_message("Trivia time!", view=view)
```

## Auto-populated selects

```python
class Pickers(discord.ui.View):
    @discord.ui.select(cls=discord.ui.UserSelect, placeholder="Pick users", max_values=5)
    async def users(self, interaction: discord.Interaction, select: discord.ui.UserSelect) -> None:
        names = ", ".join(u.mention for u in select.values)       # Member/User objects
        await interaction.response.send_message(f"Selected: {names}", ephemeral=True)

    @discord.ui.select(cls=discord.ui.RoleSelect, placeholder="Pick roles")
    async def roles(self, interaction: discord.Interaction, select: discord.ui.RoleSelect) -> None:
        ...

    @discord.ui.select(cls=discord.ui.ChannelSelect, channel_types=[discord.ChannelType.text])
    async def channel(self, interaction: discord.Interaction, select: discord.ui.ChannelSelect) -> None:
        channel = select.values[0]                                 # AppCommandChannel: use .resolve() or guild.get_channel(channel.id)
        ...
```

## Self-assignable roles

```python
class RolePicker(discord.ui.View):
    def __init__(self) -> None:
        super().__init__(timeout=None)

    @discord.ui.select(
        custom_id="roles:pick", min_values=0, max_values=3, placeholder="Choose your roles",
        options=[
            discord.SelectOption(label="Announcements", value="111111111111111111", emoji="📢"),
            discord.SelectOption(label="Events", value="222222222222222222", emoji="🎉"),
            discord.SelectOption(label="Gaming", value="333333333333333333", emoji="🎮"),
        ],
    )
    async def pick(self, interaction: discord.Interaction, select: discord.ui.Select) -> None:
        offered = {int(o.value) for o in select.options}
        chosen = {int(v) for v in select.values}
        member = interaction.user
        await member.add_roles(*(discord.Object(id=r) for r in chosen))
        await member.remove_roles(*(discord.Object(id=r) for r in offered - chosen))
        await interaction.response.send_message("✅ Roles updated!", ephemeral=True)

# setup_hook: self.add_view(RolePicker())
```

## Limits

25 options, values unique, 1 select per row (it fills the row).

## See also
- [Buttons](12-Buttons.md) · [Modals](14-Modals.md) · [Roles](24-Roles.md)
