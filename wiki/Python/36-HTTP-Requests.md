# HTTP Requests

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Package** | `aiohttp` (installed with discord.py) |
| **Used in** | [02-enhanced minecraft.py](../../python/02-enhanced/bot/minecraft.py) · [client.py](../../python/02-enhanced/bot/client.py) |

Never use `requests` in a bot: it blocks the event loop, and while it waits, the bot can't answer anything or send heartbeats. Use `aiohttp`.

## One shared session

Creating a session per request is slow. Create one in `setup_hook` and close it in `close`:

```python
import aiohttp

class MyBot(commands.Bot):
    async def setup_hook(self) -> None:
        self.http_session = aiohttp.ClientSession(headers={"User-Agent": "MyDiscordBot/1.0"})

    async def close(self) -> None:
        await self.http_session.close()
        await super().close()
```

## GET JSON

```python
async def get_json(session: aiohttp.ClientSession, url: str) -> dict:
    timeout = aiohttp.ClientTimeout(total=10)
    async with session.get(url, timeout=timeout) as response:
        response.raise_for_status()               # raises for 4xx/5xx
        return await response.json()
```

## POST JSON

```python
async with session.post(
    "https://api.example.com/items",
    json={"name": "test"},
    headers={"Authorization": f"Bearer {API_KEY}"},
    timeout=aiohttp.ClientTimeout(total=10),
) as response:
    data = await response.json()
```

## In a command: defer first

```python
@app_commands.command(description="Minecraft server status")
async def players(self, interaction: discord.Interaction, address: str) -> None:
    await interaction.response.defer()                 # HTTP can exceed 3 s
    try:
        data = await get_json(self.bot.http_session, f"https://api.mcsrvstat.us/3/{quote(address, safe=':')}")
    except (aiohttp.ClientError, TimeoutError) as error:
        return await interaction.followup.send(f"⚠️ Could not reach the API: {error}")
    await interaction.followup.send(f"Players: {data.get('players', {}).get('online', 0)}")
```

`urllib.parse.quote` encodes user input safely for URLs. For query strings, pass `params={"q": query}` to `session.get`.

## Normalise responses with dataclasses

```python
@dataclass
class ServerStatus:
    online: bool
    players: int = 0
    max_players: int = 0

def parse(data: dict) -> ServerStatus:
    players = data.get("players") or {}
    return ServerStatus(online=data.get("online") is True, players=players.get("online", 0), max_players=players.get("max", 0))
```

## Simple cache

```python
_cache: dict[str, tuple[float, ServerStatus]] = {}

async def cached_status(address: str) -> ServerStatus:
    hit = _cache.get(address)
    if hit and hit[0] > time.monotonic():
        return hit[1]
    status = parse(await get_json(session, URL + address))
    _cache[address] = (time.monotonic() + 60, status)
    return status
```

## Running blocking code

If a library has no async version, run it in a thread so the bot stays responsive:

```python
result = await asyncio.to_thread(blocking_function, arg1, arg2)
```

## See also
- [Background Tasks](35-Background-Tasks.md) · [Responding to Interactions](10-Responding-to-Interactions.md)
