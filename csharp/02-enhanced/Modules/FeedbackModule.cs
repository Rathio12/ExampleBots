using Discord;
using Discord.Interactions;
using EnhancedBot.Config;
using EnhancedBot.Preconditions;
using EnhancedBot.Services;
using EnhancedBot.Utils;

namespace EnhancedBot.Modules;

/// <summary>A modal is declared as a class; each property becomes a text input.</summary>
public sealed class FeedbackModal : IModal
{
    public string Title => "Send feedback";

    [InputLabel("Subject")]
    [ModalTextInput("subject", maxLength: 100)]
    public string Subject { get; set; } = "";

    [InputLabel("Your feedback")]
    [ModalTextInput("message", TextInputStyle.Paragraph, "What do you like? What could be better?", minLength: 10, maxLength: 1000)]
    public string Message { get; set; } = "";
}

public sealed class FeedbackModule(BotConfig config) : InteractionModuleBase<SocketInteractionContext>
{
    [SlashCommand("feedback", "Send feedback to the server team")]
    [Cooldown(60)]
    public async Task FeedbackAsync()
    {
        // Showing a modal IS the response — you cannot defer before it.
        await RespondWithModalAsync<FeedbackModal>("feedback");
    }

    [ModalInteraction("feedback")]
    public async Task OnSubmitAsync(FeedbackModal modal)
    {
        await Logger.Info("Feedback", $"From {Context.User.Username}: {modal.Subject}");

        if (config.FeedbackChannelId is { } channelId && Context.Client.GetChannel(channelId) is IMessageChannel channel)
        {
            var embed = Embeds.Base()
                .WithTitle($"💡 {modal.Subject}")
                .WithDescription(modal.Message)
                .WithAuthor(Context.User.Username, Context.User.GetDisplayAvatarUrl())
                .WithFooter($"User ID: {Context.User.Id}")
                .Build();
            await channel.SendMessageAsync(embed: embed);
        }

        await RespondAsync("🙏 Thanks! Your feedback was sent.", ephemeral: true);
    }
}
