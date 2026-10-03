using System.Text.RegularExpressions;
using Discord;
using Discord.Interactions;
using ExpertBot.Data;
using ExpertBot.Utils;
using Microsoft.Extensions.DependencyInjection;

namespace ExpertBot.Modules;

/// <summary>
/// Supplies autocomplete suggestions while the user types a tag name.
/// Must answer within 3 seconds with up to 25 choices.
/// </summary>
public sealed class TagNameAutocomplete : AutocompleteHandler
{
    public override async Task<AutocompletionResult> GenerateSuggestionsAsync(
        IInteractionContext context, IAutocompleteInteraction autocompleteInteraction, IParameterInfo parameter, IServiceProvider services)
    {
        var tags = services.GetRequiredService<TagRepository>();
        var current = autocompleteInteraction.Data.Current.Value?.ToString()?.ToLowerInvariant() ?? "";
        var names = await tags.SearchAsync(context.Guild.Id, current, 25);
        return AutocompletionResult.FromSuccess(names.Select(n => new AutocompleteResult(n, n)));
    }
}

[Group("tag", "Saved text snippets for this server")]
[CommandContextType(InteractionContextType.Guild)]
public sealed partial class TagModule(TagRepository tags) : InteractionModuleBase<SocketInteractionContext>
{
    [GeneratedRegex("^[a-z0-9_-]{1,32}$")]
    private static partial Regex NamePattern();

    [SlashCommand("show", "Post a tag")]
    public async Task ShowAsync([Autocomplete(typeof(TagNameAutocomplete))] string name)
    {
        name = name.ToLowerInvariant();
        if (await tags.GetAsync(Context.Guild.Id, name) is not { } tag)
        {
            await RespondAsync($"❌ No tag named `{name}`.", ephemeral: true);
            return;
        }
        await tags.UseAsync(Context.Guild.Id, name);
        // Tags are user content: never let them ping anyone.
        await RespondAsync(tag.Content, allowedMentions: AllowedMentions.None);
    }

    [SlashCommand("create", "Create a tag")]
    public async Task CreateAsync(
        [Summary(description: "Lowercase letters, numbers, - and _"), MaxLength(32)] string name,
        [Summary(description: "What the tag says"), MaxLength(2000)] string content)
    {
        name = name.ToLowerInvariant();
        if (!NamePattern().IsMatch(name))
        {
            await RespondAsync("❌ Names may only contain `a-z`, `0-9`, `-` and `_`.", ephemeral: true);
            return;
        }
        var created = await tags.CreateAsync(Context.Guild.Id, name, content, Context.User.Id);
        await RespondAsync(created ? $"✅ Created tag `{name}`." : $"❌ A tag named `{name}` already exists.", ephemeral: true);
    }

    [SlashCommand("delete", "Delete a tag (author or Manage Messages)")]
    public async Task DeleteAsync([Autocomplete(typeof(TagNameAutocomplete))] string name)
    {
        name = name.ToLowerInvariant();
        if (await tags.GetAsync(Context.Guild.Id, name) is not { } tag)
        {
            await RespondAsync($"❌ No tag named `{name}`.", ephemeral: true);
            return;
        }

        var canManage = Context.Interaction.Permissions.ManageMessages;
        if (tag.AuthorId != Context.User.Id && !canManage)
        {
            await RespondAsync("❌ You can only delete your own tags.", ephemeral: true);
            return;
        }
        await tags.RemoveAsync(Context.Guild.Id, name);
        await RespondAsync($"🗑️ Deleted tag `{name}`.", ephemeral: true);
    }

    [SlashCommand("list", "List all tags")]
    public async Task ListAsync()
    {
        var rows = await tags.ListAsync(Context.Guild.Id);
        var text = string.Join(", ", rows.Select(r => $"`{r.Name}` ({r.Uses})"));
        var embed = Display.Embed(Display.Info)
            .WithTitle($"🏷️ Tags ({rows.Count})")
            .WithDescription(text.Length > 0 ? Display.Truncate(text, 4000) : "No tags yet. Create one with `/tag create`.")
            .Build();
        await RespondAsync(embed: embed, ephemeral: true);
    }
}
