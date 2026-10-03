using Discord;

namespace EnhancedBot.Services;

/// <summary>Writes Discord.Net log messages to the console with colours per severity.</summary>
public static class Logger
{
    public static Task LogAsync(LogMessage message)
    {
        Console.ForegroundColor = message.Severity switch
        {
            LogSeverity.Critical or LogSeverity.Error => ConsoleColor.Red,
            LogSeverity.Warning => ConsoleColor.Yellow,
            LogSeverity.Info => ConsoleColor.Cyan,
            _ => ConsoleColor.DarkGray,
        };
        Console.WriteLine($"{DateTime.Now:HH:mm:ss} {message.Severity,-8} {message.Source,-12} {message.Message} {message.Exception}");
        Console.ResetColor();
        return Task.CompletedTask;
    }

    public static Task Info(string source, string text) => LogAsync(new LogMessage(LogSeverity.Info, source, text));
    public static Task Warn(string source, string text, Exception? ex = null) => LogAsync(new LogMessage(LogSeverity.Warning, source, text, ex));
}
