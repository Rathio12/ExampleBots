# Components V2

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Components-AF52DE?style=flat-square) ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square)

<sub>[JavaScript portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `ContainerBuilder`, `TextDisplayBuilder`, `SectionBuilder`, `ThumbnailBuilder`, `MediaGalleryBuilder`, `SeparatorBuilder`, `FileBuilder` |
| **Flag** | `MessageFlags.IsComponentsV2` |
| **Requires** | discord.js 14.19+ |

Components V2 is Discord's layout system for messages. Instead of an embed plus buttons, you compose a message from blocks: text, images, separators, sections with accessories, and coloured containers.

## The building blocks

| Component | Purpose |
|---|---|
| `TextDisplay` | Markdown text (headings, lists, links, mentions) |
| `Section` | 1–3 text displays plus an **accessory** on the right (a thumbnail or a button) |
| `Thumbnail` | A small image (as a section accessory) |
| `MediaGallery` | 1–10 images/videos in a grid |
| `File` | An uploaded file shown inline |
| `Separator` | Spacing, optionally a divider line |
| `Container` | Groups components with an optional accent colour (like an embed's colour bar) |
| `ActionRow` | Buttons/selects, as before |

## Example: a status panel

```js
import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags,
  SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, ThumbnailBuilder,
} from 'discord.js';

const container = new ContainerBuilder()
  .setAccentColor(0x57f287)
  .addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## 🟢 play.example.net'),
        new TextDisplayBuilder().setContent('**12 / 100** players online\nVersion 1.21'),
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL('https://example.com/server-icon.png')),
  )
  .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
  .addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Updated every 5 minutes'))
  .addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('status:refresh').setLabel('Refresh').setStyle(ButtonStyle.Secondary),
    ),
  );

await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
```

## Media gallery

```js
import { MediaGalleryBuilder, MediaGalleryItemBuilder } from 'discord.js';

const gallery = new MediaGalleryBuilder().addItems(
  new MediaGalleryItemBuilder().setURL('https://example.com/1.png').setDescription('Screenshot 1'),
  new MediaGalleryItemBuilder().setURL('attachment://local.png'),   // uploaded file
);
await channel.send({ components: [gallery], files: ['./local.png'], flags: MessageFlags.IsComponentsV2 });
```

## Section with a button accessory

```js
new SectionBuilder()
  .addTextDisplayComponents(new TextDisplayBuilder().setContent('**Daily reward**\nClaim 100 coins'))
  .setButtonAccessory(new ButtonBuilder().setCustomId('daily:claim').setLabel('Claim').setStyle(ButtonStyle.Success));
```

## Rules

- A message with `IsComponentsV2` **can't** have `content` or `embeds`. Use text displays instead.
- Once a message is sent as V2, it can't be edited back to a classic message.
- Up to 40 components in total (nested ones count).
- Interactions (buttons/selects inside) work exactly like before. Update with `interaction.update({ components: [...] })`.

## Embeds or V2?

| Use embeds when… | Use V2 when… |
|---|---|
| You want maximum compatibility | You need layout flexibility (images beside text, multiple sections) |
| Simple info cards | Dashboards, status panels, shop/catalogue views |
| You need `content` text alongside | Everything can live in components |

## See also
- [Embeds](11-Embeds.md) · [Buttons](12-Buttons.md)
- [Components & Modals](../Components-and-Modals.md#components-v2)
