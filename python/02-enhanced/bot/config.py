"""Centralised, validated configuration loaded from environment variables / .env."""
import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _optional(name: str) -> str | None:
    value = os.getenv(name, "").strip()
    return value or None


def _optional_int(name: str) -> int | None:
    value = _optional(name)
    return int(value) if value else None


@dataclass(frozen=True)
class Config:
    token: str
    guild_id: int | None
    welcome_channel_id: int | None
    feedback_channel_id: int | None
    game_server_address: str | None
    status_channel_id: int | None
    status_interval_minutes: int
    log_level: str

    @classmethod
    def from_env(cls) -> "Config":
        token = _optional("DISCORD_TOKEN")
        if not token:
            raise SystemExit("❌ DISCORD_TOKEN is missing. Copy .env.example to .env and add your token.")
        return cls(
            token=token,
            guild_id=_optional_int("GUILD_ID"),
            welcome_channel_id=_optional_int("WELCOME_CHANNEL_ID"),
            feedback_channel_id=_optional_int("FEEDBACK_CHANNEL_ID"),
            game_server_address=_optional("GAME_SERVER_ADDRESS"),
            status_channel_id=_optional_int("STATUS_CHANNEL_ID"),
            # Channel renames are limited to 2 per 10 minutes — never go below 5.
            status_interval_minutes=max(5, _optional_int("STATUS_INTERVAL_MINUTES") or 5),
            log_level=(_optional("LOG_LEVEL") or "INFO").upper(),
        )
