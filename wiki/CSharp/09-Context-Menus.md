# Context Menus

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key attributes** | `[UserCommand("Name")]`, `[MessageCommand("Name")]` |
| **Used in** | [03-expert LevelingModule.cs](../../csharp/03-expert/src/ExpertBot/Modules/LevelingModule.cs) (Show Rank) · [UtilityModule.cs](../../csharp/03-expert/src/ExpertBot/Modules/UtilityModule.cs) (Bookmark) |

## User context menu

```csharp
[UserCommand("Show Avatar")]
public async Task ShowAvatarAsync(IUser user) =>
    await RespondAsync(user.GetDisplayAvatarUrl(size: 1024), ephemeral: true);
```

## Message context menu

```csharp
[MessageCommand("Bookmark")]
public async Task BookmarkAsync(IMessage message)
{
    await Context.User.SendMessageAsync($"🔖 {message.GetJumpUrl()}\n{message.Content}");
    await RespondAsync("Sent to your DMs!", ephemeral: true);
}
```

Context menus are registered by the same `RegisterCommandsToGuildAsync` / `RegisterCommandsGloballyAsync` calls as slash commands, and listed in `interactions.ContextCommands`.

## With permissions

```csharp
[UserCommand("Quick Timeout")]
[DefaultMemberPermissions(GuildPermission.ModerateMembers)]
[CommandContextType(InteractionContextType.Guild)]
public async Task QuickTimeoutAsync(IUser user)
{
    if (user is not SocketGuildUser member) return;
    await member.SetTimeOutAsync(TimeSpan.FromMinutes(10));
    await RespondAsync($"Timed out {member.Mention} for 10 minutes.", ephemeral: true);
}
```

## Opening a modal

```csharp
[MessageCommand("Report Message")]
public async Task ReportAsync(IMessage message) =>
    await RespondWithModalAsync<ReportModal>($"report:{message.Channel.Id}:{message.Id}");
```

## Rules

- Names can contain spaces and capitals. No description, no options.
- Only a few per type per app.

## See also
- [Slash Commands](04-Slash-Commands.md) · [Modals](14-Modals.md)
