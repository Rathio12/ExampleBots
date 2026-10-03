using Microsoft.Extensions.Logging;

namespace ExpertBot.Configuration;

/// <summary>Validated configuration. Fails fast at startup with a clear message.</summary>
public sealed record BotOptions(
    string Token,
    ulong? GuildId,
    string DatabasePath,
    LogLevel LogLevel,
    bool JsonLogs,
    int XpMin,
    int XpMax,
    int XpCooldownSeconds)
{
    public static BotOptions FromEnvironment()
    {
        var token = Optional("DISCORD_TOKEN")
            ?? throw new InvalidOperationException("DISCORD_TOKEN is required. Copy .env.example to .env and fill it in.");

        var xpMin = Int("XP_MIN", 15, 1, 1000);
        return new BotOptions(
            Token: token,
            GuildId: ulong.TryParse(Optional("GUILD_ID"), out var g) ? g : null,
            DatabasePath: Optional("DATABASE_PATH") ?? "./data/bot.db",
            LogLevel: Enum.TryParse<LogLevel>(Optional("LOG_LEVEL"), ignoreCase: true, out var level) ? level : LogLevel.Information,
            JsonLogs: Optional("ENVIRONMENT") == "production",
            XpMin: xpMin,
            XpMax: Int("XP_MAX", 25, xpMin, 1000),
            XpCooldownSeconds: Int("XP_COOLDOWN_SECONDS", 60, 0, 3600));
    }

    private static string? Optional(string name)
    {
        var value = Environment.GetEnvironmentVariable(name)?.Trim();
        return string.IsNullOrEmpty(value) ? null : value;
    }

    private static int Int(string name, int fallback, int min, int max)
    {
        var raw = Optional(name);
        if (raw is null) return fallback;
        if (!int.TryParse(raw, out var value) || value < min || value > max)
            throw new InvalidOperationException($"{name} must be an integer between {min} and {max} (got \"{raw}\").");
        return value;
    }
}
