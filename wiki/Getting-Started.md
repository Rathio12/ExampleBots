# Getting Started

This page takes you from nothing to a running bot in about ten minutes. You only do steps 1–4 once per bot.

## 1. Create an application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and log in.
2. Click **New Application**, give it a name, accept the terms.
3. On **General Information**, note the **Application ID**. You'll need it for the invite link.

An *application* is the container. A *bot user* is one feature of it (applications can also have OAuth2, activities, and so on).

## 2. Get the bot token

1. Open the **Bot** tab.
2. Click **Reset Token** and copy it. Discord shows it **once**.
3. Put it in a `.env` file next to the bot (each example has a `.env.example` to copy):

```env
DISCORD_TOKEN=paste-your-token-here
```

> **The token is a password.** Anyone with it controls your bot. Never commit it, paste it in chat, or put it in screenshots. If it leaks, reset it immediately. See [Security Best Practices](Security-Best-Practices.md).

While you're on the Bot tab:

- **Public Bot**: turn off if only you should be able to invite it.
- **Privileged Gateway Intents**: three switches you'll need later:

| Intent | Turn on for | Used by |
|---|---|---|
| Presence Intent | Seeing members' online status and activities | none of the examples |
| Server Members Intent | Join/leave events, member lists, role change events | Enhanced (welcome), Expert |
| Message Content Intent | Reading the text of messages | Expert (edit/delete logs) |

If your code requests an intent that is switched off here, Discord rejects the login (`Used disallowed intents` / `PrivilegedIntentsRequired` / close code `4014`). Details: [Events & Intents](Events-and-Intents.md).

## 3. Get a test server and its ID

Create a private server for testing (the **+** button in Discord's server list).

To copy IDs you need **Developer Mode**: User Settings → Advanced → **Developer Mode**. Now right-click the server icon → **Copy Server ID**, and put it in `.env`:

```env
GUILD_ID=123456789012345678
```

With `GUILD_ID` set, the examples register commands **to that server only**, and they appear instantly. Without it, commands are registered **globally** (every server), which also works but can take up to an hour to show up on clients. See [Slash Commands → Guild vs global](Slash-Commands-and-Interactions.md#guild-vs-global-commands).

## 4. Invite the bot

Bots join servers through an OAuth2 URL:

```
https://discord.com/oauth2/authorize?client_id=APPLICATION_ID&scope=bot+applications.commands&permissions=PERMISSIONS
```

- `bot` adds the bot user to the server.
- `applications.commands` lets the app create slash commands there.
- `permissions` is a number: the sum of the permission bits the bot asks for.

Ready-made permission values for the examples:

| Bot | Permissions value | Includes |
|---|---|---|
| Basic | `0` | Slash command replies need no permissions |
| Enhanced | `19472` | View Channel, Send Messages, Embed Links, Manage Channels (status channel rename) |
| Expert | `1099511753862` | View Audit Log, Kick, Ban, Moderate Members, View Channel, Send Messages, Manage Messages, Embed Links, Attach Files, Read Message History |

You can also build the URL in the portal under **OAuth2 → URL Generator**. Tick `bot` and `applications.commands`, then the permissions.

> Avoid `Administrator` (`8`). It's convenient, but a compromised token then controls the whole server. Ask for exactly what you need.

## 5. Install a runtime and run a bot

| Language | Install | Check |
|---|---|---|
| JavaScript | [Node.js](https://nodejs.org) 20 or newer (LTS recommended) | `node --version` |
| Python | [Python](https://www.python.org/downloads/) 3.10 or newer | `python --version` |
| C# | [.NET SDK](https://dotnet.microsoft.com/download) 10 | `dotnet --version` |

Then run the Basic bot for your language:

```bash
# JavaScript
cd javascript/01-basic && npm install && cp .env.example .env && npm start

# Python
cd python/01-basic && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env && python bot.py

# C#
cd csharp/01-basic && cp .env.example .env && dotnet run
```

(On Windows use `copy` instead of `cp`, and `.venv\Scripts\activate` for Python.)

Edit `.env`, paste your token and server ID, and start it. In your test server, type `/` and you'll see `/ping`, `/roll` and the rest.

## 6. What next?

- Understand what just happened: [How Discord Bots Work](How-Discord-Bots-Work.md)
- Follow your language guide: [JavaScript](JavaScript/README.md) · [Python](Python/README.md) · [C#](CSharp/README.md)
- Something didn't work? [Troubleshooting & FAQ](Troubleshooting-and-FAQ.md)
