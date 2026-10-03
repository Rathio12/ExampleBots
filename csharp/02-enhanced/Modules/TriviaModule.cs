using Discord;
using Discord.Interactions;
using EnhancedBot.Preconditions;
using EnhancedBot.Utils;

namespace EnhancedBot.Modules;

public sealed class TriviaModule : InteractionModuleBase<SocketInteractionContext>
{
    private sealed record Question(string Text, string[] Answers, int Correct);

    // A small built-in question bank. Want more? Load from JSON or the Open Trivia DB API.
    private static readonly Question[] Questions =
    [
        new("What year was Discord launched?", ["2013", "2015", "2017", "2019"], 1),
        new("Which library does this C# bot use?", ["discord.js", "discord.py", "Discord.Net", "discordgo"], 2),
        new("What is the maximum length of a slash command name?", ["16", "32", "64", "100"], 1),
        new("How many buttons fit in one action row?", ["3", "4", "5", "10"], 2),
        new("Which planet is known as the Red Planet?", ["Venus", "Mars", "Jupiter", "Mercury"], 1),
        new("What does HTTP status 429 mean?", ["Not Found", "Unauthorized", "Too Many Requests", "Server Error"], 2),
        new("How many seconds does a bot have to respond to an interaction?", ["1", "3", "10", "15"], 1),
    ];

    [SlashCommand("trivia", "Answer a random trivia question")]
    [Cooldown(10)]
    public async Task TriviaAsync()
    {
        var index = Random.Shared.Next(Questions.Length);
        var question = Questions[index];

        var menu = new SelectMenuBuilder()
            // Encode the question index so the handler knows which question this is.
            .WithCustomId($"trivia:{index}")
            .WithPlaceholder("Pick your answer…");
        for (var i = 0; i < question.Answers.Length; i++)
            menu.AddOption(question.Answers[i], i.ToString());

        var embed = Embeds.Base()
            .WithTitle("🧠 Trivia time!")
            .WithDescription($"**{question.Text}**\n\nEveryone can answer — only you will see your result.")
            .Build();
        await RespondAsync(embed: embed, components: new ComponentBuilder().WithSelectMenu(menu).Build());
    }

    // For select menus, the last parameter receives the chosen values.
    [ComponentInteraction("trivia:*")]
    public async Task AnswerAsync(string questionIndex, string[] selected)
    {
        var question = Questions[int.Parse(questionIndex)];
        var picked = int.Parse(selected[0]);
        var answer = question.Answers[question.Correct];

        var content = picked == question.Correct
            ? $"✅ Correct! The answer is **{answer}**."
            : $"❌ Not quite — you picked **{question.Answers[picked]}**. The answer is **{answer}**.";

        // Ephemeral: only this user sees whether they were right.
        await RespondAsync(content, ephemeral: true);
    }
}
