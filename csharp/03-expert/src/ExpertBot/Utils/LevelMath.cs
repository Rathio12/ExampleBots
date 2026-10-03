namespace ExpertBot.Utils;

public readonly record struct LevelInfo(int Level, long CurrentXp, long NeededXp);

/// <summary>Leveling math. The curve (5n² + 50n + 100) is the popular "MEE6" formula.</summary>
public static class LevelMath
{
    /// <summary>XP required to go from <paramref name="level"/> to level + 1.</summary>
    public static long XpForNextLevel(int level) => 5L * level * level + 50L * level + 100;

    public static LevelInfo FromXp(long totalXp)
    {
        var level = 0;
        var remaining = totalXp;
        while (remaining >= XpForNextLevel(level))
        {
            remaining -= XpForNextLevel(level);
            level++;
        }
        return new LevelInfo(level, remaining, XpForNextLevel(level));
    }

    public static string ProgressBar(long current, long total, int length = 10)
    {
        var filled = total > 0 ? (int)Math.Min(length, Math.Round((double)current / total * length)) : 0;
        return new string('▰', filled) + new string('▱', length - filled);
    }
}
