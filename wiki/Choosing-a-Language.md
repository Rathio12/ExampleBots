# Choosing a Language

All three languages can build any bot. Pick the one you already know. If you know none, read on.

## At a glance

| | JavaScript | Python | C# |
|---|---|---|---|
| Library | [discord.js](https://discord.js.org) v14 | [discord.py](https://discordpy.readthedocs.io) 2.x | [Discord.Net](https://docs.discordnet.dev) 3.x |
| Runtime | Node.js 20+ | Python 3.10+ | .NET 10 |
| Typing | Dynamic (TypeScript optional) | Dynamic with type hints | Static, compiled |
| Command style | Builder objects + handler files | Decorators on functions | Attributes on methods |
| Learning curve | Low | Lowest | Medium |
| Community size | Largest | Very large | Smaller, very helpful |
| Best at | Fast iteration, huge ecosystem | Readability, data/AI integrations | Large codebases, performance, tooling |
| Package manager | npm | pip | NuGet |

## The same command in each language

**JavaScript (discord.js)**

```js
new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Roll a die')
  .addIntegerOption((o) => o.setName('sides').setDescription('Sides').setMinValue(2).setMaxValue(1000));

// handler
const sides = interaction.options.getInteger('sides') ?? 6;
await interaction.reply(`🎲 ${Math.floor(Math.random() * sides) + 1}`);
```

**Python (discord.py)**

```python
@client.tree.command(description="Roll a die")
async def roll(interaction: discord.Interaction, sides: app_commands.Range[int, 2, 1000] = 6):
    await interaction.response.send_message(f"🎲 {random.randint(1, sides)}")
```

**C# (Discord.Net)**

```csharp
[SlashCommand("roll", "Roll a die")]
public async Task RollAsync([MinValue(2), MaxValue(1000)] int sides = 6) =>
    await RespondAsync($"🎲 {Random.Shared.Next(1, sides + 1)}");
```

Python and C# derive the command definition from the function signature. JavaScript keeps definition and handler separate, which is more verbose but very explicit.

## Recommendations

- **Complete beginner?** Python. It's the least ceremony, and the type hints double as command options.
- **Know web development?** JavaScript. You already know `async/await`, npm and JSON.
- **Coming from Unity, ASP.NET or Java?** C#. Dependency injection and the Generic Host will feel like home.
- **Building something big with a team?** C# or TypeScript (discord.js works great with TypeScript).
- **Want to plug in AI/data libraries?** Python.

## Other languages

Discord has libraries for almost every language: JDA (Java), Kord (Kotlin), serenity/twilight (Rust), discordgo/arikawa (Go), discordrb (Ruby), DPP (C++), Nostrum (Elixir). The concepts in this wiki (intents, interactions, the 3-second rule, custom IDs, permissions) apply to all of them.
