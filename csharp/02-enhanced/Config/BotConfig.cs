namespace EnhancedBot.Config;

/// <summary>Validated configuration read once from environment variables / .env.</summary>
public sealed record BotConfig(
    string Token,
    ulong? GuildId,
    ulong? WelcomeChannelId,
    ulong? FeedbackChannelId,
    string? GameServerAddress,
    ulong? StatusChannelId,
    int StatusIntervalMinutes)
{
    public static BotConfig FromEnvironment()
    {
        var token = Optional("DISCORD_TOKEN")
            ?? throw new InvalidOperationException("DISCORD_TOKEN is missing. Copy .env.example to .env and add your token.");

        return new BotConfig(
            Token: token,
            GuildId: OptionalId("GUILD_ID"),
            WelcomeChannelId: OptionalId("WELCOME_CHANNEL_ID"),
            FeedbackChannelId: OptionalId("FEEDBACK_CHANNEL_ID"),
            GameServerAddress: Optional("GAME_SERVER_ADDRESS"),
            StatusChannelId: OptionalId("STATUS_CHANNEL_ID"),
            // Channel renames are limited to 2 per 10 minutes — never go below 5.
            StatusIntervalMinutes: Math.Max(5, int.TryParse(Optional("STATUS_INTERVAL_MINUTES"), out var m) ? m : 5));
    }

    private static string? Optional(string name)
    {
        var value = Environment.GetEnvironmentVariable(name)?.Trim();
        return string.IsNullOrEmpty(value) ? null : value;
    }

    private static ulong? OptionalId(string name) => ulong.TryParse(Optional(name), out var id) ? id : null;
}
