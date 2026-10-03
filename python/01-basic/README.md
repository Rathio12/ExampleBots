# Python · Basic Bot

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white)](https://discordpy.readthedocs.io)
![Tier](https://img.shields.io/badge/tier-basic-57F287)

A complete Discord bot in a single file, [`bot.py`](bot.py). Read it top to bottom: every section is commented.

## Commands

| Command | What it does | You learn |
|---|---|---|
| `/ping` | Shows gateway latency | Replying to an interaction |
| `/hello` | Greets you with a mention | Reading the invoking user |
| `/roll [sides]` | Rolls a die (2–1000 sides) | `app_commands.Range` for min/max |
| `/avatar [user]` | Shows a user's avatar | Optional `discord.User` parameters |
| `/8ball <question>` | Magic 8-ball answer | Renaming commands (`name="8ball"`) |
| `/coinflip` | Heads or tails | — |

## Run

```bash
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # Windows: copy .env.example .env
python bot.py
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | yes | Bot token from the Developer Portal |
| `GUILD_ID` | no | Sync commands to one server instantly instead of globally |

## How it works

1. `load_dotenv()` reads `.env` into `os.environ`.
2. `BasicBot` subclasses `discord.Client` and owns an `app_commands.CommandTree`.
3. `setup_hook` runs once before connecting and **syncs** the commands to Discord.
4. `@client.tree.command()` turns a function into a slash command. **Type hints become options.**
5. `@client.tree.error` catches every command error and tells the user.

## Next step

The [Enhanced bot](../02-enhanced) organises commands into **cogs** and adds buttons, select menus, modals and background tasks.

Full walkthrough: [Python Guide](../../wiki/Python/README.md)
