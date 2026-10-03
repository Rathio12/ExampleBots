# JavaScript · Enhanced Bot

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org)
![Tier](https://img.shields.io/badge/tier-enhanced-FEE75C)

A modular community bot. Commands, component handlers and events each live in their own file and are loaded automatically.

## Features

| Feature | Files | You learn |
|---|---|---|
| `/ping` | [commands/ping.js](src/commands/ping.js) | Deferring, embed fields |
| `/help` | [commands/help.js](src/commands/help.js) | Generating help from the registry |
| `/serverinfo` | [commands/serverinfo.js](src/commands/serverinfo.js) | Guild data, guild-only commands |
| `/userinfo [user]` | [commands/userinfo.js](src/commands/userinfo.js) | Users vs. members, roles, timestamps |
| `/poll <question>` | [commands/poll.js](src/commands/poll.js), [components/poll.js](src/components/poll.js) | Buttons, state in custom IDs, editing messages |
| `/trivia` | [commands/trivia.js](src/commands/trivia.js), [components/trivia.js](src/components/trivia.js) | Select menus, ephemeral replies |
| `/feedback` | [commands/feedback.js](src/commands/feedback.js), [components/feedback.js](src/components/feedback.js) | Modals (pop-up forms) |
| `/players [address]` | [commands/players.js](src/commands/players.js) | Live Minecraft player counts via HTTP |
| Status updater | [services/statusUpdater.js](src/services/statusUpdater.js) | Background jobs, presence, channel renames |
| Welcome messages | [events/guildMemberAdd.js](src/events/guildMemberAdd.js) | Events and privileged intents |
| Cooldowns | [utils/cooldowns.js](src/utils/cooldowns.js) | Per-user rate limiting |
| Error handling | [events/interactionCreate.js](src/events/interactionCreate.js) | One central router with try/catch |

## Run

```bash
npm install
cp .env.example .env     # fill in DISCORD_TOKEN and any optional settings
npm run deploy           # register slash commands (only when they change)
npm start                # or: npm run dev (restarts on file changes)
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | yes | Bot token |
| `GUILD_ID` | no | Deploy commands to one server instantly |
| `WELCOME_CHANNEL_ID` | no | Enables welcome messages. **Turn on the Server Members intent first.** |
| `FEEDBACK_CHANNEL_ID` | no | Where `/feedback` submissions are posted |
| `GAME_SERVER_ADDRESS` | no | Minecraft server to track, e.g. `play.example.net` |
| `STATUS_CHANNEL_ID` | no | Channel renamed to `🟢 Players: 12/100` |
| `STATUS_INTERVAL_MINUTES` | no | Update interval, minimum 5 (channel renames are rate limited) |
| `LOG_LEVEL` | no | `debug`, `info`, `warn`, `error` |

## Project structure

```
src/
├── index.js              wires everything together
├── deploy-commands.js    uploads slash commands
├── config.js             validated environment variables
├── logger.js             levelled console logger
├── loaders.js            imports every file in a folder
├── commands/             one file per slash command
├── components/           buttons, selects, modals (custom ID "prefix:args")
├── events/               ready, interactionCreate, guildMemberAdd
├── services/             Minecraft API + status updater
├── state/                in-memory poll storage
├── data/                 trivia questions
└── utils/                cooldowns, embed helpers
```

## Adding a command

Create `src/commands/hug.js`:

```js
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Hug someone')
    .addUserOption((o) => o.setName('user').setDescription('Who?').setRequired(true)),
  cooldown: 5,
  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    await interaction.reply(`🤗 ${interaction.user} hugs ${target}!`);
  },
};
```

Then run `npm run deploy` and restart. No other file needs to change.

## Next step

The [Expert bot](../03-expert) adds a database, moderation, an audit-log system, leveling, reminders, autocomplete, context menus, tests and Docker.

Full walkthrough: [JavaScript Guide](../../wiki/JavaScript/README.md)
