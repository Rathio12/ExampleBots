# Reactions

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key APIs** | `AddReactionAsync`, `GetReactionUsersAsync`, `RemoveReactionAsync`, `ReactionAdded`, `Emoji`, `Emote` |
| **Intents** | `GuildMessageReactions` |

## Emoji types

```csharp
var unicode = new Emoji("👍");
var custom = Emote.Parse("<:pepe:123456789012345678>");
```

## Adding reactions

```csharp
await message.AddReactionAsync(new Emoji("👍"));
await userMessage.AddReactionsAsync([new Emoji("1️⃣"), new Emoji("2️⃣"), new Emoji("3️⃣")]);   // extension on IUserMessage, adds in order
```

## Reading reactions

```csharp
foreach (var (emote, metadata) in message.Reactions)
    Console.WriteLine($"{emote.Name}: {metadata.ReactionCount}");

var users = await message.GetReactionUsersAsync(new Emoji("👍"), 100).FlattenAsync();
```

## Removing

```csharp
await message.RemoveReactionAsync(new Emoji("👍"), user);       // others' reactions need Manage Messages
await message.RemoveAllReactionsForEmoteAsync(new Emoji("👍"));
await message.RemoveAllReactionsAsync();
```

## Events

```csharp
client.ReactionAdded += async (cachedMessage, cachedChannel, reaction) =>
{
    if (reaction.UserId == client.CurrentUser.Id) return;
    var message = await cachedMessage.GetOrDownloadAsync();     // works for uncached messages too
    Console.WriteLine($"{reaction.UserId} reacted {reaction.Emote.Name} on {message.Id}");
};

client.ReactionRemoved += async (cachedMessage, cachedChannel, reaction) => { /* … */ };
```

`Cacheable<T, TId>` carries the ID always and the object when cached. `GetOrDownloadAsync()` fetches it if needed.

## Reaction roles (classic)

```csharp
var rolesByEmoji = new Dictionary<string, ulong> { ["🎮"] = 111111111111111111, ["🎨"] = 222222222222222222 };

client.ReactionAdded += async (msg, channel, reaction) =>
{
    if (msg.Id != RoleMessageId || !rolesByEmoji.TryGetValue(reaction.Emote.Name, out var roleId)) return;
    if (reaction.User.IsSpecified && reaction.User.Value is SocketGuildUser member)
        await member.AddRoleAsync(roleId);
};
```

Buttons or role selects are a better UX for new bots ([recipe](../Use-Case-Recipes.md#self-assignable-roles)).

## See also
- [Events](28-Events.md) · [Use-Case Recipes → Starboard](../Use-Case-Recipes.md#starboard)
