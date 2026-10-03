# C# Portal: Discord.Net 3.x

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![articles](https://img.shields.io/badge/articles-42-5865F2?style=flat-square)

<sub>[Wiki home](../Home.md) › C#</sub>

| | |
|---|---|
| **Library** | [Discord.Net](https://docs.discordnet.dev) 3.x |
| **Runtime** | .NET 10 (works on .NET 8+) |
| **Docs** | [docs.discordnet.dev](https://docs.discordnet.dev) · [samples](https://github.com/discord-net/Discord.Net/tree/dev/samples) |
| **Example bots** | [Basic](../../csharp/01-basic) · [Enhanced](../../csharp/02-enhanced) · [Expert](../../csharp/03-expert) |

**Discord.Net** is the main .NET library for Discord. It's strongly typed and async throughout, and its **InteractionService** turns attributed methods into slash commands, buttons, selects and modals. It fits naturally with dependency injection and the .NET Generic Host.

> New to bots? Read [Installation](01-Installation.md) → [Client & Intents](02-Client-and-Intents.md) → [Slash Commands](04-Slash-Commands.md) → [Responding to Interactions](10-Responding-to-Interactions.md) in that order.

## Articles

### Getting started
| # | Article | You'll learn |
|---|---|---|
| 01 | [Installation](01-Installation.md) | .NET SDK, project setup, NuGet |
| 02 | [Client & Intents](02-Client-and-Intents.md) | `DiscordSocketClient`, config, intents, logging |
| 03 | [Configuration & .env](03-Configuration-and-Env.md) | Environment variables, options records, the Generic Host |

### Commands & interactions
| # | Article | You'll learn |
|---|---|---|
| 04 | [Slash Commands](04-Slash-Commands.md) | InteractionService modules, registration |
| 05 | [Command Options](05-Command-Options.md) | Parameters as options, `[Summary]`, min/max |
| 06 | [Subcommands & Groups](06-Subcommands-and-Groups.md) | `[Group]` modules |
| 07 | [Choices](07-Choices.md) | `[Choice]`, enums |
| 08 | [Autocomplete](08-Autocomplete.md) | `AutocompleteHandler` |
| 09 | [Context Menus](09-Context-Menus.md) | `[UserCommand]`, `[MessageCommand]` |
| 10 | [Responding to Interactions](10-Responding-to-Interactions.md) | Respond, defer, follow-up, modify |

### Messages & components
| # | Article | You'll learn |
|---|---|---|
| 11 | [Embeds](11-Embeds.md) | `EmbedBuilder` |
| 12 | [Buttons](12-Buttons.md) | `ComponentBuilder`, `[ComponentInteraction]`, wildcards |
| 13 | [Select Menus](13-Select-Menus.md) | `SelectMenuBuilder`, all select types |
| 14 | [Modals](14-Modals.md) | `IModal`, `[ModalInteraction]` |
| 15 | [Components V2](15-Components-V2.md) | `ComponentBuilderV2`, containers |
| 16 | [Sending Messages](16-Sending-Messages.md) | Send, reply, mentions, DMs, `Format` |
| 17 | [Editing, Deleting & Pinning](17-Editing-Deleting-Pinning.md) | Fetching and changing messages |
| 18 | [Reactions](18-Reactions.md) | Emoji, reaction events |
| 19 | [Files & Attachments](19-Files-and-Attachments.md) | `FileAttachment`, uploads |
| 20 | [Threads & Forums](20-Threads-and-Forums.md) | Threads, forum posts |
| 21 | [Webhooks](21-Webhooks.md) | `DiscordWebhookClient` |
| 22 | [Polls](22-Polls.md) | `PollProperties` |

### Servers, members & moderation
| # | Article | You'll learn |
|---|---|---|
| 23 | [Members](23-Members.md) | `SocketGuildUser`, fetching, editing |
| 24 | [Roles](24-Roles.md) | Creating and assigning roles |
| 25 | [Moderation](25-Moderation.md) | Timeout, kick, ban, purge |
| 26 | [Permissions](26-Permissions.md) | Preconditions, permission checks, overwrites |
| 27 | [Channels](27-Channels.md) | Creating and editing channels |

### Events
| # | Article | You'll learn |
|---|---|---|
| 28 | [Events](28-Events.md) | Event handlers, `Cacheable`, full list |
| 29 | [Message Events](29-Message-Events.md) | Received, updated, deleted |
| 30 | [Member Events](30-Member-Events.md) | Joins, leaves, updates |
| 31 | [Voice](31-Voice.md) | Voice states, audio |
| 32 | [Presence & Activity](32-Presence-and-Activity.md) | Status, activities |

### Building real bots
| # | Article | You'll learn |
|---|---|---|
| 33 | [Cooldowns](33-Cooldowns.md) | Custom preconditions |
| 34 | [Error Handling](34-Error-Handling.md) | `InteractionExecuted`, `HttpException` |
| 35 | [Background Tasks](35-Background-Tasks.md) | `PeriodicTimer`, `BackgroundService` |
| 36 | [HTTP Requests](36-HTTP-Requests.md) | `HttpClient`, `IHttpClientFactory`, JSON |
| 37 | [SQLite Database](37-SQLite-Database.md) | Microsoft.Data.Sqlite, Dapper, EF Core |
| 38 | [Project Structure](38-Project-Structure.md) | Generic Host, DI, hosted services |
| 39 | [Logging](39-Logging.md) | `ILogger`, bridging Discord.Net logs |
| 40 | [Sharding](40-Sharding.md) | `DiscordShardedClient` |
| 41 | [Testing](41-Testing.md) | xUnit, building modules in tests |
| 42 | [Deployment](42-Deployment.md) | `dotnet publish`, Docker, services |

## Quick reference

```csharp
using Discord;
using Discord.WebSocket;

var client = new DiscordSocketClient(new DiscordSocketConfig { GatewayIntents = GatewayIntents.Guilds });
client.Log += msg => { Console.WriteLine(msg); return Task.CompletedTask; };

client.Ready += async () =>
{
    var ping = new SlashCommandBuilder().WithName("ping").WithDescription("Pong!").Build();
    await client.BulkOverwriteGlobalApplicationCommandsAsync([ping]);
};

client.SlashCommandExecuted += async command =>
{
    if (command.CommandName == "ping") await command.RespondAsync("Pong!", ephemeral: true);
};

await client.LoginAsync(TokenType.Bot, Environment.GetEnvironmentVariable("DISCORD_TOKEN"));
await client.StartAsync();
await Task.Delay(Timeout.Infinite);
```

## See also
- Shared concepts: [How Discord Bots Work](../How-Discord-Bots-Work.md) · [Limits Cheat Sheet](../Limits-Cheat-Sheet.md)
- Other portals: [JavaScript](../JavaScript/README.md) · [Python](../Python/README.md)
