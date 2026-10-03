using System.Net;
using System.Text.Json;

namespace EnhancedBot.Services;

public sealed record ServerStatus(
    bool Online, string Address, int Players, int MaxPlayers, string Version, string Motd, IReadOnlyList<string> PlayerNames);

/// <summary>
/// Fetches a Minecraft server's status from the free mcsrvstat.us API.
/// The same pattern (HTTP -> parse JSON -> embed) works for any game with a status API.
/// </summary>
public sealed class MinecraftService(HttpClient http)
{
    private const string ApiUrl = "https://api.mcsrvstat.us/3/";

    public async Task<ServerStatus> GetStatusAsync(string address)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, ApiUrl + Uri.EscapeDataString(address).Replace("%3A", ":"));
        // mcsrvstat asks clients to send a descriptive User-Agent.
        request.Headers.UserAgent.ParseAdd("ExampleBots-DiscordBot/1.0");

        using var response = await http.SendAsync(request);
        response.EnsureSuccessStatusCode();

        using var json = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        var root = json.RootElement;

        var online = root.TryGetProperty("online", out var o) && o.GetBoolean();
        var players = root.TryGetProperty("players", out var p) ? p : default;

        var names = new List<string>();
        if (players.ValueKind == JsonValueKind.Object && players.TryGetProperty("list", out var list))
            names.AddRange(list.EnumerateArray().Select(player => player.GetProperty("name").GetString() ?? "?"));

        var motd = root.TryGetProperty("motd", out var m) && m.TryGetProperty("clean", out var clean)
            // The API HTML-escapes the MOTD ("&amp;"), so decode it.
            ? WebUtility.HtmlDecode(string.Join('\n', clean.EnumerateArray().Select(line => line.GetString()?.Trim())))
            : "";

        return new ServerStatus(
            Online: online,
            Address: address,
            Players: players.ValueKind == JsonValueKind.Object && players.TryGetProperty("online", out var on) ? on.GetInt32() : 0,
            MaxPlayers: players.ValueKind == JsonValueKind.Object && players.TryGetProperty("max", out var max) ? max.GetInt32() : 0,
            Version: root.TryGetProperty("version", out var v) ? v.GetString() ?? "unknown" : "unknown",
            Motd: motd,
            PlayerNames: names);
    }
}
