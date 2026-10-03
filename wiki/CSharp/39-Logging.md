# Logging

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key types** | `ILogger<T>`, `LogMessage`, `LogSeverity` |
| **Used in** | [02-enhanced Logger.cs](../../csharp/02-enhanced/Services/Logger.cs) · [03-expert DiscordBotService.cs](../../csharp/03-expert/src/ExpertBot/Services/DiscordBotService.cs) |

## Discord.Net's Log event

Subscribe on both the client and the InteractionService. That's where connection problems, rate limits and handler exceptions show up:

```csharp
client.Log += LogAsync;
interactions.Log += LogAsync;

static Task LogAsync(LogMessage message)
{
    Console.WriteLine($"{DateTime.Now:HH:mm:ss} [{message.Severity}] {message.Source}: {message.Message} {message.Exception}");
    return Task.CompletedTask;
}
```

## Bridging to `ILogger`

```csharp
private Task LogAsync(LogMessage message)
{
    var level = message.Severity switch
    {
        LogSeverity.Critical => LogLevel.Critical,
        LogSeverity.Error => LogLevel.Error,
        LogSeverity.Warning => LogLevel.Warning,
        LogSeverity.Info => LogLevel.Information,
        LogSeverity.Verbose => LogLevel.Debug,
        _ => LogLevel.Trace,
    };
    logger.Log(level, message.Exception, "[{Source}] {Message}", message.Source, message.Message);
    return Task.CompletedTask;
}
```

Use **message templates** (`"{Source}"`), not string interpolation, so structured loggers keep the fields.

## Console formats with the Generic Host

```csharp
builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(o => { o.SingleLine = true; o.TimestampFormat = "HH:mm:ss "; });   // development
builder.Logging.AddJsonConsole();                                                                   // production (JSON lines)
builder.Logging.SetMinimumLevel(LogLevel.Information);
builder.Logging.AddFilter("Microsoft", LogLevel.Warning);   // quiet framework noise
```

The expert bot switches to JSON when `ENVIRONMENT=production`.

## Serilog (optional)

```bash
dotnet add package Serilog.Extensions.Hosting
dotnet add package Serilog.Sinks.Console
dotnet add package Serilog.Sinks.File
```

```csharp
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/bot-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();
builder.Services.AddSerilog();
```

## What to log

- ✅ Startup, guild joins/leaves, command failures with context, moderation actions
- ❌ Tokens, API keys, every message's content

## See also
- [Error Handling](34-Error-Handling.md) · [Deployment](42-Deployment.md)
