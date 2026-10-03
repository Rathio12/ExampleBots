# Configuration & .env

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Getting_started-607D8B?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[C# portal](README.md) › Getting started</sub>

| | |
|---|---|
| **Key APIs** | `Environment.GetEnvironmentVariable`, records, `IConfiguration`, `IOptions<T>` |
| **Used in** | [02-enhanced BotConfig.cs](../../csharp/02-enhanced/Config/BotConfig.cs) · [03-expert BotOptions.cs](../../csharp/03-expert/src/ExpertBot/Configuration/BotOptions.cs) |

## A tiny .env loader

.NET doesn't read `.env` files by default. The examples ship a 15-line loader:

```csharp
public static class DotEnv
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
            if (Environment.GetEnvironmentVariable(key) is null) Environment.SetEnvironmentVariable(key, value);
        }
    }
}
```

Call `DotEnv.Load()` first thing in `Program.cs`. It reads from the **current directory**, so run the bot from the folder containing `.env`. Alternatively use the `DotNetEnv` NuGet package.

## A validated options record

```csharp
public sealed record BotOptions(string Token, ulong? GuildId, string DatabasePath, int XpCooldownSeconds)
{
    public static BotOptions FromEnvironment()
    {
        var token = Optional("DISCORD_TOKEN")
            ?? throw new InvalidOperationException("DISCORD_TOKEN is required. Copy .env.example to .env.");

        return new BotOptions(
            Token: token,
            GuildId: ulong.TryParse(Optional("GUILD_ID"), out var g) ? g : null,
            DatabasePath: Optional("DATABASE_PATH") ?? "./data/bot.db",
            XpCooldownSeconds: Int("XP_COOLDOWN_SECONDS", 60, 0, 3600));
    }

    private static string? Optional(string name) =>
        Environment.GetEnvironmentVariable(name)?.Trim() is { Length: > 0 } value ? value : null;

    private static int Int(string name, int fallback, int min, int max)
    {
        var raw = Optional(name);
        if (raw is null) return fallback;
        if (!int.TryParse(raw, out var value) || value < min || value > max)
            throw new InvalidOperationException($"{name} must be between {min} and {max}.");
        return value;
    }
}
```

Register it in DI and inject it wherever needed:

```csharp
builder.Services.AddSingleton(BotOptions.FromEnvironment());

public sealed class MyModule(BotOptions options) : InteractionModuleBase<SocketInteractionContext> { … }
```

## The Generic Host configuration system (alternative)

`Host.CreateApplicationBuilder` already reads `appsettings.json`, environment variables and command-line arguments:

```json
// appsettings.json
{ "Bot": { "GuildId": 123456789012345678, "DatabasePath": "./data/bot.db" } }
```

```csharp
public sealed class BotSettings
{
    public required string Token { get; init; }
    public ulong? GuildId { get; init; }
    public string DatabasePath { get; init; } = "./data/bot.db";
}

builder.Services.AddOptions<BotSettings>()
    .Bind(builder.Configuration.GetSection("Bot"))
    .Validate(s => !string.IsNullOrWhiteSpace(s.Token), "Bot:Token is required")
    .ValidateOnStart();

// Environment variable override: Bot__Token=...   (double underscore = section separator)
```

Use **User Secrets** during development: `dotnet user-secrets set "Bot:Token" "…"`.

## Per-server settings

Store per-guild settings in the database, keyed by guild ID (the expert bot's `SettingsRepository`).

## See also
- [Project Structure](38-Project-Structure.md) · [Security Best Practices](../Security-Best-Practices.md)
