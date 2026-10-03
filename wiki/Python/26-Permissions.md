# Permissions

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Moderation-FF453A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key classes** | `discord.Permissions`, `discord.PermissionOverwrite` |
| **Used in** | [03-expert settings.py](../../python/03-expert/bot/cogs/settings.py) · [checks.py](../../python/03-expert/bot/utils/checks.py) |

## Command-level

```python
@app_commands.default_permissions(manage_messages=True)       # visibility (admins can override)
@app_commands.checks.has_permissions(manage_messages=True)    # runtime check for the user
@app_commands.checks.bot_has_permissions(manage_messages=True)  # runtime check for the bot
@app_commands.checks.has_role("Moderator")                    # by role name or ID
@app_commands.checks.has_any_role("Mod", "Admin")
```

Failed checks raise `MissingPermissions`, `BotMissingPermissions`, `MissingRole`, … in the tree's error handler ([Error Handling](34-Error-Handling.md)).

### Custom checks

```python
def is_owner():
    async def predicate(interaction: discord.Interaction) -> bool:
        return await interaction.client.is_owner(interaction.user)
    return app_commands.check(predicate)

@app_commands.command()
@is_owner()
async def shutdown(self, interaction: discord.Interaction): ...
```

## Checking permissions in code

```python
interaction.permissions.ban_members                 # user's permissions in this channel
interaction.app_permissions.embed_links             # bot's permissions in this channel
member.guild_permissions.manage_guild               # server-wide
channel.permissions_for(member).send_messages       # in a specific channel
channel.permissions_for(guild.me).attach_files      # bot in a specific channel
```

Missing permission names:

```python
required = ("view_channel", "send_messages", "embed_links")
perms = channel.permissions_for(guild.me)
missing = [name for name in required if not getattr(perms, name)]
```

## Channel overwrites

```python
await channel.set_permissions(role, view_channel=True, send_messages=False)
await channel.set_permissions(member, send_messages=True)
await channel.set_permissions(role, overwrite=None)               # remove the overwrite

overwrite = discord.PermissionOverwrite(view_channel=False)
await channel.edit(overwrites={guild.default_role: overwrite, staff_role: discord.PermissionOverwrite(view_channel=True)})
```

`PermissionOverwrite` values are `True` (allow), `False` (deny) or `None` (inherit).

## Permissions objects

```python
perms = discord.Permissions(send_messages=True, embed_links=True)
perms.value                         # integer bitfield
perms.administrator
discord.Permissions.all()
discord.Permissions.none()
for name, value in perms:           # iterate (name, bool)
    ...
```

Diff two roles (from the audit log):

```python
granted = [name for name, value in after.permissions if value and not getattr(before.permissions, name)]
revoked = [name for name, value in before.permissions if value and not getattr(after.permissions, name)]
```

## Invite link with permissions

```python
url = discord.utils.oauth_url(bot.user.id, permissions=discord.Permissions(8192 | 2048), scopes=("bot", "applications.commands"))
```

## See also
- [Moderation](25-Moderation.md) · [Roles](24-Roles.md) · [Permissions & Moderation](../Permissions-and-Moderation.md)
