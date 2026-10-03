# Cooldowns

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key APIs** | `app_commands.checks.cooldown`, `app_commands.checks.dynamic_cooldown`, `CommandOnCooldown` |
| **Used in** | [02-enhanced cogs](../../python/02-enhanced/bot/cogs) · [03-expert general.py](../../python/03-expert/bot/cogs/general.py) |

## Built-in cooldown decorator

```python
@app_commands.command(description="Start a poll")
@app_commands.checks.cooldown(1, 30.0, key=lambda i: i.user.id)     # 1 use per 30 s per user
async def poll(self, interaction: discord.Interaction, question: str) -> None:
    ...
```

`cooldown(rate, per, key=...)` allows `rate` uses per `per` seconds for each key.

| Key | Scope |
|---|---|
| `lambda i: i.user.id` | Per user (default) |
| `lambda i: i.guild_id` | Per server |
| `lambda i: i.channel_id` | Per channel |
| `lambda i: (i.guild_id, i.user.id)` | Per user per server |
| `None` | Global |

## Handling the error

```python
class MyTree(app_commands.CommandTree):
    async def on_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError) -> None:
        if isinstance(error, app_commands.CommandOnCooldown):
            await interaction.response.send_message(f"⏳ Try again in {error.retry_after:.0f}s.", ephemeral=True)
            return
        raise error

bot = commands.Bot(command_prefix="!", intents=intents, tree_cls=MyTree)
```

Live countdown text: `f"<t:{int(time.time() + error.retry_after)}:R>"`.

## Dynamic cooldowns (e.g. moderators bypass)

```python
def mod_bypass(interaction: discord.Interaction) -> app_commands.Cooldown | None:
    if interaction.permissions.manage_messages:
        return None                                    # no cooldown for moderators
    return app_commands.Cooldown(1, 10.0)

@app_commands.command()
@app_commands.checks.dynamic_cooldown(mod_bypass, key=lambda i: i.user.id)
async def suggest(self, interaction: discord.Interaction, text: str) -> None:
    ...
```

## Manual cooldowns (non-command code)

For things like XP, a dict is enough:

```python
self._cooldowns: dict[tuple[int, int], float] = {}

key = (message.guild.id, message.author.id)
now = time.monotonic()
if self._cooldowns.get(key, 0) > now:
    return
self._cooldowns[key] = now + 60
```

## Persistent cooldowns

Decorator cooldowns are in memory and reset on restart. For daily rewards, store the last claim time in the database:

```python
last = await db.get_last_daily(user_id)
if last and time.time() - last < 86_400:
    return await interaction.response.send_message(f"Come back <t:{int(last + 86_400)}:R>.", ephemeral=True)
```

## See also
- [Error Handling](34-Error-Handling.md) · [SQLite Database](37-SQLite-Database.md)
