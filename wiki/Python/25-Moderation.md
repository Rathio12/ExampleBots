# Moderation

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Moderation-FF453A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key APIs** | `Member.timeout`, `Member.kick`, `Guild.ban`, `Guild.unban`, `TextChannel.purge` |
| **Used in** | [03-expert moderation.py](../../python/03-expert/bot/cogs/moderation.py) |

## Actions

```python
from datetime import timedelta

await member.timeout(timedelta(minutes=10), reason="Spamming")   # max 28 days
await member.timeout(None, reason="Appeal accepted")             # remove

await member.kick(reason="Breaking rule 3")

await guild.ban(user, reason="Raiding", delete_message_seconds=86_400)   # user may have left already
await guild.unban(discord.Object(id=user_id), reason="Second chance")

ban_entry = await guild.fetch_ban(discord.Object(id=user_id))   # raises NotFound if not banned
bans = [entry async for entry in guild.bans(limit=None)]

deleted = await channel.purge(limit=50)
```

| Action | Permission |
|---|---|
| Timeout | Moderate Members |
| Kick | Kick Members |
| Ban / unban | Ban Members |
| Purge | Manage Messages (+ Read Message History) |

## A complete, safe moderation command

```python
@app_commands.command(description="Kick a member")
@app_commands.guild_only()
@app_commands.default_permissions(kick_members=True)        # 1. hidden from non-moderators
@app_commands.checks.bot_has_permissions(kick_members=True)  # 2. bot can actually do it
async def kick(
    self, interaction: discord.Interaction, member: discord.Member,
    reason: app_commands.Range[str, 1, 500] | None = None,
) -> None:
    problem = check_hierarchy(interaction.user, member)       # 3. role hierarchy
    if problem:
        return await interaction.response.send_message(f"❌ {problem}", ephemeral=True)

    reason = reason or "No reason provided"
    try:
        await member.send(f"You were kicked from {interaction.guild.name}: {reason}")   # 4. DM first
    except discord.HTTPException:
        pass
    await member.kick(reason=f"{interaction.user}: {reason}"[:512])                   # 5. real moderator in audit log

    await self.bot.modlog.log(interaction.guild, action="Kick", moderator=interaction.user, target=member, reason=reason)
    await interaction.response.send_message(f"👢 Kicked {member}.", ephemeral=True)   # 6. ephemeral confirmation
```

## Hierarchy check

```python
def check_hierarchy(moderator: discord.Member, target: discord.Member) -> str | None:
    guild = target.guild
    if target == moderator:
        return "You can't use this on yourself."
    if target.id == guild.owner_id:
        return "You can't moderate the server owner."
    if moderator.id != guild.owner_id and moderator.top_role <= target.top_role:
        return "That member has an equal or higher role than you."
    if guild.me.top_role <= target.top_role:
        return "My role is not high enough."
    return None
```

## Purge with a filter

```python
deleted = await interaction.channel.purge(
    limit=amount,
    check=(lambda m: m.author.id == user.id) if user else None,
    after=discord.utils.utcnow() - timedelta(days=14),
    oldest_first=False,
)
```

## Lockdown and slowmode

```python
await channel.set_permissions(guild.default_role, send_messages=False, reason="Lockdown")
await channel.set_permissions(guild.default_role, send_messages=None)     # back to inherit
await channel.edit(slowmode_delay=30)                                     # seconds
```

## AutoMod rules

```python
await guild.create_automod_rule(
    name="Block invites",
    event_type=discord.AutoModRuleEventType.message_send,
    trigger=discord.AutoModTrigger(regex_patterns=[r"discord\.gg/\w+"]),
    actions=[discord.AutoModRuleAction(type=discord.AutoModRuleActionType.block_message)],
    enabled=True,
)
```

## Handling errors

```python
try:
    await member.ban(reason=reason)
except discord.Forbidden:
    await interaction.response.send_message("I lack permission or my role is too low.", ephemeral=True)
```

## See also
- [Permissions](26-Permissions.md) · [Permissions & Moderation](../Permissions-and-Moderation.md) · [Audit Log System](../Audit-Log-System.md)
