# Threads & Forums

<sub>[JavaScript portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `ThreadChannel`, `ForumChannel`, `ThreadAutoArchiveDuration`, `ChannelType` |
| **Permissions** | Create Public/Private Threads, Send Messages in Threads, Manage Threads |

## Creating threads

```js
import { ChannelType, ThreadAutoArchiveDuration } from 'discord.js';

// From a message
const thread = await message.startThread({
  name: 'Discussion',
  autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
});

// Standalone public thread in a text channel
const publicThread = await channel.threads.create({
  name: 'Weekly chat',
  autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
  reason: 'Scheduled thread',
});

// Private thread (only invited members + moderators see it)
const privateThread = await channel.threads.create({
  name: `ticket-${user.username}`,
  type: ChannelType.PrivateThread,
  invitable: false,                  // members can't invite others
});
await privateThread.members.add(user.id);
```

Archive durations: `OneHour`, `OneDay`, `ThreeDays`, `OneWeek` (minutes: 60, 1440, 4320, 10080).

## Managing threads

```js
await thread.send('Hello thread!');
await thread.setName('Renamed');
await thread.setLocked(true);        // only moderators can unarchive/post
await thread.setArchived(true);
await thread.members.remove(userId);
await thread.delete();

const active = await guild.channels.fetchActiveThreads();
const archived = await channel.threads.fetchArchived();
```

`thread.isThread()` tells you whether any channel is a thread.

## Forum channels

A forum channel contains only posts (each post is a thread with a starter message):

```js
const forum = guild.channels.cache.get(FORUM_ID);   // ForumChannel

const post = await forum.threads.create({
  name: 'Bug: login fails',
  message: { content: 'Steps to reproduce…', embeds: [embed] },
  appliedTags: [forum.availableTags.find((t) => t.name === 'Bug')?.id].filter(Boolean),
});

// Tags
console.log(forum.availableTags.map((t) => `${t.name} (${t.id})`));
await post.setAppliedTags([tagId1, tagId2]);
```

Media channels work the same way as forums.

## Thread events

```js
client.on(Events.ThreadCreate, (thread, newlyCreated) => { if (newlyCreated) console.log('New thread', thread.name); });
client.on(Events.ThreadUpdate, (oldThread, newThread) => {});
client.on(Events.ThreadDelete, (thread) => {});
client.on(Events.ThreadMembersUpdate, (added, removed, thread) => {});
```

## Joining threads

Bots receive messages from threads they've joined. Public threads are joined automatically when the bot creates them. For others:

```js
if (thread.joinable) await thread.join();
```

## See also
- [Use-Case Recipes → Tickets](../Use-Case-Recipes.md#ticket-system) · [Channels](27-Channels.md)
