# Slash Commands

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[C# portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key classes** | `InteractionService`, `InteractionModuleBase<T>`, `[SlashCommand]`, `SlashCommandBuilder` |
| **Used in** | [01-basic](../../csharp/01-basic/Program.cs) (builder) · [02-enhanced Modules/](../../csharp/02-enhanced/Modules) (InteractionService) |

Discord.Net offers two approaches:

| | Builders + `SlashCommandExecuted` | **InteractionService** (recommended) |
|---|---|---|
| Definition | `SlashCommandBuilder` | `[SlashCommand]` methods in modules |
| Options | Manual | Method parameters |
| Components/modals | Manual routing | `[ComponentInteraction]`, `[ModalInteraction]` |
| DI | DIY | Built in |
| Used in | Basic bot | Enhanced & Expert bots |

## Approach 1: builders (Basic bot)

```csharp
client.Ready += async () =>
{
    var roll = new SlashCommandBuilder()
        .WithName("roll")
        .WithDescription("Roll a die")
        .AddOption(new SlashCommandOptionBuilder()
            .WithName("sides").WithDescription("Sides").WithType(ApplicationCommandOptionType.Integer)
            .WithMinValue(2).WithMaxValue(1000))
        .Build();

    await client.Rest.BulkOverwriteGuildCommands([roll], guildId);   // or BulkOverwriteGlobalApplicationCommandsAsync
};

client.SlashCommandExecuted += async command =>
{
    if (command.CommandName != "roll") return;
    var sides = (long?)command.Data.Options.FirstOrDefault(o => o.Name == "sides")?.Value ?? 6;
    await command.RespondAsync($"🎲 {Random.Shared.NextInt64(1, sides + 1)}");
};
```

## Approach 2: InteractionService

### A module

```csharp
using Discord.Interactions;

public sealed class GeneralModule : InteractionModuleBase<SocketInteractionContext>
{
    [SlashCommand("ping", "Check the bot latency")]
    public async Task PingAsync() =>
        await RespondAsync($"🏓 {Context.Client.Latency}ms");

    [SlashCommand("hello", "Say hello")]
    public async Task HelloAsync() =>
        await RespondAsync($"👋 Hi {Context.User.Mention}!");
}
```

- Modules are **public, non-static classes** deriving from `InteractionModuleBase<SocketInteractionContext>`.
- A new instance is created per interaction. Constructor parameters come from DI.
- `Context` gives you `Client`, `Guild`, `Channel`, `User`, `Interaction`.

### Wiring it up

```csharp
var interactions = new InteractionService(client, new InteractionServiceConfig { UseCompiledLambda = true });

await interactions.AddModulesAsync(Assembly.GetEntryAssembly(), services);   // discover modules

client.Ready += async () =>
{
    if (guildId is { } id) await interactions.RegisterCommandsToGuildAsync(id);   // instant
    else await interactions.RegisterCommandsGloballyAsync();                       // up to ~1 h
};

client.InteractionCreated += async interaction =>
{
    var context = new SocketInteractionContext(client, interaction);
    await interactions.ExecuteCommandAsync(context, services);
};
```

That single `InteractionCreated` handler routes slash commands, context menus, autocomplete, buttons, selects and modals.

## Common attributes

| Attribute | Purpose |
|---|---|
| `[SlashCommand("name", "description")]` | Define a command |
| `[Summary("name", "description")]` on a parameter | Option name/description |
| `[DefaultMemberPermissions(GuildPermission.X)]` | Hide from members without the permission |
| `[CommandContextType(InteractionContextType.Guild)]` | Where it can be used |
| `[IntegrationType(ApplicationIntegrationType.GuildInstall, ...)]` | Server- or user-installed |
| `[RequireUserPermission(...)]`, `[RequireBotPermission(...)]` | Runtime checks (preconditions) |
| `[Group("name", "description")]` on a class | Subcommands ([article](06-Subcommands-and-Groups.md)) |
| `[NsfwCommand(true)]` | Age-restricted channels only |
| `[DontAutoRegister]` | Exclude from automatic registration |

## Registration methods

| Method | Effect |
|---|---|
| `RegisterCommandsToGuildAsync(guildId)` | Overwrite this guild's commands with all modules |
| `RegisterCommandsGloballyAsync()` | Overwrite global commands |
| `AddModulesToGuildAsync(guild, deleteMissing, modules)` | Register specific modules to a guild |

All overwrite the full list (`deleteMissing: true` by default), so removed commands disappear.

## Useful Context members

| Member | Meaning |
|---|---|
| `Context.User` | Invoking user (`SocketGuildUser` in guilds) |
| `Context.Guild` | `SocketGuild` or null |
| `Context.Channel` | `ISocketMessageChannel` |
| `Context.Interaction` | The raw `SocketInteraction` |
| `Context.Interaction.Permissions` | User's permissions in this channel |
| `Context.Interaction.UserLocale` | User's language |

## See also
- [Command Options](05-Command-Options.md) · [Responding to Interactions](10-Responding-to-Interactions.md) · [Project Structure](38-Project-Structure.md)
