# Error Handling

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Key APIs** | `CommandTree.on_error`, `discord.HTTPException`, `discord.Forbidden`, `discord.NotFound` |
| **Used in** | [02-enhanced client.py](../../python/02-enhanced/bot/client.py) · [03-expert core.py](../../python/03-expert/bot/core.py) |

## One central handler for all slash commands

```python
log = logging.getLogger("bot")


class MyTree(app_commands.CommandTree):
    async def on_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError) -> None:
        if isinstance(error, app_commands.CommandOnCooldown):
            message = f"⏳ Try again in {error.retry_after:.0f}s."
        elif isinstance(error, app_commands.MissingPermissions):
            message = f"🚫 You need: {', '.join(error.missing_permissions)}"
        elif isinstance(error, app_commands.BotMissingPermissions):
            message = f"🚫 I need: {', '.join(error.missing_permissions)}"
        elif isinstance(error, app_commands.NoPrivateMessage):
            message = "This command only works in a server."
        elif isinstance(error, app_commands.CheckFailure):
            message = "You can't use this command."
        else:
            log.exception("Command failed", exc_info=error)
            message = "⚠️ Something went wrong. The error has been logged."

        if interaction.response.is_done():
            await interaction.followup.send(message, ephemeral=True)
        else:
            await interaction.response.send_message(message, ephemeral=True)


bot = commands.Bot(command_prefix=commands.when_mentioned, intents=intents, tree_cls=MyTree)
```

Unexpected exceptions arrive wrapped in `app_commands.CommandInvokeError`. The original exception is in `error.original`.

## Per-command handler

```python
@app_commands.command()
async def divide(self, interaction: discord.Interaction, a: int, b: int) -> None:
    await interaction.response.send_message(str(a / b))

@divide.error
async def divide_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError) -> None:
    if isinstance(getattr(error, "original", error), ZeroDivisionError):
        await interaction.response.send_message("Can't divide by zero!", ephemeral=True)
```

Cogs can also define `async def cog_app_command_error(self, interaction, error)`.

## Discord API exceptions

| Exception | HTTP | Typical cause |
|---|---|---|
| `discord.Forbidden` | 403 | Missing permission, role too low, DMs closed |
| `discord.NotFound` | 404 | Deleted message/channel, unknown member, expired interaction |
| `discord.HTTPException` | any | Base class: `.status`, `.code`, `.text` |
| `discord.RateLimited` | 429 | Only raised when a wait would be very long |
| `discord.LoginFailure` | — | Bad token |
| `discord.PrivilegedIntentsRequired` | — | Intent not enabled in the portal |

```python
try:
    await member.send("Hello")
except discord.Forbidden:
    pass                                   # DMs closed: expected
except discord.HTTPException as error:
    log.warning("DM failed: %s (code %s)", error.text, error.code)
```

## Errors in listeners and tasks

```python
class MyBot(commands.Bot):
    async def on_error(self, event_method: str, /, *args, **kwargs) -> None:
        log.exception("Unhandled error in %s", event_method)
```

For `tasks.loop`, add an error handler so one failure doesn't stop the loop forever:

```python
@my_loop.error
async def my_loop_error(self, error: BaseException) -> None:
    log.exception("Loop crashed", exc_info=error)
    self.my_loop.restart()
```

## Check first, catch second

```python
if not interaction.app_permissions.embed_links:
    return await interaction.response.send_message("I need Embed Links here.", ephemeral=True)
```

## See also
- [Responding to Interactions](10-Responding-to-Interactions.md) · [Logging](39-Logging.md) · [Troubleshooting](../Troubleshooting-and-FAQ.md)
