# Installation

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Getting_started-607D8B?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[C# portal](README.md) › Getting started</sub>

| | |
|---|---|
| **Requires** | .NET SDK 10 (8+ works) |
| **Packages** | `Discord.Net` (metapackage: WebSocket, REST, Interactions, Webhook) |
| **Used in** | every C# example |

## 1. Install the .NET SDK

Download from [dotnet.microsoft.com/download](https://dotnet.microsoft.com/download), or use a package manager (`winget install Microsoft.DotNet.SDK.10`, `brew install dotnet`, `apt install dotnet-sdk-10.0`).

```bash
dotnet --version     # 10.x
```

Editors: Visual Studio, JetBrains Rider, or VS Code with the C# Dev Kit.

## 2. Create a project

```bash
dotnet new console -n MyBot
cd MyBot
dotnet add package Discord.Net
```

`MyBot.csproj` now references the latest Discord.Net:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Discord.Net" Version="3.20.1" />
  </ItemGroup>
</Project>
```

The `Discord.Net` metapackage includes `Discord.Net.WebSocket` (gateway), `Discord.Net.Rest`, `Discord.Net.Interactions` (InteractionService), `Discord.Net.Commands` (prefix commands) and `Discord.Net.Webhook`.

## 3. Token

Set an environment variable, or use a `.env` file with a small loader (see [Configuration](03-Configuration-and-Env.md)):

```bash
# PowerShell
$env:DISCORD_TOKEN = "your-token"
# bash
export DISCORD_TOKEN="your-token"
```

`.gitignore`:

```gitignore
bin/
obj/
.env
```

## 4. Minimal bot

`Program.cs`:

```csharp
using Discord;
using Discord.WebSocket;

var client = new DiscordSocketClient(new DiscordSocketConfig { GatewayIntents = GatewayIntents.Guilds });

client.Log += message =>
{
    Console.WriteLine(message.ToString());
    return Task.CompletedTask;
};
client.Ready += () =>
{
    Console.WriteLine($"Logged in as {client.CurrentUser}");
    return Task.CompletedTask;
};

await client.LoginAsync(TokenType.Bot, Environment.GetEnvironmentVariable("DISCORD_TOKEN"));
await client.StartAsync();
await Task.Delay(Timeout.Infinite);   // keep running
```

```bash
dotnet run
```

## Useful extra packages

| Package | Purpose |
|---|---|
| `Microsoft.Extensions.Hosting` | Generic Host: DI, logging, hosted services ([article](38-Project-Structure.md)) |
| `Microsoft.Extensions.DependencyInjection` | DI container without the host |
| `Microsoft.Data.Sqlite` | SQLite ([article](37-SQLite-Database.md)) |
| `Dapper` | Lightweight SQL mapping |
| `DotNetEnv` | `.env` loader (or the 15-line loader in the examples) |
| `xunit` | Tests ([article](41-Testing.md)) |

## Common problems

| Error | Fix |
|---|---|
| `The remote party closed the WebSocket connection` with 4014 | Enable the privileged intent in the portal or remove it |
| `HttpException: 401: Unauthorized` | Wrong or reset token |
| `ArgumentNullException` on `LoginAsync` | `DISCORD_TOKEN` not set in this process |
| `A Ready handler is blocking the gateway task` | Don't await long work inside event handlers ([Events](28-Events.md)) |

## See also
- [Client & Intents](02-Client-and-Intents.md) · [Getting Started](../Getting-Started.md)
