# C# · Basic Bot

[![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com)
[![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white)](https://docs.discordnet.dev)
![Tier](https://img.shields.io/badge/tier-basic-57F287)

A complete Discord bot in a single file, [`Program.cs`](Program.cs), using top-level statements. Read it top to bottom: every section is commented.

## Commands

| Command | What it does | You learn |
|---|---|---|
| `/ping` | Shows gateway latency | `RespondAsync` |
| `/hello` | Greets you with a mention | Reading the invoking user |
| `/roll [sides]` | Rolls a die (2–1000 sides) | Integer options with min/max |
| `/avatar [user]` | Shows a user's avatar | User options |
| `/8ball <question>` | Magic 8-ball answer | Required string options |
| `/coinflip` | Heads or tails | — |

## Run

```bash
cp .env.example .env      # Windows: copy .env.example .env
dotnet run
```

Run it from this folder, because the `.env` file is read from the current directory.

## Configuration

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | yes | Bot token from the Developer Portal |
| `GUILD_ID` | no | Register commands to one server instantly instead of globally |

## How it works

1. A tiny `DotEnv` class (bottom of the file) copies `.env` into environment variables.
2. `DiscordSocketClient` connects with only the `Guilds` intent.
3. On `Ready`, `SlashCommandBuilder` definitions are uploaded with a bulk overwrite.
4. `SlashCommandExecuted` receives every command, and a `switch` picks the handler.
5. `Task.Delay(Timeout.Infinite)` keeps the program running.

## Next step

The [Enhanced bot](../02-enhanced) uses Discord.Net's **InteractionService**, where commands are attributed methods in module classes with dependency injection.

Full walkthrough: [C# Guide](../../wiki/CSharp/README.md)
