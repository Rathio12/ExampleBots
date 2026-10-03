# Embeds

<sub>[JavaScript portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key class** | `EmbedBuilder` |
| **Limits** | 10 embeds/message, 6,000 characters total, 25 fields |
| **Used in** | every Enhanced/Expert command, e.g. [serverinfo.js](../../javascript/02-enhanced/src/commands/serverinfo.js) |

Embeds are the rich cards bots use for structured information.

## Every embed field

```js
import { EmbedBuilder } from 'discord.js';

const embed = new EmbedBuilder()
  .setColor(0x5865f2)                                     // number, '#5865F2', or Colors.Blurple
  .setTitle('Title')                                      // 256 chars
  .setURL('https://discord.js.org')                       // makes the title a link
  .setAuthor({ name: 'Author', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
  .setDescription('Supports **Markdown**, [links](https://example.com) and mentions <@123>')   // 4,096 chars
  .setThumbnail('https://i.imgur.com/AfFp7pu.png')        // small image, top right
  .addFields(
    { name: 'Regular field', value: 'Full width' },
    { name: 'Inline 1', value: 'Side by side', inline: true },
    { name: 'Inline 2', value: 'Side by side', inline: true },
  )
  .setImage('https://i.imgur.com/AfFp7pu.png')            // large image, bottom
  .setTimestamp()                                         // now, or setTimestamp(date)
  .setFooter({ text: 'Footer', iconURL: 'https://i.imgur.com/AfFp7pu.png' });   // 2,048 chars

await interaction.reply({ embeds: [embed] });
```

## Colours

```js
import { Colors, resolveColor } from 'discord.js';

embed.setColor(Colors.Green);
embed.setColor('#FF0000');
embed.setColor([255, 0, 0]);
embed.setColor(member.displayColor);   // the member's role colour
```

The examples keep a small palette (`primary`, `success`, `warning`, `danger`) in a helper file so every reply looks consistent.

## Fields in detail

```js
embed.addFields({ name: 'Members', value: `${guild.memberCount}`, inline: true });
embed.setFields([...]);                 // replace all fields
embed.spliceFields(0, 1);               // remove the first field
```

- `value` must be a **non-empty string**. Convert numbers with template strings, and use `'None'` or `'​'` for "empty".
- Up to 3 inline fields render per row on desktop.
- Name max 256, value max 1,024 characters.

## Truncating user content

```js
const truncate = (text, max = 1024) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
embed.addFields({ name: 'Content', value: truncate(message.content) || '*empty*' });
```

## Timestamps inside embeds

```js
import { time, TimestampStyles } from 'discord.js';

embed.addFields({ name: 'Joined', value: time(member.joinedAt, TimestampStyles.RelativeTime) });   // "3 days ago"
// or manually: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
```

## Images from uploaded files

```js
const file = new AttachmentBuilder('./chart.png', { name: 'chart.png' });
embed.setImage('attachment://chart.png');
await interaction.reply({ embeds: [embed], files: [file] });
```

## Editing an existing embed

```js
const old = message.embeds[0];
const updated = EmbedBuilder.from(old).setColor(Colors.Red).setFooter({ text: 'Closed' });
await message.edit({ embeds: [updated] });
```

## Multiple embeds

```js
await channel.send({ embeds: [embedA, embedB, embedC] });   // up to 10, 6,000 chars combined
```

## Reusable embed helper

```js
// lib/format.js (expert bot)
export const embed = (color = 0x5865f2) => new EmbedBuilder().setColor(color).setTimestamp();

// usage
await interaction.reply({ embeds: [embed(0x57f287).setTitle('✅ Done')] });
```

## Common errors

| Error | Cause |
|---|---|
| `Invalid Form Body … embeds[0].fields[0].value: This field is required` | Empty field value |
| `… must be 1024 or fewer in length` | Untruncated user content |
| `Embed size exceeds maximum size of 6000` | Too much text across all embeds |
| Image not showing | URL not public/direct, or `attachment://` name doesn't match |

## See also
- [Embeds & Messages](../Embeds-and-Messages.md) · [Components V2](15-Components-V2.md) · [Files & Attachments](19-Files-and-Attachments.md)
