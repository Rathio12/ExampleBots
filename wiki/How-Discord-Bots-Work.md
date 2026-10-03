# How Discord Bots Work

You don't need this page to make a bot, but every confusing error makes sense once you know these ideas.

## Two connections: Gateway and REST

A bot talks to Discord in two ways.

```
                ┌──────────── Gateway (WebSocket) ────────────┐
                │  Discord → Bot: events, live, all the time    │
   Your bot  ◄──┤  "message created", "member joined",          │
                │  "someone used /ping"                         │
                └───────────────────────────────────────────────┘
                ┌──────────── REST API (HTTPS) ───────────────┐
   Your bot  ──►│  Bot → Discord: actions, one request each     │
                │  "send this message", "ban this user",        │
                │  "register these commands"                    │
                └───────────────────────────────────────────────┘
```

- **Gateway**: a long-lived WebSocket. Discord *pushes* events to you. Your library keeps it alive with heartbeats (that's what `/ping` measures) and reconnects automatically.
- **REST**: normal HTTPS requests to `https://discord.com/api/v10/...`. Every "do something" call is a REST request. They're rate limited (see below).

Libraries hide both behind friendly methods: `channel.send()` is a REST call, and `client.on('messageCreate')` is a gateway event.

## Events and intents

Discord doesn't send every event to every bot. When the bot connects, it declares **intents**, the categories of events it wants. Fewer intents means less traffic and less memory.

Three intents are **privileged** (Server Members, Message Content, Presence) because they expose personal data. You must switch them on in the Developer Portal, and once your bot is in 100+ servers, Discord must approve them during verification.

Full list and examples: [Events & Intents](Events-and-Intents.md).

## Interactions

Slash commands, buttons, select menus, modals, context menus and autocomplete are all **interactions**. They work differently from normal events:

1. A user does something (types `/ping`, clicks a button).
2. Discord sends your bot an **interaction** with a short-lived token.
3. Your bot must **respond within 3 seconds**, otherwise the user sees *"The application did not respond"*.
4. After responding, you can send **follow-ups** or edit the response for **15 minutes**.

Ways to respond:

| Response | When | JS | Python | C# |
|---|---|---|---|---|
| Reply | You have the answer now | `interaction.reply()` | `interaction.response.send_message()` | `RespondAsync()` |
| Defer | You need more than 3 s (HTTP call, DB query) | `deferReply()` → `editReply()` | `response.defer()` → `followup.send()` | `DeferAsync()` → `FollowupAsync()` |
| Update | A button/select should edit its own message | `interaction.update()` | `response.edit_message()` | `UpdateAsync()` |
| Modal | Show a pop-up form | `showModal()` | `response.send_modal()` | `RespondWithModalAsync()` |
| Ephemeral | Only the user should see it | `flags: MessageFlags.Ephemeral` | `ephemeral=True` | `ephemeral: true` |

You can respond **only once**. A second `reply()` throws "Interaction has already been acknowledged". Use follow-ups after that.

## Commands live on Discord's side

Slash commands are **registered** with Discord (uploaded as JSON), and Discord shows them in the `/` menu. That's why:

- Changing a command's options requires re-registering it.
- A command can still appear after you delete it from your code until you re-register.
- Registering is rate limited (200 creates per day per server), so don't spam it.

Different tiers show different strategies. The JS Enhanced/Expert bots use a separate `npm run deploy` script. The Python and C# bots sync on startup, which is fine because a bulk overwrite with unchanged commands is cheap.

## The cache

Libraries keep a **cache**: an in-memory copy of guilds, channels, roles, members and recent messages, built from gateway events. Reading from it is instant and costs no API calls.

But the cache only knows what it has seen since the bot started:

- A message sent before the bot started isn't cached. If it's deleted, the bot only learns its ID (a *partial* or *uncached* message). That's why the audit log says "Not cached".
- Without the Server Members intent, most members are never cached.

## Rate limits

Discord limits how fast you can call the REST API: per route (for example "send message in channel X") and globally (50 requests/second). Libraries queue requests and wait automatically, so you'll rarely hit an error. You'll notice it when:

- Renaming a channel: **2 renames per 10 minutes** per channel. That's why the status updater runs at most every 5 minutes.
- Mass actions (DMing every member, deleting many channels) slow down a lot.

If you get banned from the API (HTTP 429 with a long `retry_after`, or a Cloudflare ban), something is looping. Fix the loop. Never "retry faster".

## Snowflakes (IDs)

Every user, server, channel, message and role has a **snowflake ID**: a 64-bit number such as `175928847299117063`. It encodes the creation time, which is how "Account created 3 years ago" works without an API call.

> JavaScript stores them as **strings** (a JS number can't hold 64 bits exactly). Python uses `int`, C# uses `ulong`.

## Sharding

One gateway connection can handle up to 2,500 servers. Beyond that, you must split the bot into **shards**, multiple connections each handling a slice of servers. You won't need this until your bot is popular:

- discord.js: `ShardingManager` or `@discordjs/ws` sharding
- discord.py: replace `commands.Bot` with `commands.AutoShardedBot`
- Discord.Net: use `DiscordShardedClient` instead of `DiscordSocketClient`

## What a library does for you

| Task | Without a library | With one |
|---|---|---|
| Connect, identify, heartbeat, resume | ~500 lines of WebSocket code | `client.login(token)` |
| Respect rate limits | Track buckets and headers | Automatic |
| Parse events into objects | Raw JSON | `message.author.username` |
| Build commands, embeds, components | Hand-written JSON | Builders and decorators |
| Cache | DIY | Built in |

That's why every example uses one of the three big libraries. See [Choosing a Language](Choosing-a-Language.md).
