using ExpertBot.Utils;

namespace ExpertBot.Tests;

public class LevelMathTests
{
    [Theory]
    [InlineData(0, 100)]
    [InlineData(1, 155)]
    [InlineData(10, 1100)]
    public void Follows_the_curve(int level, long expected) => Assert.Equal(expected, LevelMath.XpForNextLevel(level));

    [Fact]
    public void Converts_xp_to_levels()
    {
        Assert.Equal(new LevelInfo(0, 0, 100), LevelMath.FromXp(0));
        Assert.Equal(0, LevelMath.FromXp(99).Level);
        Assert.Equal(new LevelInfo(1, 0, 155), LevelMath.FromXp(100));
        Assert.Equal(new LevelInfo(1, 20, 155), LevelMath.FromXp(120));
        Assert.Equal(2, LevelMath.FromXp(255).Level);
    }

    [Fact]
    public void Renders_progress_bars()
    {
        Assert.Equal("▱▱▱▱▱▱▱▱▱▱", LevelMath.ProgressBar(0, 100));
        Assert.Equal("▰▰▰▰▰▱▱▱▱▱", LevelMath.ProgressBar(50, 100));
        Assert.Equal("▰▰▰▰▰▰▰▰▰▰", LevelMath.ProgressBar(100, 100));
    }
}
