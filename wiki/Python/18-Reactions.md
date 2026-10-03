# Reactions

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Messages-32ADE6?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Messages & components</sub>

| | |
|---|---|
| **Key APIs** | `add_reaction`, `Reaction.users()`, `on_reaction_add`, `on_raw_reaction_add`, `wait_for` |
| **Intents** | `reactions` (included in `Intents.default()`) |

## Adding reactions

```python
await message.add_reaction("👍")
await message.add_reaction("<:pepe:123456789012345678>")
await message.add_reaction(guild.get_emoji(123456789012345678))

for emoji in ("1️⃣", "2️⃣", "3️⃣"):
    await message.add_reaction(emoji)
```

## Reading reactions

```python
message = await channel.fetch_message(message_id)   # reactions are on the fetched message
for reaction in message.reactions:
    print(reaction.emoji, reaction.count)
    users = [u async for u in reaction.users()]
```

## Removing

```python
await message.remove_reaction("👍", member)   # someone else's needs Manage Messages
await message.clear_reaction("👍")             # all of one emoji
await message.clear_reactions()                # everything
```

## Events: cached vs raw

| Event | Fires for | Arguments |
|---|---|---|
| `on_reaction_add` / `on_reaction_remove` | Cached messages only | `reaction, user` |
| `on_raw_reaction_add` / `on_raw_reaction_remove` | **All** messages | `payload` |

Use the raw events for anything that must work on old messages (reaction roles, starboards):

```python
@commands.Cog.listener()
async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent) -> None:
    if payload.user_id == self.bot.user.id or payload.message_id != ROLE_MESSAGE_ID:
        return
    role_id = ROLE_BY_EMOJI.get(str(payload.emoji))
    if role_id and payload.member:                                # member is set for guild reactions
        await payload.member.add_roles(discord.Object(id=role_id))


@commands.Cog.listener()
async def on_raw_reaction_remove(self, payload: discord.RawReactionActionEvent) -> None:
    guild = self.bot.get_guild(payload.guild_id)
    member = guild.get_member(payload.user_id) if guild else None   # payload.member is None on remove
    role_id = ROLE_BY_EMOJI.get(str(payload.emoji))
    if member and role_id:
        await member.remove_roles(discord.Object(id=role_id))
```

## Waiting for a reaction

```python
message = await channel.send("React with ✅ to confirm (30 s)")
await message.add_reaction("✅")

def check(reaction: discord.Reaction, user: discord.User) -> bool:
    return user == author and str(reaction.emoji) == "✅" and reaction.message.id == message.id

try:
    await bot.wait_for("reaction_add", check=check, timeout=30)
    await channel.send("Confirmed!")
except asyncio.TimeoutError:
    await channel.send("Timed out.")
```

Buttons are usually nicer for confirmations ([Buttons](12-Buttons.md)).

## See also
- [Use-Case Recipes → Starboard](../Use-Case-Recipes.md#starboard) · [Events](28-Events.md)
