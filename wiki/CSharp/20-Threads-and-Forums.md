# Threads & Forums

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key types** | `IThreadChannel`, `SocketThreadChannel`, `SocketForumChannel`, `ThreadType`, `ThreadArchiveDuration` |
| **Permissions** | Create Public/Private Threads, Send Messages in Threads, Manage Threads |

## Creating threads

```csharp
var text = (SocketTextChannel)Context.Channel;

// From a message
var fromMessage = await text.CreateThreadAsync("Discussion", ThreadType.PublicThread, ThreadArchiveDuration.OneDay, message);

// Standalone public thread
var weekly = await text.CreateThreadAsync("Weekly chat", autoArchiveDuration: ThreadArchiveDuration.OneWeek);

// Private thread (invite-only)
var ticket = await text.CreateThreadAsync($"ticket-{Context.User.Username}", ThreadType.PrivateThread, invitable: false);
await ticket.AddUserAsync((IGuildUser)Context.User);
```

## Managing threads

```csharp
await ticket.SendMessageAsync("Hello thread!");
await ticket.ModifyAsync(p =>
{
    p.Name = "Renamed";
    p.Locked = true;
    p.Archived = true;
});
await ticket.RemoveUserAsync(member);
await ticket.DeleteAsync();

var cachedThreads = Context.Guild.ThreadChannels;          // threads the bot knows about
```

## Forum posts

```csharp
var forum = Context.Guild.GetForumChannel(forumId);
var tags = forum.Tags.Where(t => t.Name == "Bug").ToArray();   // ForumTag is a struct, so filter instead of FirstOrDefault

var post = await forum.CreatePostAsync(
    title: "Bug: login fails",
    archiveDuration: ThreadArchiveDuration.OneWeek,
    text: "Steps to reproduce…",
    embed: embed,
    tags: tags);
```

## Thread events

```csharp
client.ThreadCreated += thread => Task.CompletedTask;
client.ThreadUpdated += (before, after) => Task.CompletedTask;
client.ThreadDeleted += cachedThread => Task.CompletedTask;
client.ThreadMemberJoined += member => Task.CompletedTask;
```

## Joining

```csharp
if (thread is SocketThreadChannel t && !t.HasJoined) await t.JoinAsync();
```

## See also
- [Use-Case Recipes → Tickets](../Use-Case-Recipes.md#ticket-system) · [Channels](27-Channels.md)
