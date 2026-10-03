// Fetches a Minecraft server's status from the free mcsrvstat.us API.
// The same pattern (HTTP request -> normalise -> embed) works for any game
// that exposes a status API: FiveM, Rust, CS2 (via Steam), Palworld, etc.
const API_URL = 'https://api.mcsrvstat.us/3/';

// The API HTML-escapes the MOTD ("&amp;"), so turn entities back into text.
const decodeEntities = (text) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

/**
 * @typedef {object} ServerStatus
 * @property {boolean} online
 * @property {string} address
 * @property {number} players
 * @property {number} maxPlayers
 * @property {string} version
 * @property {string} motd
 * @property {string[]} playerNames
 */

/**
 * @param {string} address e.g. "play.example.net" or "1.2.3.4:25565"
 * @returns {Promise<ServerStatus>}
 */
export async function fetchMinecraftStatus(address) {
  const response = await fetch(API_URL + encodeURIComponent(address), {
    // mcsrvstat asks clients to send a descriptive User-Agent.
    headers: { 'User-Agent': 'ExampleBots-DiscordBot/1.0' },
    signal: AbortSignal.timeout(10_000), // never hang forever on a slow API
  });
  if (!response.ok) throw new Error(`Status API responded with HTTP ${response.status}`);

  const data = await response.json();
  return {
    online: data.online === true,
    address,
    players: data.players?.online ?? 0,
    maxPlayers: data.players?.max ?? 0,
    version: data.version ?? 'unknown',
    motd: decodeEntities(data.motd?.clean?.map((line) => line.trim()).join('\n') ?? ''),
    playerNames: data.players?.list?.map((player) => player.name) ?? [],
  };
}
