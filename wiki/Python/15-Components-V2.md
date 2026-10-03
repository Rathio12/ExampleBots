# Components V2

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Components-AF52DE?style=flat-square) ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square)

<sub>[Python portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `discord.ui.LayoutView`, `Container`, `TextDisplay`, `Section`, `Thumbnail`, `MediaGallery`, `Separator`, `ActionRow` |
| **Requires** | discord.py 2.6+ |

Components V2 builds messages from layout blocks instead of an embed. In discord.py you declare them on a **`LayoutView`**. discord.py sets the Components V2 flag for you when you send one.

## Building blocks

| Component | Purpose |
|---|---|
| `TextDisplay` | Markdown text |
| `Section` | Up to 3 text items plus an **accessory** (thumbnail or button) |
| `Thumbnail` | Small image accessory |
| `MediaGallery` | Grid of 1–10 images/videos |
| `File` | Inline uploaded file |
| `Separator` | Spacing and optional divider |
| `Container` | Groups components with an accent colour |
| `ActionRow` | Buttons/selects |

## Example: a status panel

```python
class StatusPanel(discord.ui.LayoutView):
    def __init__(self, players: int, max_players: int) -> None:
        super().__init__(timeout=None)

        refresh = discord.ui.Button(label="Refresh", style=discord.ButtonStyle.secondary, custom_id="status:refresh")
        refresh.callback = self.refresh

        container = discord.ui.Container(
            discord.ui.Section(
                "## 🟢 play.example.net",
                f"**{players} / {max_players}** players online",
                accessory=discord.ui.Thumbnail("https://example.com/server-icon.png"),
            ),
            discord.ui.Separator(),
            discord.ui.TextDisplay("-# Updated every 5 minutes"),
            discord.ui.ActionRow(refresh),
            accent_colour=discord.Colour.green(),
        )
        self.add_item(container)

    async def refresh(self, interaction: discord.Interaction) -> None:
        status = await fetch_status()
        await interaction.response.edit_message(view=StatusPanel(status.players, status.max_players))


await interaction.response.send_message(view=StatusPanel(12, 100))
```

`Section` accepts plain strings as text displays.

## Media gallery

```python
gallery = discord.ui.MediaGallery(
    discord.MediaGalleryItem("https://example.com/1.png", description="Screenshot 1"),
    discord.MediaGalleryItem("https://example.com/2.png"),
)
view = discord.ui.LayoutView()
view.add_item(gallery)
await channel.send(view=view)
```

## Declaring items as class attributes

```python
class Welcome(discord.ui.LayoutView):
    header = discord.ui.TextDisplay("# Welcome!")
    divider = discord.ui.Separator()
    body = discord.ui.TextDisplay("Read the rules in <#123456789012345678> and grab roles below.")
```

## Rules

- A V2 message can't have `content` or `embeds`. Put text in `TextDisplay`s.
- You can't mix a `LayoutView` with classic `View` components in one message.
- Up to 40 components in total.

## See also
- [Embeds](11-Embeds.md) · [Buttons](12-Buttons.md) · [Components & Modals](../Components-and-Modals.md#components-v2)
