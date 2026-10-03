using Discord.Interactions;
using ExpertBot.Data;
using ExpertBot.Utils;

namespace ExpertBot.Modules;

/// <summary>[Group] turns the module into "/remind create|list|delete".</summary>
[Group("remind", "Reminders that survive bot restarts")]
public sealed class ReminderModule(ReminderRepository reminders) : InteractionModuleBase<SocketInteractionContext>
{
    private const long MaxSeconds = 365 * 86_400;
    private const int MaxPerUser = 25;

    [SlashCommand("create", "Create a reminder")]
    public async Task CreateAsync(
        [Summary("in", "When? e.g. 10m, 2h, 1d12h, 2w")] string when,
        [Summary(description: "What should I remind you about?"), MaxLength(1000)] string message)
    {
        if (Duration.Parse(when) is not { } seconds || seconds > MaxSeconds)
        {
            await RespondAsync("❌ Use a duration like `30m`, `2h`, `1d` (max 365d).", ephemeral: true);
            return;
        }
        if (await reminders.CountForUserAsync(Context.User.Id) >= MaxPerUser)
        {
            await RespondAsync($"❌ You already have {MaxPerUser} reminders.", ephemeral: true);
            return;
        }

        var remindAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds() + seconds;
        var id = await reminders.AddAsync(Context.User.Id, Context.Channel.Id, message, remindAt);
        await RespondAsync($"⏰ Reminder **#{id}** set for {Display.Time(remindAt, 'f')} (in {Duration.Format(seconds)}).", ephemeral: true);
    }

    [SlashCommand("list", "List your reminders")]
    public async Task ListAsync()
    {
        var rows = await reminders.ListForUserAsync(Context.User.Id);
        var lines = rows.Select(r => $"**#{r.Id}** • {Display.Time(r.RemindAt)} — {Display.Truncate(r.Message, 80)}");
        var embed = Display.Embed(Display.Info)
            .WithTitle("⏰ Your reminders")
            .WithDescription(rows.Count > 0 ? string.Join('\n', lines) : "You have no reminders.")
            .Build();
        await RespondAsync(embed: embed, ephemeral: true);
    }

    [SlashCommand("delete", "Delete one of your reminders")]
    public async Task DeleteAsync([Summary("id", "Reminder ID from /remind list")] long id)
    {
        var removed = await reminders.RemoveForUserAsync(id, Context.User.Id);
        await RespondAsync(removed ? $"🗑️ Deleted reminder #{id}." : $"❌ You have no reminder #{id}.", ephemeral: true);
    }
}
