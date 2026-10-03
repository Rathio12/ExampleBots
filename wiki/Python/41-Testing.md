# Testing

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Framework** | `pytest` |
| **Used in** | [03-expert/tests/](../../python/03-expert/tests) |

```bash
pip install pytest
pytest
```

`pytest.ini` (lets tests import the `bot` package):

```ini
[pytest]
testpaths = tests
pythonpath = .
```

## Unit tests

```python
# tests/test_duration.py
import pytest
from bot.utils.duration import parse_duration

@pytest.mark.parametrize(("text", "expected"), [("30s", 30), ("1h30m", 5400), ("1d 12h", 129_600)])
def test_parse_valid(text, expected):
    assert parse_duration(text) == expected

@pytest.mark.parametrize("text", ["", "abc", "10", "0m"])
def test_parse_invalid(text):
    assert parse_duration(text) is None
```

## Async database tests without plugins

```python
import asyncio
from bot.database import Database

def test_warnings():
    async def scenario():
        db = await Database.open(":memory:")
        await db.warnings.add(1, 10, 99, "spam")
        assert len(await db.warnings.list(1, 10)) == 1
        await db.close()

    asyncio.run(scenario())
```

Or install `pytest-asyncio` and write `async def test_…` directly with `@pytest.mark.asyncio`.

## Checking that every cog loads

```python
def test_extensions_load():
    async def scenario():
        bot = ExpertBot(Config.from_env())
        bot.db = await Database.open(":memory:")
        for ext in EXTENSIONS:
            await bot.load_extension(ext)
        for cmd in bot.tree.get_commands():
            cmd.to_dict(bot.tree)           # validates names, options, limits
        for ext in list(bot.extensions):
            await bot.unload_extension(ext)
        await bot.db.close()

    asyncio.run(scenario())
```

The bot never connects: loading extensions and building the tree work offline.

## Testing commands with fakes

```python
from unittest.mock import AsyncMock, MagicMock

def test_ping_replies():
    async def scenario():
        cog = General(MagicMock(latency=0.05))
        interaction = MagicMock()
        interaction.response.send_message = AsyncMock()
        await cog.ping.callback(cog, interaction)          # call the underlying function
        interaction.response.send_message.assert_awaited()

    asyncio.run(scenario())
```

## Linting

```bash
pip install ruff
ruff check .
```

CI runs ruff, `compileall` and pytest for the Python bots.

## See also
- [Testing](../Testing.md) · [Project Structure](38-Project-Structure.md)
