// =============================================================================
//  Basic Discord Bot — JavaScript (discord.js v14)
// -----------------------------------------------------------------------------
//  Everything lives in this one file so you can read it top to bottom:
//    1. Load configuration from .env
//    2. Describe our slash commands
//    3. Create the client (the connection to Discord)
//    4. Register commands once the bot is ready
//    5. Respond when someone uses a command
//    6. Log in
// =============================================================================

import 'dotenv/config'; // reads .env into process.env
import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

// --- 1. Configuration --------------------------------------------------------
const { DISCORD_TOKEN, GUILD_ID } = process.env;

if (!DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is missing. Copy .env.example to .env and add your token.');
  process.exit(1);
}

// --- 2. Command definitions --------------------------------------------------
// A slash command is just JSON that we send to Discord. The builder helps us
// produce valid JSON without memorising the API format.
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is alive and see its latency'),

  new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Get a friendly greeting'),

  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a die')
    .addIntegerOption((option) =>
      option
        .setName('sides')
        .setDescription('How many sides the die has (default: 6)')
        .setMinValue(2)
        .setMaxValue(1000),
    ),

  new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Show someone's avatar")
    .addUserOption((option) =>
      option.setName('user').setDescription('Whose avatar? (default: you)'),
    ),

  new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball a question')
    .addStringOption((option) =>
      option.setName('question').setDescription('Your yes/no question').setRequired(true).setMaxLength(200),
    ),

  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin'),
];

// Answers for the magic 8-ball.
const EIGHT_BALL_ANSWERS = [
  'It is certain.', 'Without a doubt.', 'Yes, definitely.', 'Most likely.',
  'Outlook good.', 'Ask again later.', 'Cannot predict now.', 'Concentrate and ask again.',
  "Don't count on it.", 'My reply is no.', 'Outlook not so good.', 'Very doubtful.',
];

// Small helper: pick a random element from an array.
const pickRandom = (array) => array[Math.floor(Math.random() * array.length)];

// --- 3. The client -----------------------------------------------------------
// Intents tell Discord which events we want to receive. Slash commands only
// need the "Guilds" intent — keep intents minimal!
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- 4. Ready: register commands ---------------------------------------------
// `once` means this handler runs a single time, right after login succeeds.
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);

  // Guild commands update instantly (great for development).
  // Global commands work everywhere but can take a while to show up.
  const body = commands.map((command) => command.toJSON());
  await readyClient.application.commands.set(body, GUILD_ID || undefined);

  console.log(`📝 Registered ${body.length} commands ${GUILD_ID ? `in guild ${GUILD_ID}` : 'globally'}`);
});

// --- 5. Handle commands ------------------------------------------------------
// Every slash command, button click, etc. arrives as an "interaction".
client.on(Events.InteractionCreate, async (interaction) => {
  // We only care about slash commands in this basic bot.
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case 'ping': {
        // ws.ping = heartbeat latency between the bot and Discord's gateway.
        await interaction.reply(`🏓 Pong! Gateway latency: **${client.ws.ping}ms**`);
        break;
      }

      case 'hello': {
        await interaction.reply(`👋 Hello, ${interaction.user}! Nice to meet you.`);
        break;
      }

      case 'roll': {
        // getInteger returns null when the optional option was not provided.
        const sides = interaction.options.getInteger('sides') ?? 6;
        const result = Math.floor(Math.random() * sides) + 1;
        await interaction.reply(`🎲 You rolled a **${result}** (d${sides})`);
        break;
      }

      case 'avatar': {
        const user = interaction.options.getUser('user') ?? interaction.user;
        const url = user.displayAvatarURL({ size: 1024 });
        await interaction.reply(`🖼️ **${user.username}**'s avatar:\n${url}`);
        break;
      }

      case '8ball': {
        // Required options are guaranteed to exist, so `true` makes TS/JS happy.
        const question = interaction.options.getString('question', true);
        await interaction.reply(`🎱 **${question}**\n> ${pickRandom(EIGHT_BALL_ANSWERS)}`);
        break;
      }

      case 'coinflip': {
        const side = Math.random() < 0.5 ? 'Heads' : 'Tails';
        await interaction.reply(`🪙 The coin landed on **${side}**!`);
        break;
      }

      default:
        // Should never happen unless an old command is still registered.
        await interaction.reply({ content: 'Unknown command.', flags: MessageFlags.Ephemeral });
    }
  } catch (error) {
    console.error(`Error while running /${interaction.commandName}:`, error);

    // Always tell the user something went wrong — otherwise Discord shows
    // "The application did not respond".
    const message = { content: '⚠️ Something went wrong.', flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) await interaction.followUp(message);
    else await interaction.reply(message);
  }
});

// --- 6. Log in ---------------------------------------------------------------
client.login(DISCORD_TOKEN);
