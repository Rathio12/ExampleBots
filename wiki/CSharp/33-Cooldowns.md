# Cooldowns

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key type** | `PreconditionAttribute` |
| **Used in** | [02-enhanced CooldownAttribute.cs](../../csharp/02-enhanced/Preconditions/CooldownAttribute.cs) |

InteractionService has no built-in cooldown, but a **precondition** adds one in a few lines and makes it reusable as an attribute.

## A cooldown precondition

```csharp
[AttributeUsage(AttributeTargets.Method)]
public sealed class CooldownAttribute(int seconds) : PreconditionAttribute
{
    private static readonly ConcurrentDictionary<string, DateTimeOffset> Expiry = new();

    public override Task<PreconditionResult> CheckRequirementsAsync(
        IInteractionContext context, ICommandInfo commandInfo, IServiceProvider services)
    {
        var key = $"{commandInfo.Name}:{context.User.Id}";
        var now = DateTimeOffset.UtcNow;

        if (Expiry.TryGetValue(key, out var until) && until > now)
        {
            var wait = Math.Ceiling((until - now).TotalSeconds);
            return Task.FromResult(PreconditionResult.FromError($"⏳ Slow down! Try again in {wait}s."));
        }

        Expiry[key] = now.AddSeconds(seconds);
        return Task.FromResult(PreconditionResult.FromSuccess());
    }
}
```

## Using it

```csharp
[SlashCommand("poll", "Start a poll")]
[Cooldown(30)]
public async Task PollAsync(string question) { … }
```

The error message reaches the user through your `InteractionExecuted` handler (`InteractionCommandError.UnmetPrecondition` → `result.ErrorReason`).

Live countdown text: `$"<t:{until.ToUnixTimeSeconds()}:R>"`.

## Variations

| Scope | Key |
|---|---|
| Per user, per command | `$"{commandInfo.Name}:{context.User.Id}"` |
| Per guild | `$"{commandInfo.Name}:{context.Guild?.Id}"` |
| Per channel | `$"{commandInfo.Name}:{context.Channel.Id}"` |
| Global per user | `context.User.Id.ToString()` |

### Moderators bypass

```csharp
if (context.User is IGuildUser { GuildPermissions.ManageMessages: true })
    return Task.FromResult(PreconditionResult.FromSuccess());
```

## Memory cleanup

For busy bots, remove expired entries occasionally (e.g. in a `BackgroundService`), or use `IMemoryCache` with absolute expiration.

## Persistent cooldowns

Daily rewards and similar limits belong in the database: store the last claim timestamp and compare.

## See also
- [Error Handling](34-Error-Handling.md) · [Permissions](26-Permissions.md)
