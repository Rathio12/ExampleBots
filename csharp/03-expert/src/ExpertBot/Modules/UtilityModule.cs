using Discord;
using Discord.Interactions;
using ExpertBot.Utils;

namespace ExpertBot.Modules;

[CommandContextType(InteractionContextType.Guild)]
public sealed class UtilityModule : InteractionModuleBase<SocketInteractionContext>
{
    // A MESSAGE context menu: right-click a message → Apps → "Bookmark".
    [MessageCommand("Bookmark")]
    public async Task BookmarkAsync(IMessage message)
    {
        var embed = Display.Embed(Display.Info)
            .WithAuthor(message.Author.Username, message.Author.GetDisplayAvatarUrl())
            .WithDescription(Display.Truncate(message.Content, 4000) is { Length: > 0 } text ? text : "*No text content*")
            .AddField("Source", $"[Jump to message]({message.GetJumpUrl()}) in <#{message.Channel.Id}>");

        var image = message.Attachments.FirstOrDefault(a => a.ContentType?.StartsWith("image/") == true);
        if (image is not null) embed.WithImageUrl(image.Url);

        try
        {
            await Context.User.SendMessageAsync("🔖 Bookmarked message:", embed: embed.Build());
            await RespondAsync("🔖 Sent to your DMs!", ephemeral: true);
        }
        catch
        {
            await RespondAsync("❌ I could not DM you — check your privacy settings.", ephemeral: true);
        }
    }
}
