using System.Text.RegularExpressions;

namespace ExpertBot.Utils;

/// <summary>
/// Parses human durations like "10m", "1h30m", "2d 12h" into seconds.
/// Pure functions with no Discord dependency are easy to unit test.
/// </summary>
public static partial class Duration
{
    private static readonly (char Unit, long Seconds)[] Units = [('w', 604_800), ('d', 86_400), ('h', 3600), ('m', 60), ('s', 1)];

    [GeneratedRegex(@"^(\d+[smhdw])+$")]
    private static partial Regex FullPattern();

    [GeneratedRegex(@"(\d+)([smhdw])")]
    private static partial Regex PartPattern();

    /// <returns>Seconds, or null when the input is invalid or zero.</returns>
    public static long? Parse(string? input)
    {
        if (input is null) return null;
        var text = Regex.Replace(input.ToLowerInvariant(), @"\s+", "");
        if (!FullPattern().IsMatch(text)) return null;

        long total = 0;
        foreach (Match match in PartPattern().Matches(text))
        {
            if (!long.TryParse(match.Groups[1].Value, out var amount)) return null;
            var size = Units.First(u => u.Unit == match.Groups[2].Value[0]).Seconds;
            try { total = checked(total + amount * size); }
            catch (OverflowException) { return null; }
        }
        return total > 0 ? total : null;
    }

    /// <summary>Formats seconds as e.g. "1d 2h 5m".</summary>
    public static string Format(long totalSeconds)
    {
        var remaining = Math.Max(0, totalSeconds);
        var parts = new List<string>();
        foreach (var (unit, size) in Units)
        {
            var amount = remaining / size;
            if (amount > 0)
            {
                parts.Add($"{amount}{unit}");
                remaining -= amount * size;
            }
        }
        return parts.Count > 0 ? string.Join(' ', parts) : "0s";
    }
}
