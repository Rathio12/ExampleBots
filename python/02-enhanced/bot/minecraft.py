"""Fetches a Minecraft server's status from the free mcsrvstat.us API.

The same pattern (HTTP request -> normalise -> embed) works for any game with a
status API: FiveM, Rust, CS2 (via Steam), Palworld, etc.
"""
import html
from dataclasses import dataclass, field
from urllib.parse import quote

import aiohttp

API_URL = "https://api.mcsrvstat.us/3/"


@dataclass
class ServerStatus:
    online: bool
    address: str
    players: int = 0
    max_players: int = 0
    version: str = "unknown"
    motd: str = ""
    player_names: list[str] = field(default_factory=list)


async def fetch_minecraft_status(session: aiohttp.ClientSession, address: str) -> ServerStatus:
    timeout = aiohttp.ClientTimeout(total=10)  # never hang forever on a slow API
    async with session.get(API_URL + quote(address, safe=":"), timeout=timeout) as response:
        response.raise_for_status()
        data = await response.json()

    players = data.get("players") or {}
    motd_lines = (data.get("motd") or {}).get("clean") or []
    return ServerStatus(
        online=data.get("online") is True,
        address=address,
        players=players.get("online", 0),
        max_players=players.get("max", 0),
        version=data.get("version", "unknown"),
        # The API HTML-escapes the MOTD ("&amp;"), so unescape it.
        motd=html.unescape("\n".join(line.strip() for line in motd_lines)),
        player_names=[p["name"] for p in players.get("list", [])],
    )
