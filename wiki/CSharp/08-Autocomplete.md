# Autocomplete

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key APIs** | `AutocompleteHandler`, `[Autocomplete(typeof(…))]`, `AutocompletionResult`, `AutocompleteResult` |
| **Used in** | [03-expert TagModule.cs](../../csharp/03-expert/src/ExpertBot/Modules/TagModule.cs) |

## An autocomplete handler

```csharp
public sealed class TagNameAutocomplete : AutocompleteHandler
{
    public override async Task<AutocompletionResult> GenerateSuggestionsAsync(
        IInteractionContext context,
        IAutocompleteInteraction autocompleteInteraction,
        IParameterInfo parameter,
        IServiceProvider services)
    {
        var tags = services.GetRequiredService<TagRepository>();                       // DI works here
        var current = autocompleteInteraction.Data.Current.Value?.ToString() ?? "";   // text typed so far
        var names = await tags.SearchAsync(context.Guild.Id, current.ToLowerInvariant(), 25);
        return AutocompletionResult.FromSuccess(names.Select(n => new AutocompleteResult(n, n)));   // (label, value)
    }
}
```

## Attaching it to a parameter

```csharp
[SlashCommand("show", "Post a tag")]
public async Task ShowAsync([Autocomplete(typeof(TagNameAutocomplete))] string name)
{
    if (await tags.GetAsync(Context.Guild.Id, name.ToLowerInvariant()) is not { } tag)   // always validate!
    {
        await RespondAsync("No such tag.", ephemeral: true);
        return;
    }
    await RespondAsync(tag.Content);
}
```

Autocomplete interactions are routed by the same `ExecuteCommandAsync` call as everything else. No extra wiring is needed (autocomplete handlers are enabled by default).

## Reading other options

```csharp
var country = autocompleteInteraction.Data.Options.FirstOrDefault(o => o.Name == "country")?.Value as string;
```

## Inline autocomplete without a handler class

```csharp
[AutocompleteCommand("fruit", "pick")]
public async Task FruitAutocompleteAsync()
{
    var current = ((SocketAutocompleteInteraction)Context.Interaction).Data.Current.Value?.ToString() ?? "";
    var fruits = new[] { "Apple", "Banana", "Cherry" }.Where(f => f.Contains(current, StringComparison.OrdinalIgnoreCase));
    await ((SocketAutocompleteInteraction)Context.Interaction).RespondAsync(fruits.Select(f => new AutocompleteResult(f, f)));
}

[SlashCommand("pick", "Pick a fruit")]
public async Task PickAsync([Autocomplete] string fruit) => await RespondAsync(fruit);
```

The handler-class approach is usually cleaner and reusable.

## Rules

- Max 25 results, answer within 3 seconds.
- Users can submit any text, so validate in the command.
- Escape `%`/`_` when using the text in SQL `LIKE`.

## See also
- [Choices](07-Choices.md) · [SQLite Database](37-SQLite-Database.md)
