# Logging

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key APIs** | `logging`, `discord.utils.setup_logging` |
| **Used in** | [03-expert logging_setup.py](../../python/03-expert/bot/logging_setup.py) |

## Use `logging`, not `print`

```python
import logging

log = logging.getLogger(__name__)      # one logger per module

log.debug("Detailed info for development")
log.info("Bot started")
log.warning("API slow: %s ms", elapsed)
log.error("Could not send message")
log.exception("Unexpected error")      # inside except: includes the traceback
```

Use `%s` placeholders instead of f-strings: formatting only happens if the message is actually logged.

## discord.py's built-in setup

`bot.run()` configures a coloured handler for you:

```python
bot.run(token, log_level=logging.INFO)                 # default
bot.run(token, log_level=logging.DEBUG)                # very verbose (gateway events)
bot.run(token, root_logger=True)                       # also format your own loggers
```

Or configure it yourself:

```python
discord.utils.setup_logging(level=logging.INFO, root=True)
bot.run(token, log_handler=None)                       # don't let run() add another handler
```

## JSON logs for production

```python
import json, logging

class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "time": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname.lower(),
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logging.basicConfig(level=logging.INFO, handlers=[handler])
```

The expert bot switches to this when `ENVIRONMENT=production`.

## Log files with rotation

```python
from logging.handlers import RotatingFileHandler

file_handler = RotatingFileHandler("logs/bot.log", maxBytes=5_000_000, backupCount=5, encoding="utf-8")
logging.getLogger().addHandler(file_handler)
```

## Quieting noisy libraries

```python
logging.getLogger("discord.gateway").setLevel(logging.WARNING)
logging.getLogger("discord.http").setLevel(logging.WARNING)
```

## What to log

- ✅ Startup, shutdown, guild joins/leaves, moderation actions, errors with context
- ❌ Tokens, API keys, full message contents of every message

## See also
- [Error Handling](34-Error-Handling.md) · [Deployment](42-Deployment.md)
