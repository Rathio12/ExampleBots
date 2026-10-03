using Discord.Interactions;
using EnhancedBot.Config;
using EnhancedBot.Preconditions;
using EnhancedBot.Services;
using EnhancedBot.Utils;

namespace EnhancedBot.Modules;

public sealed class GameServerModule(MinecraftService minecraft, BotConfig config) : InteractionModuleBase<SocketInteractionContext>
{
    [SlashCommand("players", "Show the live player count of a Minecraft server")]
    [Cooldown(10)]
    public async Task PlayersAsync(
        [Summary("address", "Server address (default: the configured server)"), MaxLength(100)] string? address = null)
    {
        address ??= config.GameServerAddress;
        if (address is null)
        {
            await RespondAsync("Please provide an `address` — no default server is configured.");
            return;
        }

        // HTTP calls can exceed Discord's 3-second limit, so defer first.
        await DeferAsync();

        ServerStatus status;
        try
        {
            status = await minecraft.GetStatusAsync(address);
        }
        catch (Exception ex)
        {
            await FollowupAsync($"⚠️ Could not reach the status API: {ex.Message}");
            return;
        }

        if (!status.Online)
        {
            await FollowupAsync(embed: Embeds.Base(Embeds.Danger).WithTitle($"🔴 {address} is offline").Build());
            return;
        }

        var names = status.PlayerNames.Count > 0
            ? string.Join(", ", status.PlayerNames.Take(20)) + (status.PlayerNames.Count > 20 ? " …" : "")
            : status.Players > 0 ? "*Player list hidden by the server*" : "*Nobody online*";

        var embed = Embeds.Base(Embeds.Success)
            .WithTitle($"🟢 {address}")
            .WithDescription(status.Motd.Length > 0 ? $"```\n{status.Motd}\n```" : null)
            .AddField("👥 Players", $"{status.Players}/{status.MaxPlayers}", inline: true)
            .AddField("🧩 Version", status.Version, inline: true)
            .AddField("📋 Online now", names)
            .Build();
        await FollowupAsync(embed: embed);
    }
}
