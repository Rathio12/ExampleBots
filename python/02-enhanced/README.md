# Python · Enhanced Bot

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white)](https://discordpy.readthedocs.io)
![Tier](https://img.shields.io/badge/tier-enhanced-FEE75C)

A modular community bot built with **cogs**. Each cog groups related commands and listeners and is loaded as an extension.

## Features

| Feature | File | You learn |
|---|---|---|
| `/ping`, `/help`, `/serverinfo`, `/userinfo` | [cogs/general.py](bot/cogs/general.py) | Cogs, embeds, `guild_only`, cooldowns |
| `/poll <question>` | [cogs/interactive.py](bot/cogs/interactive.py) | `discord.ui.View` with buttons, timeouts |
| `/trivia` | [cogs/interactive.py](bot/cogs/interactive.py) | `discord.ui.Select`, ephemeral replies |
| `/feedback` | [cogs/interactive.py](bot/cogs/interactive.py) | `discord.ui.Modal` with text inputs |
| `/players [address]` | [cogs/gameserver.py](bot/cogs/gameserver.py) | Live Minecraft player counts via `aiohttp` |
| Status updater | [cogs/gameserver.py](bot/cogs/gameserver.py) | `tasks.loop`, presence, channel renames |
| Welcome messages | [cogs/welcome.py](bot/cogs/welcome.py) | Listeners, privileged intents |
| Central error handling | [client.py](bot/client.py) | A custom `CommandTree.on_error` |

## Run

```bash
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | yes | Bot token |
| `GUILD_ID` | no | Sync commands to one server instantly |
| `WELCOME_CHANNEL_ID` | no | Enables welcome messages. **Turn on the Server Members intent first.** |
| `FEEDBACK_CHANNEL_ID` | no | Where `/feedback` submissions are posted |
| `GAME_SERVER_ADDRESS` | no | Minecraft server to track |
| `STATUS_CHANNEL_ID` | no | Channel renamed to `🟢 Players: 12/100` |
| `STATUS_INTERVAL_MINUTES` | no | Update interval, minimum 5 |
| `LOG_LEVEL` | no | `DEBUG`, `INFO`, `WARNING`, `ERROR` |

## Project structure

```
main.py                 entry point
bot/
├── client.py           EnhancedBot + EnhancedTree (error handling, syncing)
├── config.py           frozen dataclass loaded from .env
├── embeds.py           colours and helpers
├── minecraft.py        mcsrvstat.us client
├── trivia.py           question bank
└── cogs/
    ├── general.py      ping, help, serverinfo, userinfo
    ├── interactive.py  poll (buttons), trivia (select), feedback (modal)
    ├── gameserver.py   /players + tasks.loop status updater
    └── welcome.py      on_member_join
```

## Adding a command

Add a method to any cog (or create `bot/cogs/fun.py` and add it to `EXTENSIONS` in `client.py`):

```python
@app_commands.command(description="Hug someone")
@app_commands.checks.cooldown(1, 5.0, key=lambda i: i.user.id)
async def hug(self, interaction: discord.Interaction, user: discord.User) -> None:
    await interaction.response.send_message(f"🤗 {interaction.user.mention} hugs {user.mention}!")
```

Restart the bot. Commands are synced automatically in `setup_hook`.

## Next step

The [Expert bot](../03-expert) adds SQLite, moderation, an audit-log system, leveling, reminders, autocomplete, context menus, tests and Docker.

Full walkthrough: [Python Guide](../../wiki/Python/README.md)
