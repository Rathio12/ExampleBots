# Embeds & Messages

## Plain messages and Markdown

Message content supports Discord Markdown:

```
**bold**  *italic*  __underline__  ~~strike~~  ||spoiler||  `code`
# Heading 1   ## Heading 2   ### Heading 3   -# small subtext
> quote        - list item     1. numbered
[masked link](https://example.com)
```

Code blocks with syntax highlighting: three backticks plus a language name (` ```js `).

## Mentions and `allowedMentions`

| Mention | Syntax |
|---|---|
| User | `<@123>` |
| Role | `<@&123>` |
| Channel | `<#123>` |
| Slash command (clickable) | `</ping:COMMAND_ID>` |
| Custom emoji | `<:name:123>` / animated `<a:name:123>` |

Writing a mention in text doesn't always **ping**. `allowedMentions` decides who actually gets notified. This is the most important safety setting a bot has: if user-provided text (a tag, a poll question, a reminder) contains `@everyone`, you don't want your bot to ping the whole server.

```js
// JS: client-wide default used by the expert bot
new Client({ allowedMentions: { parse: ['users'] } });
// per message: ping nobody
await channel.send({ content: tag.content, allowedMentions: { parse: [] } });
```

```python
# Python
commands.Bot(..., allowed_mentions=discord.AllowedMentions(everyone=False, roles=False, users=True))
await channel.send(text, allowed_mentions=discord.AllowedMentions.none())
```

```csharp
// C#
await channel.SendMessageAsync(text, allowedMentions: AllowedMentions.None);
```

## Timestamps

`<t:UNIX_SECONDS:STYLE>` renders in **each viewer's own timezone and language**:

| Style | Example output |
|---|---|
| `t` | 16:20 |
| `T` | 16:20:30 |
| `d` | 20/04/2026 |
| `D` | 20 April 2026 |
| `f` | 20 April 2026 16:20 |
| `F` | Monday, 20 April 2026 16:20 |
| `R` | in 2 hours / 3 days ago |

Helpers: `time()` in discord.js, `discord.utils.format_dt()` in Python, `TimestampTag` in Discord.Net, or just build the string (the examples do this).

## Embeds

```
┌────────────────────────────────────────┐
│▌ Author name (icon)                    │
│▌ Title (can be a link)          [thumb]│
│▌ Description: Markdown, up to 4,096   │
│▌                                       │
│▌ Field 1      Field 2      Field 3     │  ← inline fields sit side by side
│▌ value        value        value       │
│▌ Non-inline field (full width)         │
│▌ [ large image ]                       │
│▌ Footer text (icon) • Timestamp        │
└────────────────────────────────────────┘
  ▌ = colour bar
```

**JavaScript**

```js
const embed = new EmbedBuilder()
  .setColor(0x5865f2)
  .setTitle('Server info')
  .setThumbnail(guild.iconURL())
  .addFields(
    { name: 'Members', value: `${guild.memberCount}`, inline: true },
    { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
  )
  .setFooter({ text: `ID: ${guild.id}` })
  .setTimestamp();
await interaction.reply({ embeds: [embed] });
```

**Python**

```python
embed = discord.Embed(title="Server info", colour=0x5865F2, timestamp=discord.utils.utcnow())
embed.set_thumbnail(url=guild.icon.url if guild.icon else None)
embed.add_field(name="Members", value=str(guild.member_count))
embed.set_footer(text=f"ID: {guild.id}")
await interaction.response.send_message(embed=embed)
```

**C#**

```csharp
var embed = new EmbedBuilder()
    .WithColor(new Color(0x5865F2))
    .WithTitle("Server info")
    .WithThumbnailUrl(guild.IconUrl)
    .AddField("Members", guild.MemberCount, inline: true)
    .WithFooter($"ID: {guild.Id}")
    .WithCurrentTimestamp()
    .Build();
await RespondAsync(embed: embed);
```

### Embed rules that bite

- Field values can't be empty. Use `'None'` or `'​'` (zero-width space).
- Field values max out at 1,024 characters. **Always truncate user content** (every example has a `truncate` helper).
- The **total** of all embed text in one message must stay under 6,000 characters.
- Mentions inside embeds render but **never ping**.
- Images must be URLs (or `attachment://file.png` for an uploaded file).

## Sending files

```js
// JS
const file = new AttachmentBuilder(Buffer.from('hello'), { name: 'hello.txt' });
await channel.send({ files: [file] });
```

```python
# Python
await channel.send(file=discord.File(io.BytesIO(b"hello"), filename="hello.txt"))
```

```csharp
// C#
using var stream = new MemoryStream(Encoding.UTF8.GetBytes("hello"));
await channel.SendFileAsync(new FileAttachment(stream, "hello.txt"));
```

The audit-log bulk delete handler uses exactly this to attach transcripts.

## Editing, deleting, replying

| Action | JS | Python | C# |
|---|---|---|---|
| Edit own message | `message.edit({...})` | `await message.edit(...)` | `message.ModifyAsync(m => ...)` |
| Delete | `message.delete()` | `await message.delete()` | `message.DeleteAsync()` |
| Reply to a message | `message.reply('…')` | `await message.reply('…')` | `channel.SendMessageAsync(..., messageReference: new MessageReference(id))` |
| React | `message.react('👍')` | `await message.add_reaction('👍')` | `message.AddReactionAsync(new Emoji("👍"))` |
| DM a user | `user.send('…')` | `await user.send('…')` | `user.SendMessageAsync("…")` |

DMs fail when a user has disabled DMs from server members. Always wrap them in try/catch, as the examples' `notify` helpers do.
