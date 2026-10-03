using System.Collections.Concurrent;
using Discord;
using EnhancedBot.Utils;

namespace EnhancedBot.Services;

public sealed class Poll(string question, string author)
{
    public string Question { get; } = question;
    public string Author { get; } = author;
    public HashSet<ulong> Yes { get; } = [];
    public HashSet<ulong> No { get; } = [];
}

/// <summary>
/// In-memory poll storage shared by the /poll command and the button handler.
/// Polls are lost on restart — the Expert bot shows how to persist data.
/// </summary>
public sealed class PollStore
{
    private readonly ConcurrentDictionary<string, Poll> _polls = new();

    public void Add(string id, Poll poll) => _polls[id] = poll;
    public Poll? Get(string id) => _polls.GetValueOrDefault(id);

    public static (Embed Embed, MessageComponent Components) Render(string id, Poll poll)
    {
        int total = poll.Yes.Count + poll.No.Count;
        int Percent(int count) => total == 0 ? 0 : (int)Math.Round(count * 100.0 / total);
        string Bar(int count) => new string('█', Percent(count) / 10).PadRight(10, '░');

        var embed = Embeds.Base()
            .WithTitle($"📊 {poll.Question}")
            .WithDescription(
                $"✅ **Yes** — {poll.Yes.Count} vote(s)\n`{Bar(poll.Yes.Count)}` {Percent(poll.Yes.Count)}%\n\n" +
                $"❌ **No** — {poll.No.Count} vote(s)\n`{Bar(poll.No.Count)}` {Percent(poll.No.Count)}%")
            .WithFooter($"Poll by {poll.Author} • {total} total vote(s) • click again to change your vote")
            .Build();

        // The custom ID carries the poll ID and the choice: "poll:<id>:yes".
        var components = new ComponentBuilder()
            .WithButton("Yes", $"poll:{id}:yes", ButtonStyle.Success, new Emoji("✅"))
            .WithButton("No", $"poll:{id}:no", ButtonStyle.Danger, new Emoji("❌"))
            .Build();

        return (embed, components);
    }
}
