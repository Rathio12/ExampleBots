# C# · Enhanced Bot

[![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com)
[![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white)](https://docs.discordnet.dev)
![Tier](https://img.shields.io/badge/tier-enhanced-FEE75C)

A modular community bot using Discord.Net's **InteractionService**. Commands, buttons, select menus and modals are attributed methods in module classes. Services are wired with `Microsoft.Extensions.DependencyInjection`.

## Features

| Feature | File | You learn |
|---|---|---|
| `/ping`, `/help`, `/serverinfo`, `/userinfo` | [Modules/GeneralModule.cs](Modules/GeneralModule.cs) | Modules, embeds, `CommandContextType` |
| `/poll <question>` | [Modules/PollModule.cs](Modules/PollModule.cs) | Buttons, `[ComponentInteraction("poll:*:*")]` wildcards |
| `/trivia` | [Modules/TriviaModule.cs](Modules/TriviaModule.cs) | Select menus, selected values parameter |
| `/feedback` | [Modules/FeedbackModule.cs](Modules/FeedbackModule.cs) | `IModal` classes, `[ModalInteraction]` |
| `/players [address]` | [Modules/GameServerModule.cs](Modules/GameServerModule.cs) | Live Minecraft player counts, `HttpClient` |
| Status updater | [Services/StatusUpdater.cs](Services/StatusUpdater.cs) | `PeriodicTimer`, presence, channel renames |
| Welcome messages | [Services/WelcomeService.cs](Services/WelcomeService.cs) | Events, privileged intents |
| Cooldowns | [Preconditions/CooldownAttribute.cs](Preconditions/CooldownAttribute.cs) | Writing a custom precondition |
| Error handling | [Services/InteractionHandler.cs](Services/InteractionHandler.cs) | `InteractionExecuted` results |

## Run

```bash
cp .env.example .env
dotnet run
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | yes | Bot token |
| `GUILD_ID` | no | Register commands to one server instantly |
| `WELCOME_CHANNEL_ID` | no | Enables welcome messages. **Turn on the Server Members intent first.** |
| `FEEDBACK_CHANNEL_ID` | no | Where `/feedback` submissions are posted |
| `GAME_SERVER_ADDRESS` | no | Minecraft server to track |
| `STATUS_CHANNEL_ID` | no | Channel renamed to `🟢 Players: 12/100` |
| `STATUS_INTERVAL_MINUTES` | no | Update interval, minimum 5 |

## Project structure

```
Program.cs                    DI container and startup
Config/                       BotConfig record, DotEnv loader
Modules/                      General, Poll, Trivia, Feedback, GameServer
Services/
├── InteractionHandler.cs     registers commands, routes interactions, handles errors
├── MinecraftService.cs       mcsrvstat.us client
├── StatusUpdater.cs          background player-count loop
├── WelcomeService.cs         UserJoined handler
├── PollStore.cs              in-memory polls + rendering
└── Logger.cs                 coloured console logging
Preconditions/                [Cooldown(seconds)]
Utils/                        embed helpers
```

## Adding a command

Add a method to any module (or create a new `public sealed class FunModule : InteractionModuleBase<SocketInteractionContext>`):

```csharp
[SlashCommand("hug", "Hug someone")]
[Cooldown(5)]
public async Task HugAsync(IUser user) =>
    await RespondAsync($"🤗 {Context.User.Mention} hugs {user.Mention}!");
```

Restart the bot. Modules are discovered automatically and commands re-registered on startup.

## Next step

The [Expert bot](../03-expert) moves to the .NET Generic Host and adds SQLite, moderation, an audit-log system, leveling, reminders, autocomplete, context menus, xUnit tests and Docker.

Full walkthrough: [C# Guide](../../wiki/CSharp/README.md)
