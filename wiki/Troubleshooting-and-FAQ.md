# Troubleshooting & FAQ

Find your symptom, then apply the fix.

## Login and startup

| Symptom | Cause | Fix |
|---|---|---|
| `DISCORD_TOKEN is missing` | No `.env`, or run from another folder | Copy `.env.example` to `.env` **in the bot's folder** and start the bot from there |
| `An invalid token was provided` / `401 Unauthorized` / `LoginFailure` | Wrong or reset token, extra spaces or quotes | Reset the token in the portal, paste it again without quotes or spaces |
| `Used disallowed intents` / `PrivilegedIntentsRequired` / close code **4014** | Code requests a privileged intent that's off in the portal | Developer Portal → Bot → enable Server Members / Message Content, or remove the intent from code |
| Close code **4004** | Authentication failed | Token wrong. Reset it. |
| `ECONNRESET`, `getaddrinfo ENOTFOUND discord.com` | Network/DNS/firewall | Check internet, proxy, firewall. Some school or work networks block Discord. |
| Python: `ModuleNotFoundError: discord` | Dependencies not installed in this environment | Activate the venv, then `pip install -r requirements.txt` |
| Python: `audioop` missing on 3.13+ | Old discord.py | `pip install -U discord.py` (2.5+ supports 3.13+) |
| Node: `SyntaxError: Cannot use import statement` | Old Node, or `"type": "module"` missing | Use Node 20+. The examples' `package.json` sets `"type": "module"`. |
| `better-sqlite3` build errors on install | No prebuilt binary for your Node version | Use an LTS Node version. On Linux, install `python3 make g++`. |
| C#: `DISCORD_TOKEN is required` with a `.env` present | `dotnet run` executed from another folder | Run from the folder containing `.env` (expert: `dotnet run --project src/ExpertBot` from `03-expert`) |

## Commands

| Symptom | Cause | Fix |
|---|---|---|
| Commands don't appear | Not registered, or global registration still propagating | Set `GUILD_ID` for instant guild commands. JS Enhanced/Expert: run `npm run deploy`. |
| Commands show **twice** | Registered both globally and to the guild | Clear one set: register an empty list globally (or for the guild) |
| Old/deleted commands still show | Discord keeps registered commands | Re-register. All examples overwrite the full list. Restart your Discord client (Ctrl+R). |
| "Missing Access" when registering | Bot invited without `applications.commands` scope | Re-invite with `scope=bot+applications.commands` |
| "**The application did not respond**" | No response within 3 s, or the handler crashed | Check logs. Defer before slow work. Make sure every code path responds. |
| "Interaction has already been acknowledged" | Responded twice | After the first `reply`/`defer`, use `followUp`/`editReply` |
| "Unknown interaction" (10062) | Responded after 3 s, or the bot restarted mid-interaction | Defer earlier. Avoid slow work before the first response. |
| A moderation command is invisible | Default member permissions hide it | Expected for members without the permission. Admins can adjust in Server Settings → Integrations. |
| Options are missing | Definition changed, but not re-registered | Re-register commands |

## Components

| Symptom | Cause | Fix |
|---|---|---|
| "This interaction failed" on a button | No handler for that custom ID, the handler threw, or it was too slow | Check the custom ID prefix matches your router. Check logs. |
| Buttons stop working after restart | In-memory state or non-persistent views | Encode state in the custom ID or the database. Python: persistent views (`bot.add_view`). |
| Modal won't open | Tried to defer first, or shown in response to a modal | `showModal` must be the first response |
| `Invalid Form Body` on components | Too many buttons in a row, a label too long, a duplicate custom ID | See the [Limits Cheat Sheet](Limits-Cheat-Sheet.md) |

## Permissions and moderation

| Symptom | Cause | Fix |
|---|---|---|
| `Missing Permissions` (50013) | Bot lacks the permission in that channel/server | Grant it in role settings or the channel's permission overwrites |
| Can't ban/kick/timeout a member | Their highest role is at or above the bot's | Move the bot's role higher in Server Settings → Roles |
| Can't time out an admin | Administrators can't be timed out | Expected |
| Purge deletes fewer messages than asked | Messages older than 14 days can't be bulk-deleted | Expected. The bot reports how many were skipped. |
| Can't DM a user | User disabled DMs from server members | Expected. The examples catch it and continue. |

## Audit log and events

| Symptom | Cause | Fix |
|---|---|---|
| No audit entries at all | Channel not configured, or intents off | `/settings auditlog channel:#…`, and enable both privileged intents |
| Deleted messages show "Not cached" | Message predates the bot's start | Expected. Persist messages to the DB if you need older content. |
| "By: Unknown" | Missing View Audit Log permission | Grant **View Audit Log** |
| Joins/leaves not logged | Server Members intent off | Enable it in the portal |
| Message content is empty | Message Content intent off | Enable it in the portal (and in code) |

## Game-server status (Enhanced)

| Symptom | Cause | Fix |
|---|---|---|
| `/players` says offline but the server is up | The query API caches for a few minutes, or the server has query disabled | Wait a few minutes. Check `enable-status=true` in `server.properties`. |
| Channel name doesn't update | Rename rate limit (2 per 10 min) or missing Manage Channels | Keep the interval ≥ 5 minutes. Grant Manage Channels on that channel. |

## FAQ

**Do I need to keep my PC on?** Yes, or host it somewhere. See [Deployment & Hosting](Deployment-and-Hosting.md).

**Can I use prefix commands like `!help`?** Yes, with the Message Content intent and a message listener (`commands.Bot` in discord.py supports prefixes natively). Discord recommends slash commands: they need no privileged intent and have built-in validation and UI.

**How many servers can my bot be in?** Unlimited. Over 100 servers you need verification (and approval for privileged intents). Over 2,500 you need sharding.

**Is it free?** The Discord API is free. You only pay for hosting (or not, if you self-host).

**Can one bot run in multiple languages?** One bot = one token = one running process. Don't run two programs with the same token, or both will answer every command.

**Can my bot read DMs between users?** No. Bots only see channels they have access to, and DMs sent to the bot itself.

**Where do I get help?** The official servers for [discord.js](https://discord.gg/djs), [discord.py](https://discord.gg/dpy) and [Discord.Net](https://discord.gg/dnet), plus the [Discord Developers](https://discord.gg/discord-developers) server. Include your code, the full error, and your library version, and **remove your token**.
