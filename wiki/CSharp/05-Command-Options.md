# Command Options

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[C# portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key APIs** | method parameters, `[Summary]`, `[MinValue]`, `[MaxValue]`, `[MinLength]`, `[MaxLength]`, `[ChannelTypes]` |
| **Used in** | [02-enhanced GeneralModule.cs](../../csharp/02-enhanced/Modules/GeneralModule.cs) · [03-expert ModerationModule.cs](../../csharp/03-expert/src/ExpertBot/Modules/ModerationModule.cs) |

With InteractionService, **parameters are options**. The parameter type picks the option type, and a default value makes it optional.

## Parameter types → option types

| C# type | Discord option |
|---|---|
| `string` | String |
| `int`, `long`, `uint`… | Integer |
| `double`, `float`, `decimal` | Number |
| `bool` | Boolean |
| `IUser` / `IGuildUser` / `SocketGuildUser` | User |
| `IChannel`, `ITextChannel`, `IVoiceChannel`, `IThreadChannel`… | Channel (filtered by type) |
| `IRole` | Role |
| `IMentionable` | Mentionable |
| `IAttachment` | Attachment |
| `TimeSpan` | String parsed as a duration (e.g. `1h30m`) |
| `enum` | [Choices](07-Choices.md) |

## Example with every common type

```csharp
[SlashCommand("example", "Shows every option type")]
public async Task ExampleAsync(
    [Summary("text", "Some text"), MinLength(3), MaxLength(200)] string text,     // required
    [Summary(description: "1-100"), MinValue(1), MaxValue(100)] int amount = 10,  // optional
    [Summary(description: "Show to everyone?")] bool isPublic = false,
    [Summary(description: "A user")] IUser? user = null,
    [Summary(description: "A text channel")] ITextChannel? channel = null,
    [Summary(description: "A role")] IRole? role = null,
    [Summary(description: "Upload a file")] IAttachment? file = null)
{
    user ??= Context.User;
    await RespondAsync($"{text} {amount} {user.Mention}", ephemeral: !isPublic);
}
```

**Rules:** required parameters before optional ones, at most 25 options. Option names are lowercase (Discord.Net converts parameter names, but use `[Summary("name")]` to be explicit).

## Users vs guild users

`IUser` works for anyone. `SocketGuildUser` gives you roles, nickname and join date, but fails to convert if the user isn't a member. Pattern from the Enhanced bot:

```csharp
public async Task UserInfoAsync([Summary("user", "Who?")] IUser? user = null)
{
    user ??= Context.User;
    if (user is not SocketGuildUser member)
    {
        await RespondAsync($"**{user.Username}** is not a member of this server.");
        return;
    }
    var roles = member.Roles.Where(r => !r.IsEveryone).OrderByDescending(r => r.Position).Select(r => r.Mention);
}
```

## Channel filtering

```csharp
[ChannelTypes(ChannelType.Text, ChannelType.News)] ITextChannel channel
```

## Attachments

```csharp
public async Task UploadAsync(IAttachment file)
{
    if (file.ContentType?.StartsWith("image/") != true)
    {
        await RespondAsync("Please upload an image.", ephemeral: true);
        return;
    }
    await RespondAsync($"{file.Filename}: {file.Size} bytes, {file.Width}x{file.Height}");
}
```

## Custom type converters

Teach InteractionService a new parameter type:

```csharp
public sealed class DurationConverter : TypeConverter<Duration>
{
    public override ApplicationCommandOptionType GetDiscordType() => ApplicationCommandOptionType.String;

    public override Task<TypeConverterResult> ReadAsync(IInteractionContext context, IApplicationCommandInteractionDataOption option, IServiceProvider services)
    {
        var seconds = Utils.Duration.Parse(option.Value as string);
        return Task.FromResult(seconds is { } s
            ? TypeConverterResult.FromSuccess(new Duration(s))
            : TypeConverterResult.FromError(InteractionCommandError.ConvertFailed, "Use a duration like 10m or 2h."));
    }
}

interactions.AddTypeConverter<Duration>(new DurationConverter());
```

## Full example: `/roll`

```csharp
[SlashCommand("roll", "Roll dice")]
public async Task RollAsync(
    [Summary(description: "Sides per die"), MinValue(2), MaxValue(1000)] int sides = 6,
    [Summary(description: "How many dice"), MinValue(1), MaxValue(20)] int count = 1)
{
    var rolls = Enumerable.Range(0, count).Select(_ => Random.Shared.Next(1, sides + 1)).ToList();
    await RespondAsync($"🎲 {count}d{sides}: {string.Join(", ", rolls)} = **{rolls.Sum()}**");
}
```

## See also
- [Choices](07-Choices.md) · [Autocomplete](08-Autocomplete.md) · [Subcommands & Groups](06-Subcommands-and-Groups.md)
