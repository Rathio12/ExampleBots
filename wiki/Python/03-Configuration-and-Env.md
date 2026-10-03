# Configuration & .env

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Getting_started-607D8B?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[Python portal](README.md) › Getting started</sub>

| | |
|---|---|
| **Packages** | `python-dotenv` |
| **Used in** | [02-enhanced/bot/config.py](../../python/02-enhanced/bot/config.py) · [03-expert/bot/config.py](../../python/03-expert/bot/config.py) |

## Loading `.env`

```python
import os
from dotenv import load_dotenv

load_dotenv()                                  # reads .env from the current directory
token = os.environ["DISCORD_TOKEN"]            # KeyError if missing
guild_id = os.getenv("GUILD_ID")               # None if missing
```

`load_dotenv()` doesn't overwrite variables that already exist in the environment, so Docker/systemd settings win.

## A validated, typed config

```python
# bot/config.py
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
    value = int(raw)
    if not minimum <= value <= maximum:
        raise SystemExit(f"{name} must be between {minimum} and {maximum}")
    return value


@dataclass(frozen=True)
class Config:
    token: str
    guild_id: int | None
    database_path: str
    xp_cooldown_seconds: int

    @classmethod
    def from_env(cls) -> "Config":
        token = _optional("DISCORD_TOKEN")
        if not token:
            raise SystemExit("DISCORD_TOKEN is required. Copy .env.example to .env.")
        guild = _optional("GUILD_ID")
        return cls(
            token=token,
            guild_id=int(guild) if guild else None,
            database_path=_optional("DATABASE_PATH") or "./data/bot.db",
            xp_cooldown_seconds=_int("XP_COOLDOWN_SECONDS", 60, 0, 3600),
        )
```

```python
config = Config.from_env()
bot = MyBot(config)
bot.run(config.token)
```

- `frozen=True` makes the config immutable.
- Typed fields: IDs become `int`, empty values become `None`.
- `SystemExit` with a clear message beats a stack trace later.

Store it on the bot (`self.config = config`) so cogs can use `self.bot.config`.

## pydantic-settings (optional)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    discord_token: str
    guild_id: int | None = None
    log_level: str = "INFO"

    model_config = {"env_file": ".env"}

settings = Settings()
```

## Per-server settings

Global settings come from the environment. Per-server settings (log channel, welcome text) belong in the database. See the expert bot's `/settings` and `SettingsRepository` ([SQLite Database](37-SQLite-Database.md)).

## See also
- [Security Best Practices](../Security-Best-Practices.md) · [Deployment](42-Deployment.md)
