# Webhooks

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `discord.Webhook`, `discord.SyncWebhook` |
| **Permission** | Manage Webhooks |

Webhooks post with any name and avatar, with or without a running bot.

## Creating a webhook

```python
webhook = await channel.create_webhook(name="News Feed", reason="RSS feed")
print(webhook.url)   # treat as a secret
```

## Sending

```python
await webhook.send(
    "Breaking news!",
    username="Reporter",
    avatar_url="https://example.com/reporter.png",
    embed=embed,
    allowed_mentions=discord.AllowedMentions.none(),
)

msg = await webhook.send("I can be edited", wait=True)   # wait=True returns the message
await webhook.edit_message(msg.id, content="Edited")
await webhook.delete_message(msg.id)
```

## From a URL (no bot needed)

Async (inside a running bot, reuse an aiohttp session):

```python
webhook = discord.Webhook.from_url(url, session=bot.http_session)
await webhook.send("Deployment finished ✅", username="CI")
```

Synchronous (plain scripts, cron jobs):

```python
from discord import SyncWebhook

SyncWebhook.from_url(url).send("Backup done", username="Backup Bot")
```

## Reusing webhooks

```python
async def get_webhook(channel: discord.TextChannel) -> discord.Webhook:
    for hook in await channel.webhooks():
        if hook.user == channel.guild.me:
            return hook
    return await channel.create_webhook(name="Bot Relay")
```

## Threads and forums

```python
await webhook.send("In a thread", thread=discord.Object(id=thread_id))
await webhook.send("New forum post body", thread_name="Post title")   # forum channel webhook
```

## "Say as character"

```python
hook = await get_webhook(interaction.channel)
await hook.send(text, username="Gandalf", avatar_url=GANDALF_AVATAR, allowed_mentions=discord.AllowedMentions.none())
await interaction.response.send_message("Sent!", ephemeral=True)
```

## See also
- [Sending Messages](16-Sending-Messages.md) · [HTTP Requests](36-HTTP-Requests.md)
