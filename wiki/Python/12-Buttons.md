# Buttons

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Components-AF52DE?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `discord.ui.View`, `discord.ui.Button`, `discord.ButtonStyle`, `discord.ui.DynamicItem` |
| **Used in** | [02-enhanced interactive.py](../../python/02-enhanced/bot/cogs/interactive.py) (poll) · [03-expert leveling.py](../../python/03-expert/bot/cogs/leveling.py) (leaderboard) |

In discord.py, buttons live in a **View**. Each button has a callback method on the view.

## A view with buttons

```python
class Confirm(discord.ui.View):
    def __init__(self, author_id: int) -> None:
        super().__init__(timeout=30)          # seconds; None = never times out
        self.author_id = author_id
        self.value: bool | None = None

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        # Runs before every callback: only the command author may click
        if interaction.user.id != self.author_id:
            await interaction.response.send_message("This isn't for you.", ephemeral=True)
            return False
        return True

    @discord.ui.button(label="Confirm", style=discord.ButtonStyle.success, emoji="✅")
    async def confirm(self, interaction: discord.Interaction, button: discord.ui.Button) -> None:
        self.value = True
        await interaction.response.edit_message(content="Confirmed!", view=None)
        self.stop()                           # resolves view.wait()

    @discord.ui.button(label="Cancel", style=discord.ButtonStyle.danger)
    async def cancel(self, interaction: discord.Interaction, button: discord.ui.Button) -> None:
        self.value = False
        await interaction.response.edit_message(content="Cancelled.", view=None)
        self.stop()


@app_commands.command()
async def delete_all(self, interaction: discord.Interaction) -> None:
    view = Confirm(interaction.user.id)
    await interaction.response.send_message("Are you sure?", view=view)
    await view.wait()                         # until stop() or timeout
    if view.value is None:
        await interaction.edit_original_response(content="Timed out.", view=None)
```

| Style | Colour |
|---|---|
| `primary` / `blurple` | Blurple |
| `secondary` / `grey` | Grey |
| `success` / `green` | Green |
| `danger` / `red` | Red |
| `link` | Opens a URL (no callback) |
| `premium` | Purchase button (needs `sku_id`) |

## Link buttons and dynamic buttons

```python
view = discord.ui.View()
view.add_item(discord.ui.Button(label="Docs", url="https://discordpy.readthedocs.io"))

# Buttons created in a loop
for i in range(1, 4):
    button = discord.ui.Button(label=str(i), custom_id=f"num:{i}")
    button.callback = make_callback(i)        # async def callback(interaction)
    view.add_item(button)
```

## Timeouts

```python
async def on_timeout(self) -> None:
    for item in self.children:
        item.disabled = True
    if self.message:                          # store it after sending: view.message = await interaction.original_response()
        await self.message.edit(view=self)
```

## Persistent views (survive restarts)

Normal views stop working when the bot restarts. A **persistent view** has `timeout=None`, a fixed `custom_id` on every item, and is registered at startup:

```python
class RolePanel(discord.ui.View):
    def __init__(self) -> None:
        super().__init__(timeout=None)

    @discord.ui.button(label="Get notified", custom_id="rolepanel:notify", style=discord.ButtonStyle.primary)
    async def notify(self, interaction: discord.Interaction, button: discord.ui.Button) -> None:
        role = interaction.guild.get_role(NOTIFY_ROLE_ID)
        await interaction.user.add_roles(role)
        await interaction.response.send_message("Done!", ephemeral=True)


class MyBot(commands.Bot):
    async def setup_hook(self) -> None:
        self.add_view(RolePanel())            # handles clicks on old messages
```

## Dynamic items: state in the custom ID

For persistent buttons that carry data (like `poll:123:yes`), use `DynamicItem` with a regex template:

```python
class VoteButton(discord.ui.DynamicItem[discord.ui.Button], template=r"vote:(?P<poll>\d+):(?P<choice>yes|no)"):
    def __init__(self, poll_id: int, choice: str) -> None:
        super().__init__(discord.ui.Button(label=choice.title(), custom_id=f"vote:{poll_id}:{choice}"))
        self.poll_id, self.choice = poll_id, choice

    @classmethod
    async def from_custom_id(cls, interaction, item, match):
        return cls(int(match["poll"]), match["choice"])

    async def callback(self, interaction: discord.Interaction) -> None:
        await record_vote(self.poll_id, interaction.user.id, self.choice)
        await interaction.response.send_message("Vote recorded!", ephemeral=True)

# setup_hook:
self.add_dynamic_items(VoteButton)
```

## Responding in a callback

| Method | Effect |
|---|---|
| `interaction.response.edit_message(...)` | Edit the message with the button |
| `interaction.response.defer()` | Acknowledge silently, edit later |
| `interaction.response.send_message(...)` | New message (often ephemeral) |
| `interaction.response.send_modal(...)` | Open a form |

## Rows

```python
@discord.ui.button(label="A", row=0)
@discord.ui.button(label="B", row=1)
```

Max 5 rows, 5 buttons per row.

## See also
- [Select Menus](13-Select-Menus.md) · [Modals](14-Modals.md) · [Components & Modals](../Components-and-Modals.md)
