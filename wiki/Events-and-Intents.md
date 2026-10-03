# Events & Intents

Events tell your bot what's happening: a message was sent, someone joined, a role changed. Intents decide which events you receive.

## Intents

| Intent | Privileged | Gives you |
|---|---|---|
| `Guilds` | | Guild/channel/role/thread create-update-delete. **Almost always needed.** |
| `GuildMembers` | **yes** | Member join/leave/update, full member lists |
| `GuildModeration` (a.k.a. GuildBans) | | Ban/unban, audit-log entry events |
| `GuildExpressions` | | Emoji, sticker, soundboard updates |
| `GuildIntegrations`, `GuildWebhooks`, `GuildInvites` | | Integration, webhook and invite events |
| `GuildVoiceStates` | | Voice join/leave/move/mute. **Required for voice bots.** |
| `GuildPresences` | **yes** | Online status, activities ("Playing …") |
| `GuildMessages` | | Message create/update/delete in servers |
| `GuildMessageReactions` | | Reactions in servers |
| `GuildMessageTyping` | | Typing indicators |
| `DirectMessages` (+ reactions, typing) | | DM events |
| `MessageContent` | **yes** | The `content`, `embeds`, `attachments` of messages |
| `GuildScheduledEvents` | | Scheduled event changes |
| `AutoModerationConfiguration` / `Execution` | | AutoMod rules and actions |
| `GuildMessagePolls`, `DirectMessagePolls` | | Poll votes |

### About Message Content

Without `MessageContent`, message events still arrive, but `content` is empty **except** for messages that mention the bot, DMs to the bot, and the bot's own messages. You don't need it for slash commands. You need it to read arbitrary messages (edit/delete logs, word filters, prefix commands).

### Enabling intents in code

```js
// JS
new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
```

```python
# Python
intents = discord.Intents.default()   # everything non-privileged
intents.members = True                # privileged
intents.message_content = True        # privileged
```

```csharp
// C#
new DiscordSocketConfig { GatewayIntents = GatewayIntents.Guilds | GatewayIntents.GuildMembers };
```

Privileged intents must **also** be switched on in the Developer Portal (Bot tab), or login fails.

## Listening to events

```js
// JS (Enhanced/Expert: one file per event in src/events/)
export default {
  name: Events.GuildMemberAdd,
  async execute(member) { /* ... */ },
};
```

```python
# Python (inside a cog)
@commands.Cog.listener()
async def on_member_join(self, member: discord.Member):
    ...
```

```csharp
// C#
client.UserJoined += async member => { /* ... */ };
```

## Common events

| What happened | discord.js | discord.py | Discord.Net | Intent |
|---|---|---|---|---|
| Bot is ready | `ClientReady` | `on_ready` | `Ready` | — |
| Interaction | `InteractionCreate` | handled by `CommandTree` | `InteractionCreated` | — |
| Message sent | `MessageCreate` | `on_message` | `MessageReceived` | GuildMessages |
| Message edited | `MessageUpdate` | `on_message_edit` / `on_raw_message_edit` | `MessageUpdated` | GuildMessages |
| Message deleted | `MessageDelete` | `on_message_delete` / `on_raw_message_delete` | `MessageDeleted` | GuildMessages |
| Bulk delete | `MessageBulkDelete` | `on_raw_bulk_message_delete` | `MessagesBulkDeleted` | GuildMessages |
| Member joined | `GuildMemberAdd` | `on_member_join` | `UserJoined` | GuildMembers |
| Member left | `GuildMemberRemove` | `on_member_remove` | `UserLeft` | GuildMembers |
| Member updated | `GuildMemberUpdate` | `on_member_update` | `GuildMemberUpdated` | GuildMembers |
| Ban / unban | `GuildBanAdd` / `Remove` | `on_member_ban` / `unban` | `UserBanned` / `UserUnbanned` | GuildModeration |
| Channel changes | `ChannelCreate/Update/Delete` | `on_guild_channel_*` | `ChannelCreated/Updated/Destroyed` | Guilds |
| Role changes | `GuildRoleCreate/Update/Delete` | `on_guild_role_*` | `RoleCreated/Updated/Deleted` | Guilds |
| Voice change | `VoiceStateUpdate` | `on_voice_state_update` | `UserVoiceStateUpdated` | GuildVoiceStates |
| Reaction added | `MessageReactionAdd` | `on_reaction_add` / `on_raw_reaction_add` | `ReactionAdded` | GuildMessageReactions |
| Bot added to a server | `GuildCreate` | `on_guild_join` | `JoinedGuild` | Guilds |

## Cached vs raw events

Libraries only give you the "before" state of something if it was in the cache:

- **discord.js** emits partial objects when you enable `Partials` (the expert bot enables `Message`, `Channel`, `GuildMember`). Check `.partial` and `fetch()` if you need more.
- **discord.py** has normal events (cached only) and `on_raw_*` events (always fire, with `payload.cached_message` if available). The expert bot uses `on_raw_message_delete` so uncached deletes are still logged.
- **Discord.Net** passes `Cacheable<T, TId>`. Check `.HasValue` or call `GetOrDownloadAsync()`.

Increase the message cache for better edit/delete logs: discord.js caches 200 per channel by default, discord.py's `max_messages=5000` is global, and Discord.Net uses `MessageCacheSize` per channel.

## Don't block the event loop

Events are processed one after another. A slow handler (a long HTTP call, CPU-heavy work) delays everything else, including heartbeats, and that can disconnect the bot.

- **JS/Python:** use `await` for I/O. Never use synchronous sleeps (`time.sleep`) or blocking HTTP clients (`requests` in Python; use `aiohttp`).
- **C#:** Discord.Net warns *"A handler is blocking the gateway task"*. Offload with `Task.Run`, as `AuditEventHandlers.Fire()` does.

## Ignore bots (usually)

Almost every message handler should start with:

```js
if (message.author.bot) return;
```

Otherwise two bots can reply to each other forever, or your bot can trigger itself.
