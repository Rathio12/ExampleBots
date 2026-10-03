using Discord.Interactions;
using Discord.WebSocket;
using EnhancedBot.Preconditions;
using EnhancedBot.Services;

namespace EnhancedBot.Modules;

public sealed class PollModule(PollStore polls) : InteractionModuleBase<SocketInteractionContext>
{
    [SlashCommand("poll", "Start a yes/no poll with buttons")]
    [Cooldown(30)]
    public async Task PollAsync([Summary(description: "What should people vote on?"), MaxLength(200)] string question)
    {
        // The interaction ID is unique — perfect as a poll ID.
        var id = Context.Interaction.Id.ToString();
        var poll = new Poll(question, Context.User.Username);
        polls.Add(id, poll);

        var (embed, components) = PollStore.Render(id, poll);
        await RespondAsync(embed: embed, components: components);
    }

    // "*" are wildcards: "poll:123:yes" calls this with pollId = "123", choice = "yes".
    [ComponentInteraction("poll:*:*")]
    public async Task VoteAsync(string pollId, string choice)
    {
        var poll = polls.Get(pollId);
        if (poll is null)
        {
            await RespondAsync("⌛ This poll has expired (the bot restarted).", ephemeral: true);
            return;
        }

        var userId = Context.User.Id;
        var (chosen, other) = choice == "yes" ? (poll.Yes, poll.No) : (poll.No, poll.Yes);
        lock (poll)
        {
            // Clicking the same button twice removes your vote; the other button switches it.
            if (!chosen.Remove(userId))
            {
                chosen.Add(userId);
                other.Remove(userId);
            }
        }

        var (embed, components) = PollStore.Render(pollId, poll);
        // UpdateAsync edits the message the button belongs to.
        await ((SocketMessageComponent)Context.Interaction).UpdateAsync(message =>
        {
            message.Embed = embed;
            message.Components = components;
        });
    }
}
