# Webhooks

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key types** | `IWebhook`, `DiscordWebhookClient` (Discord.Net.Webhook) |
| **Permission** | Manage Webhooks |

## Creating a webhook

```csharp
var channel = (ITextChannel)Context.Channel;
var webhook = await channel.CreateWebhookAsync("News Feed");
Console.WriteLine($"https://discord.com/api/webhooks/{webhook.Id}/{webhook.Token}");   // treat as a secret
```

## Sending with `DiscordWebhookClient`

```csharp
using Discord.Webhook;

using var hook = new DiscordWebhookClient(webhook);                  // or new DiscordWebhookClient(url)
await hook.SendMessageAsync(
    text: "Breaking news!",
    username: "Reporter",
    avatarUrl: "https://example.com/reporter.png",
    embeds: [embed],
    allowedMentions: AllowedMentions.None);
```

`SendMessageAsync` returns the message ID, so you can edit or delete it later:

```csharp
var id = await hook.SendMessageAsync("v1");
await hook.ModifyMessageAsync(id, m => m.Content = "v2");
await hook.DeleteMessageAsync(id);
```

## From a URL (no bot connection)

```csharp
using var hook = new DiscordWebhookClient(Environment.GetEnvironmentVariable("LOG_WEBHOOK_URL"));
await hook.SendMessageAsync("Deployment finished ✅", username: "CI");
```

Useful from scripts, CI pipelines, or a separate service.

## Reusing webhooks

```csharp
var hooks = await channel.GetWebhooksAsync();
var existing = hooks.FirstOrDefault(h => h.Creator?.Id == Context.Client.CurrentUser.Id)
               ?? await channel.CreateWebhookAsync("Bot Relay");
```

## Threads and forums

```csharp
await hook.SendMessageAsync("In a thread", threadId: threadId);
await hook.SendMessageAsync("Post body", threadName: "New forum post");
```

## See also
- [Sending Messages](16-Sending-Messages.md) · [HTTP Requests](36-HTTP-Requests.md)
