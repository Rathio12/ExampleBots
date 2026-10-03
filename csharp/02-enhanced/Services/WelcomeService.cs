using Discord;
using Discord.WebSocket;
using EnhancedBot.Config;
using EnhancedBot.Utils;

namespace EnhancedBot.Services;

/// <summary>Welcomes new members. Requires the privileged GuildMembers intent.</summary>
public sealed class WelcomeService(DiscordSocketClient client, BotConfig config)
{
    public void Initialize()
    {
        if (config.WelcomeChannelId is null) return;
        client.UserJoined += OnUserJoinedAsync;
    }

    private async Task OnUserJoinedAsync(SocketGuildUser member)
    {
        // Ignore joins from other servers the bot is in.
        if (member.Guild.GetTextChannel(config.WelcomeChannelId!.Value) is not { } channel) return;

        var embed = Embeds.Base(Embeds.Success)
            .WithTitle($"👋 Welcome to {member.Guild.Name}!")
            .WithDescription($"Hey {member.Mention}, glad you're here! You are member **#{member.Guild.MemberCount}**.")
            .WithThumbnailUrl(member.GetDisplayAvatarUrl(size: 256))
            .AddField("Account created", Embeds.Relative(member.CreatedAt))
            .Build();

        try
        {
            await channel.SendMessageAsync(embed: embed);
        }
        catch (Exception ex)
        {
            await Logger.Warn("Welcome", "Failed to send welcome message", ex);
        }
    }
}
