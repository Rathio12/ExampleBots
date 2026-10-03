# HTTP Requests

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key APIs** | global `fetch` (Node 18+), `AbortSignal.timeout` |
| **Used in** | [02-enhanced minecraft.js](../../javascript/02-enhanced/src/services/minecraft.js) |

Most useful bots talk to other services: game servers, weather, GitHub, AI models. Node has `fetch` built in.

## GET JSON

```js
async function getJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'MyDiscordBot/1.0 (+https://github.com/you/bot)' },
    signal: AbortSignal.timeout(10_000),          // never wait forever
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.json();
}
```

## POST JSON

```js
const response = await fetch('https://api.example.com/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.API_KEY}` },
  body: JSON.stringify({ name: 'test' }),
  signal: AbortSignal.timeout(10_000),
});
```

## In a command: always defer

```js
async execute(interaction) {
  await interaction.deferReply();                      // HTTP can exceed 3 s
  try {
    const data = await getJson(`https://api.mcsrvstat.us/3/${encodeURIComponent(address)}`);
    await interaction.editReply(`Players: ${data.players?.online ?? 0}`);
  } catch (error) {
    await interaction.editReply(`⚠️ Could not reach the API: ${error.message}`);
  }
}
```

## Encoding user input

```js
const url = `https://api.example.com/search?q=${encodeURIComponent(query)}`;
// or
const url2 = new URL('https://api.example.com/search');
url2.searchParams.set('q', query);
```

## Caching

Don't hit an API on every command:

```js
const cache = new Map();   // key → { value, expires }
async function cached(key, ttlMs, loader) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await loader();
  cache.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

const status = await cached(`mc:${address}`, 60_000, () => fetchMinecraftStatus(address));
```

## Normalising responses

Turn each API's response into your own shape. The rest of the bot then never depends on the API:

```js
return {
  online: data.online === true,
  players: data.players?.online ?? 0,
  maxPlayers: data.players?.max ?? 0,
  playerNames: data.players?.list?.map((p) => p.name) ?? [],
};
```

## Security

- **Timeouts** on everything.
- **User-supplied URLs** can point at internal addresses (SSRF). Allow-list hosts.
- **Check sizes** before downloading user files.
- **Secrets** go in `.env`, never in code or logs.

## Free APIs for fun commands

| API | Use |
|---|---|
| `https://official-joke-api.appspot.com/random_joke` | Jokes |
| `https://api.mcsrvstat.us/3/<address>` | Minecraft server status |
| `https://opentdb.com/api.php?amount=1` | Trivia questions |
| `https://dog.ceo/api/breeds/image/random` | Dog pictures |
| `https://api.github.com/repos/<owner>/<repo>` | GitHub repo info |

## See also
- [Background Tasks](35-Background-Tasks.md) · [Responding to Interactions](10-Responding-to-Interactions.md)
