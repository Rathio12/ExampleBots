# Member Events

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Events-30D158?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Events</sub>

| | |
|---|---|
| **Events** | `on_member_join`, `on_member_remove`, `on_raw_member_remove`, `on_member_update`, `on_presence_update`, `on_user_update` |
| **Intents** | `members` ✱, `presences` ✱ (✱ privileged) |
| **Used in** | [02-enhanced welcome.py](../../python/02-enhanced/bot/cogs/welcome.py) · [03-expert audit.py](../../python/03-expert/bot/cogs/audit.py) |

## Joins

```python
@commands.Cog.listener()
async def on_member_join(self, member: discord.Member) -> None:
    channel = member.guild.system_channel
    if channel:
        await channel.send(f"Welcome {member.mention}! You are member #{member.guild.member_count}.")
    role = member.guild.get_role(AUTO_ROLE_ID)
    if role:
        await member.add_roles(role, reason="Auto-role")
```

If the server uses Membership Screening, `member.pending` is `True` until they accept the rules. Give roles in `on_member_update` when `before.pending and not after.pending`.

## Leaves and kicks

```python
@commands.Cog.listener()
async def on_member_remove(self, member: discord.Member) -> None:
    entry = None
    async for e in member.guild.audit_logs(limit=5, action=discord.AuditLogAction.kick):
        if e.target and e.target.id == member.id and (discord.utils.utcnow() - e.created_at).total_seconds() < 15:
            entry = e
            break
    if entry:
        print(f"{member} was kicked by {entry.user}: {entry.reason}")
    else:
        print(f"{member} left")
```

`on_raw_member_remove(payload)` fires even for uncached members (`payload.user`).

## Member updates

```python
@commands.Cog.listener()
async def on_member_update(self, before: discord.Member, after: discord.Member) -> None:
    if before.nick != after.nick:
        print("Nickname changed")

    added = [r for r in after.roles if r not in before.roles]
    removed = [r for r in before.roles if r not in after.roles]

    if before.premium_since is None and after.premium_since is not None:
        await after.guild.system_channel.send(f"💜 Thanks for boosting, {after.mention}!")

    if before.timed_out_until != after.timed_out_until:
        print("Timeout changed")
```

## Presence

```python
@commands.Cog.listener()
async def on_presence_update(self, before: discord.Member, after: discord.Member) -> None:
    game = next((a for a in after.activities if isinstance(a, discord.Game)), None)
    if game:
        print(f"{after} is playing {game.name}")
    print(after.status)        # discord.Status.online / idle / dnd / offline
```

Requires the Presence intent. Avoid it unless you need it.

## Global user changes

```python
@commands.Cog.listener()
async def on_user_update(self, before: discord.User, after: discord.User) -> None:
    if before.name != after.name:
        print(f"{before.name} → {after.name}")
```

## See also
- [Members](23-Members.md) · [Events](28-Events.md) · [Audit Log System](../Audit-Log-System.md)
