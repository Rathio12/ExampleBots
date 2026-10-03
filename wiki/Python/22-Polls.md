# Polls

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key classes** | `discord.Poll`, `discord.PollAnswer` |
| **Intents** | `polls` (vote events) |

Native Discord polls: Discord renders the voting UI, counts votes, and closes the poll on time.

## Creating a poll

```python
import datetime

poll = discord.Poll(
    question="What should we play tonight?",
    duration=datetime.timedelta(hours=24),     # 1 hour to 32 days
    multiple=False,
)
poll.add_answer(text="Minecraft", emoji="⛏️")
poll.add_answer(text="Valorant", emoji="🔫")
poll.add_answer(text="Among Us", emoji="🚀")

await interaction.response.send_message(poll=poll)
# or: await channel.send(poll=poll)
```

| Field | Limit |
|---|---|
| Question | 300 characters |
| Answers | up to 10, each 55 characters |

## Reading results

```python
message = await channel.fetch_message(message_id)
poll = message.poll
for answer in poll.answers:
    print(answer.text, answer.vote_count)
print("Finished:", poll.is_finalized())

voters = [user async for user in poll.answers[0].voters()]
```

## Ending early

```python
await message.end_poll()      # only for polls the bot created
```

## Vote events

```python
intents = discord.Intents.default()
intents.polls = True

@commands.Cog.listener()
async def on_poll_vote_add(self, user: discord.User | discord.Member, answer: discord.PollAnswer) -> None:
    print(f"{user} voted for {answer.text}")

@commands.Cog.listener()
async def on_poll_vote_remove(self, user, answer) -> None:
    ...
```

Raw versions (`on_raw_poll_vote_add`) fire for uncached messages.

## Native vs button polls

| | Native `discord.Poll` | Button poll (Enhanced bot) |
|---|---|---|
| Setup | A few lines | View + state |
| Survives restarts | ✅ | Needs a database |
| Custom rules (role-only, weighted) | ❌ | ✅ |

## See also
- [Buttons](12-Buttons.md) · [Sending Messages](16-Sending-Messages.md)
