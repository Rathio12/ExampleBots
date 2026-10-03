using Discord;
using Discord.Interactions;
using ExpertBot.Data;
using ExpertBot.Utils;

namespace ExpertBot.Modules;

[Group("settings", "Configure the bot for this server")]
[CommandContextType(InteractionContextType.Guild)]
[DefaultMemberPermissions(GuildPermission.ManageGuild)]
public sealed class SettingsModule(SettingsRepository settings) : InteractionModuleBase<SocketInteractionContext>
{
    private async Task<bool> CheckChannelAsync(ITextChannel channel)
    {
        var perms = Context.Guild.CurrentUser.GetPermissions(channel);
        var missing = new List<string>();
        if (!perms.ViewChannel) missing.Add("View Channel");
        if (!perms.SendMessages) missing.Add("Send Messages");
        if (!perms.EmbedLinks) missing.Add("Embed Links");
        if (!perms.AttachFiles) missing.Add("Attach Files");
        if (missing.Count == 0) return true;

        await RespondAsync($"❌ I need these permissions in {channel.Mention}: {string.Join(", ", missing)}", ephemeral: true);
        return false;
    }

    [SlashCommand("modlog", "Set (or clear) the moderation log channel")]
    public async Task ModlogAsync([Summary(description: "Leave empty to disable"), ChannelTypes(ChannelType.Text)] ITextChannel? channel = null)
    {
        if (channel is not null && !await CheckChannelAsync(channel)) return;
        await settings.SetModlogChannelAsync(Context.Guild.Id, channel?.Id);
        await RespondAsync(channel is null ? "✅ Mod log disabled." : $"✅ Mod log will be sent to {channel.Mention}.", ephemeral: true);
    }

    [SlashCommand("auditlog", "Set (or clear) the audit log channel (edits, deletes, joins, roles…)")]
    public async Task AuditlogAsync([Summary(description: "Leave empty to disable"), ChannelTypes(ChannelType.Text)] ITextChannel? channel = null)
    {
        if (channel is not null && !await CheckChannelAsync(channel)) return;
        await settings.SetAuditlogChannelAsync(Context.Guild.Id, channel?.Id);
        await RespondAsync(channel is null ? "✅ Audit log disabled." : $"✅ Audit log will be sent to {channel.Mention}.", ephemeral: true);
    }

    [SlashCommand("view", "Show current settings")]
    public async Task ViewAsync()
    {
        var current = await settings.GetAsync(Context.Guild.Id);
        static string Show(ulong? id) => id is { } c ? $"<#{c}>" : "*not set*";

        var embed = Display.Embed()
            .WithTitle("⚙️ Settings")
            .AddField("Mod log", Show(current.ModlogChannelId), inline: true)
            .AddField("Audit log", Show(current.AuditlogChannelId), inline: true)
            .Build();
        await RespondAsync(embed: embed, ephemeral: true);
    }
}
