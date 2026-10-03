# Installation

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Getting_started-607D8B?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[Python portal](README.md) › Getting started</sub>

| | |
|---|---|
| **Requires** | Python 3.10+ |
| **Packages** | `discord.py`, `python-dotenv` |
| **Used in** | every Python example |

## 1. Install Python

Download from [python.org](https://www.python.org/downloads/). On Windows, tick **"Add python.exe to PATH"** in the installer.

```bash
python --version     # 3.10 or newer (use python3 on macOS/Linux)
```

## 2. Create a project with a virtual environment

A virtual environment keeps each project's packages separate:

```bash
mkdir my-bot && cd my-bot
python -m venv .venv

# activate it
source .venv/bin/activate          # macOS / Linux
.venv\Scripts\activate             # Windows (cmd / PowerShell)

pip install -U discord.py python-dotenv
pip freeze > requirements.txt
```

Your prompt shows `(.venv)` while it's active. Run the bot only inside the activated environment.

`requirements.txt` (pinning the major version is a good habit):

```text
discord.py>=2.5,<3
python-dotenv>=1.0
```

Later: `pip install -r requirements.txt`.

## 3. Add your token

`.env`:

```env
DISCORD_TOKEN=your-token-here
GUILD_ID=your-test-server-id
```

`.gitignore`:

```gitignore
.venv/
.env
__pycache__/
```

## 4. Minimal bot

`bot.py`:

```python
import os

import discord
from dotenv import load_dotenv

load_dotenv()

intents = discord.Intents.default()
client = discord.Client(intents=intents)


@client.event
async def on_ready():
    print(f"Logged in as {client.user}")


client.run(os.environ["DISCORD_TOKEN"])
```

```bash
python bot.py
```

`client.run()` sets up logging, starts the event loop, and blocks until the bot stops (Ctrl+C).

## Optional extras

| Install | Purpose |
|---|---|
| `pip install "discord.py[voice]"` | Voice support (PyNaCl). Also install FFmpeg ([Voice](31-Voice.md)) |
| `pip install "discord.py[speed]"` | Faster JSON (`orjson`) and compression |
| `pip install aiosqlite` | Async SQLite ([article](37-SQLite-Database.md)) |
| `pip install pytest ruff` | Testing and linting |

## Common problems

| Error | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'discord'` | Activate the venv, then `pip install discord.py` |
| `discord.errors.LoginFailure: Improper token` | Wrong or reset token |
| `PrivilegedIntentsRequired` | Enable the intent in the Developer Portal or remove it from code |
| You installed `discord` (not `discord.py`) | `pip uninstall discord && pip install discord.py` |
| `RuntimeError: Event loop is closed` on Windows | Upgrade discord.py, and use `client.run()` rather than your own loop |

## See also
- [Client & Intents](02-Client-and-Intents.md) · [Configuration & .env](03-Configuration-and-Env.md) · [Getting Started](../Getting-Started.md)
