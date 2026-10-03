"""Loads and validates configuration once at startup.

Failing fast with a clear message beats a confusing crash ten minutes later.
"""
import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _optional(name: str) -> str | None:
    value = os.getenv(name, "").strip()
    return value or None


def _int(name: str, default: int, minimum: int, maximum: int) -> int:
    raw = _optional(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        raise SystemExit(f"❌ {name} must be an integer (got {raw!r})") from None
    if not minimum <= value <= maximum:
        raise SystemExit(f"❌ {name} must be between {minimum} and {maximum} (got {value})")
    return value


@dataclass(frozen=True)
class Config:
    token: str
    guild_id: int | None
    database_path: str
    log_level: str
    json_logs: bool
    xp_min: int
    xp_max: int
    xp_cooldown_seconds: int

    @classmethod
    def from_env(cls) -> "Config":
        token = _optional("DISCORD_TOKEN")
        if not token:
            raise SystemExit("❌ DISCORD_TOKEN is required. Copy .env.example to .env and fill it in.")

        guild_id = _optional("GUILD_ID")
        xp_min = _int("XP_MIN", 15, 1, 1000)
        return cls(
            token=token,
            guild_id=int(guild_id) if guild_id else None,
            database_path=_optional("DATABASE_PATH") or "./data/bot.db",
            log_level=(_optional("LOG_LEVEL") or "INFO").upper(),
            json_logs=_optional("ENVIRONMENT") == "production",
            xp_min=xp_min,
            xp_max=_int("XP_MAX", 25, xp_min, 1000),
            xp_cooldown_seconds=_int("XP_COOLDOWN_SECONDS", 60, 0, 3600),
        )
