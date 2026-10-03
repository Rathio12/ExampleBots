# JavaScript · Basic Bot

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org)
![Tier](https://img.shields.io/badge/tier-basic-57F287)

A complete Discord bot in a single file, [`index.js`](index.js). Read it top to bottom: every section is commented.

## Commands

| Command | What it does | You learn |
|---|---|---|
| `/ping` | Shows gateway latency | Replying to an interaction |
| `/hello` | Greets you with a mention | Reading the invoking user |
| `/roll [sides]` | Rolls a die (2–1000 sides) | Integer options with min/max |
| `/avatar [user]` | Shows a user's avatar | User options and defaults |
| `/8ball <question>` | Magic 8-ball answer | Required string options |
| `/coinflip` | Heads or tails | — |

## Run

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
# put your token in .env (and optionally GUILD_ID)
npm start
```

Expected output:

```
✅ Logged in as MyBot#1234
📝 Registered 6 commands in guild 123456789012345678
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | yes | Bot token from the Developer Portal |
| `GUILD_ID` | no | Register commands to one server instantly instead of globally |

## How it works

1. `dotenv` loads `.env` into `process.env`, so the token is never hard-coded.
2. `SlashCommandBuilder` describes each command as JSON.
3. The `Client` connects to Discord's gateway with only the `Guilds` intent.
4. On `ClientReady`, the bot uploads its commands with `application.commands.set()`.
5. On `InteractionCreate`, a `switch` picks the command and replies.

## Next step

Once the `switch` gets long, continue with the [Enhanced bot](../02-enhanced), which gives every command its own file.

Full walkthrough: [JavaScript Guide](../../wiki/JavaScript/README.md)
