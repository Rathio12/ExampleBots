# Webhooks

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `Webhook`, `WebhookClient` |
| **Permission** | Manage Webhooks |

A webhook posts messages into a channel with **any name and avatar**, without a bot connection. They're useful for logs, RSS feeds, cross-server bridges and "say as character" features.

## Creating a webhook

```js
const webhook = await channel.createWebhook({
  name: 'News Feed',
  avatar: 'https://example.com/news.png',
  reason: 'RSS feed',
});
console.log(webhook.url);   // treat this URL like a password
```

## Sending through a webhook

```js
await webhook.send({
  content: 'Breaking news!',
  username: 'Reporter',                           // override per message
  avatarURL: 'https://example.com/reporter.png',
  embeds: [embed],
});
```

## Using only the URL (no bot needed)

```js
import { WebhookClient } from 'discord.js';

const hook = new WebhookClient({ url: process.env.LOG_WEBHOOK_URL });
await hook.send({ content: 'Deployment finished ✅', username: 'CI' });
```

This works from any script, CI pipeline or server. You don't even need a bot token.

## Reusing webhooks

Channels allow a limited number of webhooks, so find or create one instead of making a new one every time:

```js
async function getWebhook(channel) {
  const hooks = await channel.fetchWebhooks();
  return hooks.find((h) => h.owner?.id === channel.client.user.id) ?? channel.createWebhook({ name: 'Bot Relay' });
}
```

## Posting into a thread

```js
await webhook.send({ content: 'In the thread', threadId: thread.id });
// Forum: create a new post
await webhook.send({ content: 'New post body', threadName: 'Post title' });
```

## Editing and deleting webhook messages

```js
const message = await webhook.send({ content: 'v1' });
await webhook.editMessage(message.id, { content: 'v2' });
await webhook.deleteMessage(message.id);
await webhook.delete('No longer needed');
```

## Example: "say as character"

```js
const hook = await getWebhook(interaction.channel);
await hook.send({
  content: interaction.options.getString('text', true),
  username: 'Gandalf',
  avatarURL: 'https://example.com/gandalf.png',
  allowedMentions: { parse: [] },
});
await interaction.reply({ content: 'Sent!', flags: MessageFlags.Ephemeral });
```

## Security

- Anyone with the URL can post. Never commit or share it.
- Always set `allowedMentions` when relaying user content.

## See also
- [Sending Messages](16-Sending-Messages.md) · [Use-Case Recipes → Live notifications](../Use-Case-Recipes.md#live-notifications)
