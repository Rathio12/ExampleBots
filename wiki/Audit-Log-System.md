# Audit Log System

The expert bots include a complete replacement for Discord's audit log. This page explains why, how it works, and how to extend it.

## Why replace the built-in audit log?

| Discord's audit log | The bot's audit log |
|---|---|
| Kept for **45 days** | Kept forever (it's just messages in a channel) |
| **Never shows message content** | Shows deleted and edited message content |
| Doesn't record joins, leaves, voice, or self-deleted messages | Records all of them |
| Only visible to people with View Audit Log | Visible to whoever can see the log channel |
| Dense UI | One readable embed per event, searchable with Discord search |

## Setup

1. Enable the **Server Members** and **Message Content** privileged intents (Developer Portal → Bot).
2. Give the bot **View Audit Log** (to find who did something), plus **Send Messages**, **Embed Links** and **Attach Files** in the log channel.
3. Run `/settings auditlog channel:#audit-log`.

## What gets logged

| Event | Source event | Extra lookup |
|---|---|---|
| Message deleted | message delete | — (Discord doesn't reliably say who deleted it) |
| Message edited | message update | — |
| Bulk delete | bulk delete | Transcript `.txt` of cached messages |
| Member joined | member add | New-account warning (< 7 days) |
| Member left / **kicked** | member remove | Audit log `MemberKick`. A kick looks like a leave otherwise. |
| Nickname / roles / timeout | member update | Audit log `MemberUpdate` or `MemberRoleUpdate` |
| Ban / unban | ban add / remove | Audit log `MemberBanAdd` / `MemberBanRemove` |
| Channel create / delete / update | channel events | Audit log `Channel*` |
| Role create / delete / update | role events | Audit log `Role*`, including a **permission diff** |
| Voice join / leave / move | voice state update | — |

## How it works

```
 gateway event ──► handler (one per event) ──► build embed ──► audit.send(guild, embed)
                        │                                          │
                        └─► audit.findExecutor(guild, type, id)    └─► look up log channel (cached)
                              (who did it? from Discord's audit log)
```

### 1. Handlers

Each event has a small handler: one file per event in JS (`src/events/audit/`), one listener method each in Python (`cogs/audit.py`), and one method each in C# (`AuditEventHandlers.cs`). Every handler:

1. Returns early if audit logging is off for that guild (a cheap cached lookup).
2. Ignores bots and the log channel itself (otherwise cleaning the log channel would log itself).
3. Compares before/after and returns if nothing interesting changed. Channel *position* changes fire constantly when channels are reordered, for example.
4. Builds an embed and sends it with `allowedMentions: none`, so log entries never ping anyone.

### 2. Finding the executor

Gateway events say *what* happened, not *who* did it. For that, the bot reads Discord's audit log right after the event:

```js
async function findExecutor(guild, type, targetId) {
  const logs = await guild.fetchAuditLogs({ type, limit: 5 });
  const entry = logs.entries.find(
    (e) => e.targetId === targetId && Date.now() - e.createdTimestamp < 15_000,
  );
  return entry ? { executor: entry.executor, reason: entry.reason } : null;
}
```

The 15-second window prevents matching an older, unrelated entry (for example yesterday's kick of the same user). If the bot lacks View Audit Log, the lookup quietly returns nothing and the entry shows "By: Unknown".

### 3. The message cache

To show the content of a deleted message, the bot must have seen it. Libraries cache recent messages:

| Library | Setting in the expert bot |
|---|---|
| discord.js | default cache (200 per channel) + `Partials.Message` so uncached deletes still fire |
| discord.py | `max_messages=5000` + `on_raw_message_delete` for uncached deletes |
| Discord.Net | `MessageCacheSize = 200` (per channel), `Cacheable<IMessage>` |

Messages sent before the bot started (or that fell out of the cache) are logged as *"Not cached"*.

**Want content for every message, even after restarts?** Store messages in the database on `messageCreate` (with a retention period, for example 7 days) and look them up on delete. This is a privacy-heavy feature. Tell your members, and delete old rows on a schedule.

### 4. Bulk deletes

`/purge` and "delete message history" on ban fire one bulk event. The handler sorts cached messages by time and attaches them as a `.txt` file:

```
[2026-10-03T14:22:01.000Z] alice (1234…): hello everyone
[2026-10-03T14:22:09.000Z] spammer (5678…): BUY NOW [attachments: https://cdn…]
```

## Extending it

Add a new event in three steps. Example: logging when a thread is created.

**JavaScript:** create `src/events/audit/threadCreate.js`:

```js
import { Events } from 'discord.js';
import { Colors, embed, userLabel } from '../../lib/format.js';

export default {
  name: Events.ThreadCreate,
  async execute({ audit }, thread, newlyCreated) {
    if (!newlyCreated || !audit.isEnabled(thread.guildId)) return;
    const owner = await thread.fetchOwner().catch(() => null);
    await audit.send(thread.guild, embed(Colors.success)
      .setTitle('🧵 Thread created')
      .addFields(
        { name: 'Thread', value: `${thread}`, inline: true },
        { name: 'Parent', value: `<#${thread.parentId}>`, inline: true },
        { name: 'Owner', value: owner?.user ? userLabel(owner.user) : 'Unknown', inline: true },
      ));
  },
};
```

**Python:** add a listener to `Audit`:

```python
@commands.Cog.listener()
async def on_thread_create(self, thread: discord.Thread) -> None:
    if not await self._enabled(thread.guild):
        return
    entry = embed(SUCCESS, title="🧵 Thread created")
    entry.add_field(name="Thread", value=thread.mention)
    entry.add_field(name="Parent", value=f"<#{thread.parent_id}>")
    entry.add_field(name="Owner", value=f"<@{thread.owner_id}>")
    await self.bot.audit.send(thread.guild, entry)
```

**C#:** subscribe in `Attach()` and add a method:

```csharp
client.ThreadCreated += thread => Fire(() => OnThreadCreatedAsync(thread));

private async Task OnThreadCreatedAsync(SocketThreadChannel thread)
{
    if (!await audit.IsEnabledAsync(thread.Guild.Id)) return;
    var embed = Display.Embed(Display.Success).WithTitle("🧵 Thread created")
        .AddField("Thread", $"<#{thread.Id}>", inline: true)
        .AddField("Parent", $"<#{thread.ParentChannel.Id}>", inline: true)
        .Build();
    await audit.SendAsync(thread.Guild, embed);
}
```

More ideas: invites created/used (invite tracking, needs the GuildInvites intent), emoji and sticker changes, server name/icon changes, AutoMod actions, scheduled events, and webhook changes.

## Privacy and responsibility

Logging deleted message content is standard in moderation bots, but:

- Make the log channel visible only to moderators.
- Say in your server rules that moderation logs exist.
- If you store messages in a database, set a retention period and honour deletion requests.
- Discord's Developer Policy forbids selling or misusing user data. Logs are for moderation only.
