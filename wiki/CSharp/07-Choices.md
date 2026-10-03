# Choices

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[C# portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key APIs** | `[Choice]`, enums, `[ChoiceDisplay]` |
| **Used in** | [03-expert ModerationModule.cs](../../csharp/03-expert/src/ExpertBot/Modules/ModerationModule.cs) (`DeleteMessages` enum) |

## Enums (cleanest)

Every enum parameter becomes a dropdown automatically:

```csharp
public enum DeleteMessages
{
    [ChoiceDisplay("Don't delete any")] None = 0,
    [ChoiceDisplay("Previous 24 hours")] Day = 1,
    [ChoiceDisplay("Previous 7 days")] Week = 7,
}

[SlashCommand("ban", "Ban a user")]
public async Task BanAsync(IUser user, DeleteMessages deleteMessages = DeleteMessages.None)
{
    await Context.Guild.AddBanAsync(user, (int)deleteMessages);   // the enum value is the number of days
}
```

`[ChoiceDisplay]` sets the label users see. Without it, the member name is shown.

## `[Choice]` attributes

```csharp
[SlashCommand("rps", "Rock, paper, scissors")]
public async Task RpsAsync(
    [Choice("Rock 🪨", "rock"), Choice("Paper 📄", "paper"), Choice("Scissors ✂️", "scissors")] string choice)
{
    await RespondAsync($"You picked {choice}");
}

[SlashCommand("delay", "Pick a delay")]
public async Task DelayAsync([Choice("1 minute", 60), Choice("1 hour", 3600)] int seconds) { … }
```

## Choices vs autocomplete

| | Choices | Autocomplete |
|---|---|---|
| Values | Fixed at registration | Computed live |
| Max | 25 | 25 shown at a time |
| Validation | Discord enforces it | You must validate |

## See also
- [Autocomplete](08-Autocomplete.md) · [Command Options](05-Command-Options.md)
