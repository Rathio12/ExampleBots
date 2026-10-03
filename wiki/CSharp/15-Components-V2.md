# Components V2

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Components-AF52DE?style=flat-square) ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square)

<sub>[C# portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `ComponentBuilderV2`, `ContainerBuilder`, `TextDisplayBuilder`, `SectionBuilder`, `ThumbnailBuilder`, `MediaGalleryBuilder`, `SeparatorBuilder` |
| **Flag** | `MessageFlags.ComponentsV2` |
| **Requires** | Discord.Net 3.18+ |

Components V2 composes a message from layout blocks (text, sections, images, separators, containers) instead of embeds.

## Building blocks

| Builder | Purpose |
|---|---|
| `TextDisplayBuilder` | Markdown text |
| `SectionBuilder` | Text plus an accessory (thumbnail or button) |
| `ThumbnailBuilder` | Small image accessory |
| `MediaGalleryBuilder` | Grid of 1–10 images/videos |
| `FileComponentBuilder` | Inline uploaded file |
| `SeparatorBuilder` | Spacing and optional divider |
| `ContainerBuilder` | Groups components with an accent colour |
| `ActionRowBuilder` | Buttons/selects |

Extension methods such as `WithTextDisplay`, `WithSection`, `WithSeparator`, `WithMediaGallery`, `WithContainer` and `WithActionRow` work on both `ComponentBuilderV2` and `ContainerBuilder`.

## Example: a status panel

```csharp
var components = new ComponentBuilderV2()
    .WithContainer(new ContainerBuilder()
        .WithAccentColor(new Color(0x57F287))
        .WithTextDisplay("## 🟢 play.example.net")
        .WithTextDisplay("**12 / 100** players online")
        .WithSeparator(new SeparatorBuilder())
        .WithTextDisplay("-# Updated every 5 minutes")
        .WithActionRow(new ActionRowBuilder()
            .WithButton("Refresh", "status:refresh", ButtonStyle.Secondary)))
    .Build();

await Context.Channel.SendMessageAsync(components: components, flags: MessageFlags.ComponentsV2);
```

## Media gallery

```csharp
var gallery = new ComponentBuilderV2()
    .WithMediaGallery(["https://example.com/1.png", "https://example.com/2.png"])
    .Build();
await channel.SendMessageAsync(components: gallery, flags: MessageFlags.ComponentsV2);
```

## Handling the button

Buttons inside V2 layouts are routed exactly like classic ones:

```csharp
[ComponentInteraction("status:refresh")]
public async Task RefreshAsync()
{
    var status = await minecraft.GetStatusAsync(address);
    await ((SocketMessageComponent)Context.Interaction).UpdateAsync(m => m.Components = BuildPanel(status));
}
```

## Rules

- A V2 message can't contain `content` or `embeds`. Use text displays.
- Up to 40 components in total.
- Once sent as V2, the message stays V2.

## See also
- [Embeds](11-Embeds.md) · [Buttons](12-Buttons.md) · [Components & Modals](../Components-and-Modals.md#components-v2)
