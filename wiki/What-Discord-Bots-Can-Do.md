# What Discord Bots Can Do

A catalogue of what the Discord API offers bots today, with pointers to examples. If something is marked **(in examples)**, there's working code in this repo.

## Commands and interactions

| Feature | Description |
|---|---|
| Slash commands **(in examples)** | `/command` with typed options: string, integer, number, boolean, user, channel, role, mentionable, attachment |
| Subcommands & groups **(in examples)** | `/tag show`, `/tag create`, up to two levels deep |
| Choices **(in examples)** | Fixed dropdown values for an option (`/ban delete_messages`) |
| Autocomplete **(in examples)** | Dynamic suggestions while typing (`/tag show`) |
| User context menus **(in examples)** | Right-click a user → Apps → "Show Rank" |
| Message context menus **(in examples)** | Right-click a message → Apps → "Bookmark" |
| Localization | Command names and descriptions in the user's language |
| Command permissions **(in examples)** | Hide commands from members without a permission; admins can fine-tune per role/channel |
| User-installable apps | Users install your app to their account and use commands anywhere, even in servers the bot isn't in |

## Messages

| Feature | Description |
|---|---|
| Text, Markdown, mentions **(in examples)** | Up to 2,000 characters, with headings, lists, code blocks, spoilers, masked links |
| Embeds **(in examples)** | Rich cards with title, fields, colour, images, footer and timestamp. Up to 10 per message |
| Files **(in examples)** | Upload attachments (the audit log attaches `.txt` transcripts) |
| Components **(in examples)** | Buttons, select menus (string, user, role, channel, mentionable) |
| Components V2 | Layout components (containers, sections, text displays, media galleries, separators) that replace embeds with flexible layouts |
| Polls | Native Discord polls with answers, emojis and a duration |
| Reactions | Add and read emoji reactions (old-style reaction roles) |
| Stickers, custom emojis | Including **application emojis** your bot owns and can use everywhere |
| Ephemeral messages **(in examples)** | Visible only to the user who ran the command |
| Webhooks | Post with a custom name and avatar, often used for logging and bridges |
| Threads & forums | Create threads, forum posts and tags, archive/lock threads |
| Pins, crossposting | Pin messages and publish announcements to following servers |

## Server management

| Feature | Description |
|---|---|
| Members **(in examples)** | Kick, ban, unban, timeout, nicknames, add/remove roles |
| Roles | Create, edit, delete, reorder, set permissions and colours |
| Channels **(in examples)** | Create, rename (status channels), set permissions and slowmode, delete |
| Bulk delete **(in examples)** | Delete 2–100 messages younger than 14 days at once |
| Audit log **(in examples)** | Read Discord's audit log to find who did what |
| AutoMod | Create keyword, spam and mention-spam rules that Discord enforces |
| Scheduled events | Create and manage server events |
| Invites | Create, list and track invites (invite tracking bots) |
| Onboarding & welcome screen | Read and edit server onboarding |
| Emojis, stickers, soundboard | Manage server assets |

## Events you can react to

Messages (create/edit/delete/reactions), members (join/leave/update), bans, roles, channels, threads, voice states, invites, scheduled events, AutoMod actions, audit-log entries, typing, presences (privileged), polls and more. See [Events & Intents](Events-and-Intents.md).

## Voice

Bots can join voice and stage channels, play and receive audio. Libraries: `@discordjs/voice`, discord.py's voice support (needs PyNaCl and FFmpeg), `Discord.Net` audio. Music bots are possible, but streaming from YouTube violates YouTube's terms. Use licensed sources or your own files.

## Beyond the server

| Feature | Description |
|---|---|
| DMs **(in examples)** | Message users who share a server with the bot (if their privacy settings allow) |
| Presence **(in examples)** | "Watching 12/100 players", "Listening to /help" |
| Monetization | Sell subscriptions or one-time purchases (SKUs, entitlements, premium buttons) |
| Activities | Embedded web apps/games that run inside voice channels |
| Linked roles | Roles granted from external account data (e.g. game rank) |
| OAuth2 | "Log in with Discord" on your website, with access to user's guilds and connections |

## What bots cannot do

- **Read DMs between users**, or messages in channels they can't see.
- **Join servers by themselves.** An admin must invite them.
- **Act as a user** ("self-bots" are against the Terms of Service and get accounts banned).
- **Exceed role hierarchy.** A bot can't moderate members whose highest role is above the bot's.
- **Bulk-delete messages older than 14 days** (they must be deleted one by one, slowly).
- **Bypass rate limits** or create accounts, servers en masse, or spam users.
- **Use privileged intents at scale without approval.** Required once in 100+ servers.

Always follow Discord's [Developer Terms of Service](https://discord.com/developers/docs/policies-and-agreements/developer-terms-of-service) and [Developer Policy](https://discord.com/developers/docs/policies-and-agreements/developer-policy).
