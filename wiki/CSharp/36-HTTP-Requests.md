# HTTP Requests

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key types** | `HttpClient`, `IHttpClientFactory`, `System.Text.Json` |
| **Used in** | [02-enhanced MinecraftService.cs](../../csharp/02-enhanced/Services/MinecraftService.cs) |

## One shared HttpClient

Creating a new `HttpClient` per request exhausts sockets. Register one (or use `IHttpClientFactory`) and inject it:

```csharp
// Simple: a singleton
services.AddSingleton(new HttpClient { Timeout = TimeSpan.FromSeconds(10) });

// Better with the Generic Host: typed clients via IHttpClientFactory (package Microsoft.Extensions.Http)
builder.Services.AddHttpClient<MinecraftService>(client =>
{
    client.BaseAddress = new Uri("https://api.mcsrvstat.us/3/");
    client.Timeout = TimeSpan.FromSeconds(10);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("MyDiscordBot/1.0");
});
```

## GET JSON into records

```csharp
public sealed record McStatus(bool Online, McPlayers? Players, string? Version);
public sealed record McPlayers(int Online, int Max);

public sealed class MinecraftService(HttpClient http)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);   // camelCase, case-insensitive

    public async Task<McStatus?> GetAsync(string address) =>
        await http.GetFromJsonAsync<McStatus>(Uri.EscapeDataString(address).Replace("%3A", ":"), Json);
}
```

`GetFromJsonAsync` (from `System.Net.Http.Json`) throws `HttpRequestException` on non-success status codes.

## Navigating unknown JSON

```csharp
using var doc = await JsonDocument.ParseAsync(await http.GetStreamAsync(url));
var online = doc.RootElement.TryGetProperty("online", out var o) && o.GetBoolean();
```

## POST JSON

```csharp
using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.example.com/items")
{
    Content = JsonContent.Create(new { name = "test" }),
};
request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
using var response = await http.SendAsync(request);
response.EnsureSuccessStatusCode();
```

## In a command: defer first

```csharp
[SlashCommand("players", "Minecraft server status")]
public async Task PlayersAsync(string address)
{
    await DeferAsync();                                         // HTTP can exceed 3 s
    try
    {
        var status = await minecraft.GetAsync(address);
        await FollowupAsync($"Players: {status?.Players?.Online ?? 0}");
    }
    catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
    {
        await FollowupAsync($"⚠️ Could not reach the API: {ex.Message}");
    }
}
```

`TaskCanceledException` is what a timeout looks like.

## Caching

```csharp
builder.Services.AddMemoryCache();

public sealed class CachedStatus(IMemoryCache cache, MinecraftService minecraft)
{
    public Task<McStatus?> GetAsync(string address) =>
        cache.GetOrCreateAsync($"mc:{address}", entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
            return minecraft.GetAsync(address);
        });
}
```

## See also
- [Background Tasks](35-Background-Tasks.md) · [Responding to Interactions](10-Responding-to-Interactions.md)
