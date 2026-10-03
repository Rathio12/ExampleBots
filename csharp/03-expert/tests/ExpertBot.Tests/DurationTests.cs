using ExpertBot.Utils;

namespace ExpertBot.Tests;

public class DurationTests
{
    [Theory]
    [InlineData("30s", 30)]
    [InlineData("10m", 600)]
    [InlineData("2h", 7200)]
    [InlineData("1d", 86_400)]
    [InlineData("1w", 604_800)]
    [InlineData("1h30m", 5400)]
    [InlineData("1d 12h", 129_600)]
    [InlineData("2H", 7200)]
    public void Parses_valid_durations(string input, long expected) => Assert.Equal(expected, Duration.Parse(input));

    [Theory]
    [InlineData("")]
    [InlineData("abc")]
    [InlineData("10")]
    [InlineData("m10")]
    [InlineData("10x")]
    [InlineData("0m")]
    [InlineData("-5m")]
    [InlineData("1.5h")]
    [InlineData("99999999999999999999w")]
    [InlineData(null)]
    public void Rejects_invalid_durations(string? input) => Assert.Null(Duration.Parse(input));

    [Theory]
    [InlineData(0, "0s")]
    [InlineData(59, "59s")]
    [InlineData(5400, "1h 30m")]
    [InlineData(694_861, "1w 1d 1h 1m 1s")]
    public void Formats_durations(long seconds, string expected) => Assert.Equal(expected, Duration.Format(seconds));

    [Fact]
    public void Round_trips() => Assert.Equal(129_600, Duration.Parse(Duration.Format(129_600)));
}
