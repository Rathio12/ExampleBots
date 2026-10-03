# Slash Commands

<sub>[JavaScript portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key classes** | `SlashCommandBuilder`, `ChatInputCommandInteraction`, `REST`, `Routes` |
| **Intents needed** | `Guilds` |
| **Used in** | [01-basic/index.js](../../javascript/01-basic/index.js) · [02-enhanced/src/commands/](../../javascript/02-enhanced/src/commands) |

A slash command has three parts: a **definition** (built with `SlashCommandBuilder`), a **registration** (uploading definitions to Discord), and a **handler** (code that runs on `InteractionCreate`).

## 1. Define

```js
import { SlashCommandBuilder } from 'discord.js';

const ping = new SlashCommandBuilder()
  .setName('ping')                          // 1-32 chars, lowercase, no spaces
  .setDescription('Replies with Pong!');    // 1-100 chars
```

Common builder methods:

| Method | Purpose |
|---|---|
| `setName` / `setDescription` | Required |
| `setNameLocalizations({ de: 'ping' })` | Localised names |
| `setDescriptionLocalizations({...})` | Localised descriptions |
| `setDefaultMemberPermissions(PermissionFlagsBits.X)` | Hide from members without the permission ([Permissions](26-Permissions.md)) |
| `setContexts(InteractionContextType.Guild, ...)` | Where it can be used: `Guild`, `BotDM`, `PrivateChannel` |
| `setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ...)` | Server-installed and/or user-installed |
| `setNSFW(true)` | Only usable in age-restricted channels |
| `add…Option()` | Options ([Command Options](05-Command-Options.md)) |
| `addSubcommand()` / `addSubcommandGroup()` | [Subcommands](06-Subcommands-and-Groups.md) |
| `toJSON()` | The raw JSON sent to Discord |

## 2. Register

Commands are stored by Discord. You upload them once, and again whenever a definition changes.

### Option A: a deploy script (recommended)

```js
// deploy-commands.js: run with `node deploy-commands.js`
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from './commands.js';

const rest = new REST().setToken(process.env.DISCORD_TOKEN);
const app = await rest.get(Routes.currentApplication());   // no need to hard-code the app ID

const body = commands.map((c) => c.data.toJSON());
const route = process.env.GUILD_ID
  ? Routes.applicationGuildCommands(app.id, process.env.GUILD_ID)   // instant, one server
  : Routes.applicationCommands(app.id);                              // global

const result = await rest.put(route, { body });   // PUT replaces the whole list
console.log(`Deployed ${result.length} commands`);
```

### Option B: on startup (fine for small bots)

```js
client.once(Events.ClientReady, async (c) => {
  await c.application.commands.set(commands.map((cmd) => cmd.data.toJSON()), process.env.GUILD_ID);
});
```

| | Guild commands | Global commands |
|---|---|---|
| Route | `applicationGuildCommands(appId, guildId)` | `applicationCommands(appId)` |
| Appear | Instantly | Usually quickly, can take up to ~1 hour |
| Use for | Development, private bots | Public bots |

**Deleting commands:** PUT an empty array (`body: []`) to the same route.

## 3. Handle

```js
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;   // ignore buttons, autocomplete, etc.

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});
```

Useful properties of `ChatInputCommandInteraction`:

| Property | Meaning |
|---|---|
| `commandName` | e.g. `'ping'` |
| `options` | Option values ([Command Options](05-Command-Options.md)) |
| `user` | Who ran it (always set) |
| `member` | Their `GuildMember` (in servers) |
| `guild` / `guildId` | The server (null in DMs) |
| `channel` / `channelId` | Where it was run |
| `memberPermissions` | The member's permissions in this channel |
| `appPermissions` | The bot's permissions in this channel |
| `locale` | The user's language, e.g. `'en-US'` |
| `createdTimestamp` | When the user ran it |

## Scaling up: one file per command

The Enhanced and Expert bots use this pattern:

```js
// src/commands/ping.js
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
  cooldown: 5,
  async execute(interaction) {
    await interaction.reply('Pong!');
  },
};
```

```js
// src/index.js: load every file, then route by name
client.commands = new Collection();
for (const command of await loadModules(join(here, 'commands'))) {
  client.commands.set(command.data.name, command);
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const payload = { content: 'Something went wrong.', flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
    else await interaction.reply(payload);
  }
});
```

See [Project Structure](38-Project-Structure.md) for the loader.

## Full example

```js
import 'dotenv/config';
import { Client, Events, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Latency check'),
  new SlashCommandBuilder().setName('server').setDescription('Server info'),
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
  await c.application.commands.set(commands.map((x) => x.toJSON()), process.env.GUILD_ID);
  console.log('Commands registered');
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  switch (interaction.commandName) {
    case 'ping':
      return interaction.reply(`🏓 ${client.ws.ping}ms`);
    case 'server':
      return interaction.reply(`This server has ${interaction.guild.memberCount} members.`);
  }
});

client.login(process.env.DISCORD_TOKEN);
```

## Common mistakes

| Problem | Cause |
|---|---|
| Command doesn't show up | Not registered, wrong guild ID, or bot invited without `applications.commands` |
| Shows twice | Registered both globally and in the guild |
| "Invalid Form Body" on deploy | Uppercase/space in a name, description too long, required option after an optional one |
| "The application did not respond" | No reply within 3 seconds ([Responding](10-Responding-to-Interactions.md)) |

## See also
- [Command Options](05-Command-Options.md) · [Subcommands](06-Subcommands-and-Groups.md) · [Responding to Interactions](10-Responding-to-Interactions.md)
- [Slash Commands & Interactions](../Slash-Commands-and-Interactions.md) (all languages)
