# Testing

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Framework** | xUnit |
| **Used in** | [03-expert/tests/ExpertBot.Tests/](../../csharp/03-expert/tests/ExpertBot.Tests) |

## Creating a test project

```bash
dotnet new xunit -n ExpertBot.Tests -o tests/ExpertBot.Tests
dotnet sln add tests/ExpertBot.Tests
dotnet add tests/ExpertBot.Tests reference src/ExpertBot
dotnet test
```

## Unit tests

```csharp
public class DurationTests
{
    [Theory]
    [InlineData("30s", 30)]
    [InlineData("1h30m", 5400)]
    [InlineData("1d 12h", 129_600)]
    public void Parses_valid_durations(string input, long expected) => Assert.Equal(expected, Duration.Parse(input));

    [Theory]
    [InlineData("")]
    [InlineData("abc")]
    [InlineData("0m")]
    public void Rejects_invalid_durations(string input) => Assert.Null(Duration.Parse(input));
}
```

## Repository tests with in-memory SQLite

```csharp
public sealed class RepositoryTests : IDisposable
{
    private readonly Database _db = Database.InMemory();   // fresh database per test class instance
    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Warnings_add_list_clear()
    {
        var warnings = new WarningRepository(_db);
        await warnings.AddAsync(1, 10, 99, "spam");
        Assert.Single(await warnings.ListAsync(1, 10));
    }
}
```

xUnit creates a new test class instance per test, so every test gets its own database.

## Building every module (catches attribute mistakes)

```csharp
[Fact]
public async Task All_modules_build()
{
    using var client = new DiscordSocketClient();          // never logs in
    using var interactions = new InteractionService(client);

    await using var services = new ServiceCollection()
        .AddLogging()
        .AddSingleton(client)
        .AddSingleton(interactions)
        .AddSingleton(_ => Database.InMemory())
        .AddSingleton<WarningRepository>()
        // … every service your modules inject
        .BuildServiceProvider();

    await interactions.AddModulesAsync(typeof(DiscordBotService).Assembly, services);

    Assert.Contains(interactions.SlashCommands, c => c.Name == "warn");
    Assert.Contains(interactions.ComponentCommands, c => c.Name == "leaderboard:*");
}
```

Discord.Net instantiates modules while building them, so a missing DI registration or a wildcard/parameter mismatch fails this test instead of the live bot.

## Testing logic behind commands

Keep commands thin: put the logic in services that take interfaces, and test those services directly. Discord.Net's types are mostly interfaces (`IUser`, `IGuildUser`, `IMessageChannel`), so a mocking library such as Moq or NSubstitute can fake them when needed.

## In Docker builds

The expert bot's Dockerfile runs `dotnet test` in the build stage, so a failing test stops a bad image from being built.

## See also
- [Testing](../Testing.md) · [Project Structure](38-Project-Structure.md)
