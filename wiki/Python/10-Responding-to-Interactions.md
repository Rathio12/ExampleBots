# Responding to Interactions

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Commands-0A84FF?style=flat-square) ![level](https://img.shields.io/badge/level-beginner-57F287?style=flat-square)

<sub>[Python portal](README.md) › Commands & interactions</sub>

| | |
|---|---|
| **Key APIs** | `interaction.response.*`, `interaction.followup`, `interaction.original_response()`, `edit_original_response()` |
| **Time limits** | First response within **3 s**. Follow-ups for **15 min**. |

Every interaction must be answered once, within 3 seconds, through `interaction.response`. Everything after that goes through `interaction.followup` or by editing the original response.

## Decision tree

```
Answer ready now?                → response.send_message()
Slow work (DB, HTTP, AI)?        → response.defer()  … followup.send() / edit_original_response()
Button/select edits its message? → response.edit_message()
Need user input?                 → response.send_modal()   (first response only)
```

## send_message

```python
await interaction.response.send_message("Hello!")
await interaction.response.send_message(
    "With extras",
    embed=embed,                # or embeds=[...]
    view=view,                  # buttons/selects
    file=discord.File("a.png"),
    ephemeral=True,             # only the user sees it
    allowed_mentions=discord.AllowedMentions.none(),
)
```

## defer + follow-up

```python
await interaction.response.defer()                    # "Bot is thinking…"
data = await fetch_slow_thing()
await interaction.followup.send(f"Result: {data}")    # becomes the response

await interaction.response.defer(ephemeral=True)      # private "thinking"
await interaction.followup.send("Done", ephemeral=True)

await interaction.response.defer(thinking=False)      # components: acknowledge without a visible state
```

## Editing / deleting the original response

```python
await interaction.response.send_message("Working…")
await interaction.edit_original_response(content="Done!", view=None)   # remove buttons
message = await interaction.original_response()                        # the InteractionMessage
await interaction.delete_original_response()
```

## Component interactions

```python
# Edit the message the button/select is attached to
await interaction.response.edit_message(content="Clicked!", view=None)

# Reply with a new (often ephemeral) message instead
await interaction.response.send_message("Thanks for voting!", ephemeral=True)
```

## Modals

```python
await interaction.response.send_modal(FeedbackModal())   # can't come after defer()
```

## State checks

```python
interaction.response.is_done()        # True once any response was sent
```

The universal "send an error" helper used in every example:

```python
async def send_error(interaction: discord.Interaction, text: str) -> None:
    if interaction.response.is_done():
        await interaction.followup.send(text, ephemeral=True)
    else:
        await interaction.response.send_message(text, ephemeral=True)
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `NotFound: 404 Unknown interaction` (10062) | Responded after 3 s | `defer()` first |
| `InteractionResponded` | Used `response` twice | Use `followup`/`edit_original_response` |
| "The application did not respond" | Exception or no response | Check logs; handle every branch |

## See also
- [Slash Commands](04-Slash-Commands.md) · [Buttons](12-Buttons.md) · [Error Handling](34-Error-Handling.md)
