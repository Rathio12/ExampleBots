# Files & Attachments

<sub>[JavaScript portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `AttachmentBuilder`, `Attachment` |
| **Permission** | Attach Files |
| **Used in** | [03-expert messageDeleteBulk.js](../../javascript/03-expert/src/events/audit/messageDeleteBulk.js) (transcripts) |

## Sending files

```js
import { AttachmentBuilder } from 'discord.js';

// From disk
await channel.send({ files: ['./images/cat.png'] });

// With a custom name and alt text
const file = new AttachmentBuilder('./images/cat.png', { name: 'cat.png', description: 'A cat' });
await interaction.reply({ files: [file] });

// From memory (generated text, images, CSV…)
const csv = new AttachmentBuilder(Buffer.from('name,xp\nalice,120\n', 'utf8'), { name: 'leaderboard.csv' });
await channel.send({ content: 'Export:', files: [csv] });

// From a URL
await channel.send({ files: ['https://example.com/chart.png'] });

// Spoiler
const secret = new AttachmentBuilder('./spoiler.png', { name: 'SPOILER_spoiler.png' });   // or .setSpoiler(true)
```

## Using a file inside an embed

```js
const logo = new AttachmentBuilder('./logo.png', { name: 'logo.png' });
const embed = new EmbedBuilder().setTitle('Report').setThumbnail('attachment://logo.png');
await channel.send({ embeds: [embed], files: [logo] });
```

The name after `attachment://` must match exactly.

## Receiving files

From a slash command option:

```js
.addAttachmentOption((o) => o.setName('file').setDescription('Upload').setRequired(true))

const file = interaction.options.getAttachment('file', true);
console.log(file.name, file.size, file.contentType, file.url, file.width, file.height);
```

From a message:

```js
client.on(Events.MessageCreate, async (message) => {
  for (const attachment of message.attachments.values()) {
    if (attachment.contentType?.startsWith('image/')) console.log('Image:', attachment.url);
  }
});
```

## Downloading an attachment

```js
const response = await fetch(file.url);
const buffer = Buffer.from(await response.arrayBuffer());
```

Check `file.size` first so users can't make your bot download huge files.

## Generating a transcript

From the expert bot's bulk-delete handler:

```js
const lines = messages.map((m) => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content}`);
const transcript = new AttachmentBuilder(Buffer.from(lines.join('\n'), 'utf8'), { name: `transcript-${channel.id}.txt` });
await logChannel.send({ embeds: [summary], files: [transcript] });
```

## Limits

- Upload size depends on the server's boost level (10 MB without boosts).
- Max 10 files per message.
- Attachment CDN URLs expire after a while. Re-upload files you need to keep, don't store URLs.

## See also
- [Embeds](11-Embeds.md) · [Sending Messages](16-Sending-Messages.md)
