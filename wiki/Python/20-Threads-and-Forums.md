# Threads & Forums

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `discord.Thread`, `discord.ForumChannel`, `discord.ForumTag`, `discord.ChannelType` |
| **Permissions** | Create Public/Private Threads, Send Messages in Threads, Manage Threads |

## Creating threads

```python
# From a message
thread = await message.create_thread(name="Discussion", auto_archive_duration=1440)   # minutes

# Standalone public thread
thread = await channel.create_thread(name="Weekly chat", type=discord.ChannelType.public_thread)

# Private thread (invite-only)
thread = await channel.create_thread(
    name=f"ticket-{user.name}",
    type=discord.ChannelType.private_thread,
    invitable=False,
)
await thread.add_user(user)
```

Archive durations: `60`, `1440`, `4320`, `10080` minutes.

## Managing threads

```python
await thread.send("Hello thread!")
await thread.edit(name="Renamed", locked=True, archived=True)
await thread.remove_user(member)
await thread.delete()

for t in channel.threads:                  # active threads in the cache
    print(t.name)
async for t in channel.archived_threads(limit=50):
    print(t.name)
```

## Forum posts

```python
forum: discord.ForumChannel = guild.get_channel(FORUM_ID)

bug_tag = discord.utils.get(forum.available_tags, name="Bug")
created = await forum.create_thread(
    name="Bug: login fails",
    content="Steps to reproduce…",
    embed=embed,
    applied_tags=[bug_tag] if bug_tag else [],
)
thread, starter_message = created.thread, created.message      # ThreadWithMessage

await thread.edit(applied_tags=[bug_tag, other_tag])
```

## Thread events

```python
@commands.Cog.listener()
async def on_thread_create(self, thread: discord.Thread): ...

@commands.Cog.listener()
async def on_thread_update(self, before: discord.Thread, after: discord.Thread): ...

@commands.Cog.listener()
async def on_thread_delete(self, thread: discord.Thread): ...

@commands.Cog.listener()
async def on_thread_member_join(self, member: discord.ThreadMember): ...
```

## Joining

```python
if not thread.me:
    await thread.join()   # needed to receive messages from threads the bot didn't create
```

## See also
- [Use-Case Recipes → Tickets](../Use-Case-Recipes.md#ticket-system) · [Channels](27-Channels.md)
