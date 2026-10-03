// =============================================================================
//  Basic Discord Bot — C# (Discord.Net 3.x)
// -----------------------------------------------------------------------------
//  Everything lives in this one file so you can read it top to bottom:
//    1. Load configuration from .env
//    2. Create the client (the connection to Discord)
//    3. Register slash commands when the bot is ready
//    4. Respond when someone uses a command
//    5. Log in and keep running
// =============================================================================
using Discord;
using Discord.WebSocket;

// --- 1. Configuration --------------------------------------------------------
DotEnv.Load(); // copies values from .env into environment variables

var token = Environment.GetEnvironmentVariable("DISCORD_TOKEN");
if (string.IsNullOrWhiteSpace(token))
{
    Console.Error.WriteLine("❌ DISCORD_TOKEN is missing. Copy .env.example to .env and add your token.");
    return;
}
ulong? guildId = ulong.TryParse(Environment.GetEnvironmentVariable("GUILD_ID"), out var parsed) ? parsed : null;

string[] eightBallAnswers =
[
    "It is certain.", "Without a doubt.", "Yes, definitely.", "Most likely.",
    "Outlook good.", "Ask again later.", "Cannot predict now.", "Concentrate and ask again.",
    "Don't count on it.", "My reply is no.", "Outlook not so good.", "Very doubtful.",
];

// --- 2. The client -----------------------------------------------------------
// Intents tell Discord which events we want. Slash commands only need Guilds.
var client = new DiscordSocketClient(new DiscordSocketConfig { GatewayIntents = GatewayIntents.Guilds });

// Discord.Net reports everything (connections, warnings, errors) through Log.
client.Log += message =>
{
    Console.WriteLine(message.ToString());
    return Task.CompletedTask;
};

// --- 3. Ready: register commands ---------------------------------------------
var registered = false;
client.Ready += async () =>
{
    Console.WriteLine($"✅ Logged in as {client.CurrentUser}");
    if (registered) return; // Ready fires again after every reconnect
    registered = true;

    // A slash command is JSON we send to Discord; the builder produces it for us.
    ApplicationCommandProperties[] commands =
    [
        new SlashCommandBuilder().WithName("ping").WithDescription("Check if the bot is alive and see its latency").Build(),
        new SlashCommandBuilder().WithName("hello").WithDescription("Get a friendly greeting").Build(),
        new SlashCommandBuilder()
            .WithName("roll")
            .WithDescription("Roll a die")
            .AddOption(new SlashCommandOptionBuilder()
                .WithName("sides")
                .WithDescription("How many sides the die has (default: 6)")
                .WithType(ApplicationCommandOptionType.Integer)
                .WithMinValue(2)
                .WithMaxValue(1000))
            .Build(),
        new SlashCommandBuilder()
            .WithName("avatar")
            .WithDescription("Show someone's avatar")
            .AddOption("user", ApplicationCommandOptionType.User, "Whose avatar? (default: you)", isRequired: false)
            .Build(),
        new SlashCommandBuilder()
            .WithName("8ball")
            .WithDescription("Ask the magic 8-ball a question")
            .AddOption(new SlashCommandOptionBuilder()
                .WithName("question")
                .WithDescription("Your yes/no question")
                .WithType(ApplicationCommandOptionType.String)
                .WithRequired(true)
                .WithMaxLength(200))
            .Build(),
        new SlashCommandBuilder().WithName("coinflip").WithDescription("Flip a coin").Build(),
    ];

    // Guild commands update instantly; global commands can take a while to appear.
    if (guildId is { } id)
        await client.Rest.BulkOverwriteGuildCommands(commands, id);
    else
        await client.BulkOverwriteGlobalApplicationCommandsAsync(commands);

    Console.WriteLine($"📝 Registered {commands.Length} commands {(guildId is null ? "globally" : $"in guild {guildId}")}");
};

// --- 4. Handle commands ------------------------------------------------------
client.SlashCommandExecuted += async command =>
{
    try
    {
        switch (command.CommandName)
        {
            case "ping":
                // Latency = heartbeat round-trip to Discord's gateway, in ms.
                await command.RespondAsync($"🏓 Pong! Gateway latency: **{client.Latency}ms**");
                break;

            case "hello":
                await command.RespondAsync($"👋 Hello, {command.User.Mention}! Nice to meet you.");
                break;

            case "roll":
            {
                // Integer options arrive as `long`. Missing optional options are absent.
                var sides = (long?)command.Data.Options.FirstOrDefault(o => o.Name == "sides")?.Value ?? 6;
                var result = Random.Shared.NextInt64(1, sides + 1);
                await command.RespondAsync($"🎲 You rolled a **{result}** (d{sides})");
                break;
            }

            case "avatar":
            {
                var user = command.Data.Options.FirstOrDefault(o => o.Name == "user")?.Value as IUser ?? command.User;
                await command.RespondAsync($"🖼️ **{user.Username}**'s avatar:\n{user.GetDisplayAvatarUrl(size: 1024)}");
                break;
            }

            case "8ball":
            {
                var question = (string)command.Data.Options.First(o => o.Name == "question").Value;
                var answer = eightBallAnswers[Random.Shared.Next(eightBallAnswers.Length)];
                await command.RespondAsync($"🎱 **{question}**\n> {answer}");
                break;
            }

            case "coinflip":
                await command.RespondAsync($"🪙 The coin landed on **{(Random.Shared.Next(2) == 0 ? "Heads" : "Tails")}**!");
                break;

            default:
                await command.RespondAsync("Unknown command.", ephemeral: true);
                break;
        }
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"Error while running /{command.CommandName}: {ex}");
        // Always answer — otherwise Discord shows "The application did not respond".
        if (command.HasResponded) await command.FollowupAsync("⚠️ Something went wrong.", ephemeral: true);
        else await command.RespondAsync("⚠️ Something went wrong.", ephemeral: true);
    }
};

// --- 5. Log in ---------------------------------------------------------------
await client.LoginAsync(TokenType.Bot, token);
await client.StartAsync();
await Task.Delay(Timeout.Infinite); // keep the program alive

/// <summary>
/// A tiny .env loader: reads KEY=VALUE lines into environment variables.
/// (Real projects can use the DotNetEnv package; this shows how simple it is.)
/// </summary>
static class DotEnv
{
    public static void Load(string path = ".env")
    {
        if (!File.Exists(path)) return;
        foreach (var raw in File.ReadAllLines(path))
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;
            var separator = line.IndexOf('=');
            if (separator <= 0) continue;
            var key = line[..separator].Trim();
            var value = line[(separator + 1)..].Trim().Trim('"');
            // Real environment variables win over .env (useful in Docker/CI).
            if (Environment.GetEnvironmentVariable(key) is null) Environment.SetEnvironmentVariable(key, value);
        }
    }
}
