using ExpertBot.Data;

namespace ExpertBot.Tests;

/// <summary>Integration tests against a real in-memory SQLite database.</summary>
public sealed class RepositoryTests : IDisposable
{
    private readonly Database _db = Database.InMemory();

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Levels_accumulate_and_rank()
    {
        var levels = new LevelRepository(_db);
        await levels.AddXpAsync(1, 100, 50);
        Assert.Equal(75, await levels.AddXpAsync(1, 100, 25));
        await levels.AddXpAsync(1, 200, 100);

        Assert.Equal(2, await levels.GetRankAsync(1, 75));
        Assert.Equal([200UL, 100UL], (await levels.GetTopAsync(1, 10)).Select(r => r.UserId));
        Assert.Equal(0, await levels.GetXpAsync(2, 100)); // guilds are separate
    }

    [Fact]
    public async Task Warnings_add_list_clear()
    {
        var warnings = new WarningRepository(_db);
        await warnings.AddAsync(1, 10, 99, "spam");
        await warnings.AddAsync(1, 10, 99, "more spam");
        Assert.Equal(2, (await warnings.ListAsync(1, 10)).Count);
        Assert.Equal(2, await warnings.ClearAsync(1, 10));
        Assert.Empty(await warnings.ListAsync(1, 10));
    }

    [Fact]
    public async Task Tags_refuse_duplicates_and_escape_wildcards()
    {
        var tags = new TagRepository(_db);
        Assert.True(await tags.CreateAsync(1, "rules", "Be nice", 10));
        Assert.False(await tags.CreateAsync(1, "rules", "Again", 10));
        await tags.CreateAsync(1, "faq", "Read the FAQ", 10);

        Assert.Equal(["rules"], await tags.SearchAsync(1, "ru"));
        Assert.Empty(await tags.SearchAsync(1, "%"));
    }

    [Fact]
    public async Task Reminders_due_and_ownership()
    {
        var reminders = new ReminderRepository(_db);
        var due = await reminders.AddAsync(10, 20, "past", 1);
        await reminders.AddAsync(10, 20, "future", 9_999_999_999);

        Assert.Equal([due], (await reminders.DueAsync(100)).Select(r => r.Id));
        Assert.False(await reminders.RemoveForUserAsync(due, 999));
        Assert.True(await reminders.RemoveForUserAsync(due, 10));
    }

    [Fact]
    public async Task Settings_are_cached_and_invalidated()
    {
        var settings = new SettingsRepository(_db);
        Assert.Null((await settings.GetAsync(1)).AuditlogChannelId);
        await settings.SetAuditlogChannelAsync(1, 555);
        Assert.Equal(555UL, (await settings.GetAsync(1)).AuditlogChannelId);
    }
}
