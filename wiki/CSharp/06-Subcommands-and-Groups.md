# Subcommands & Groups

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key attribute** | `[Group("name", "description")]` |
| **Used in** | [03-expert TagModule.cs](../../csharp/03-expert/src/ExpertBot/Modules/TagModule.cs), [ReminderModule.cs](../../csharp/03-expert/src/ExpertBot/Modules/ReminderModule.cs), [SettingsModule.cs](../../csharp/03-expert/src/ExpertBot/Modules/SettingsModule.cs) |

Put `[Group]` on a module class and every `[SlashCommand]` inside becomes a subcommand.

## A group module

```csharp
[Group("tag", "Saved text snippets")]
[CommandContextType(InteractionContextType.Guild)]
public sealed class TagModule(TagRepository tags) : InteractionModuleBase<SocketInteractionContext>
{
    [SlashCommand("show", "Post a tag")]               // /tag show
    public async Task ShowAsync(string name) { … }

    [SlashCommand("create", "Create a tag")]           // /tag create
    public async Task CreateAsync(string name, string content) { … }

    [SlashCommand("list", "List all tags")]            // /tag list
    public async Task ListAsync() { … }
}
```

## Subcommand groups (nested modules)

```csharp
[Group("config", "Server configuration")]
public sealed class ConfigModule : InteractionModuleBase<SocketInteractionContext>
{
    [SlashCommand("view", "Show the configuration")]          // /config view
    public async Task ViewAsync() { … }

    [Group("logs", "Log channels")]
    public sealed class LogsModule : InteractionModuleBase<SocketInteractionContext>
    {
        [SlashCommand("set", "Set the log channel")]           // /config logs set
        public async Task SetAsync(ITextChannel channel) { … }

        [SlashCommand("disable", "Disable logging")]           // /config logs disable
        public async Task DisableAsync() { … }
    }
}
```

Nested classes are sub-modules. Depth is limited to group → subgroup → command.

## Permissions on groups

Attributes on the class apply to every subcommand:

```csharp
[Group("settings", "Configure the bot")]
[DefaultMemberPermissions(GuildPermission.ManageGuild)]
[CommandContextType(InteractionContextType.Guild)]
public sealed class SettingsModule : InteractionModuleBase<SocketInteractionContext> { … }
```

For one stricter subcommand, add a precondition on that method (`[RequireUserPermission(GuildPermission.ManageMessages)]`) or check `Context.Interaction.Permissions` at runtime.

## Component handlers inside groups

`[ComponentInteraction]` IDs are prefixed with the group name by default. Use `ignoreGroupNames: true` for global IDs:

```csharp
[ComponentInteraction("tag-delete:*", ignoreGroupNames: true)]
public async Task ConfirmDeleteAsync(string name) { … }
```

## See also
- [Slash Commands](04-Slash-Commands.md) · [Permissions](26-Permissions.md)
