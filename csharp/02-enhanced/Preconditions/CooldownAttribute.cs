using System.Collections.Concurrent;
using Discord;
using Discord.Interactions;

namespace EnhancedBot.Preconditions;

/// <summary>
/// A custom precondition: limits how often each user can run a command.
/// Usage: put <c>[Cooldown(10)]</c> above a command method.
/// Preconditions run before the command; returning an error stops it.
/// </summary>
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
