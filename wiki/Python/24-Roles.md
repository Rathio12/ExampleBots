# Roles

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Server-FF9F0A?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Servers, members & moderation</sub>

| | |
|---|---|
| **Key class** | `discord.Role` |
| **Permission** | Manage Roles. The bot's top role must be above the role it manages. |

## Finding roles

```python
role = guild.get_role(123456789012345678)
role = discord.utils.get(guild.roles, name="Moderator")
everyone = guild.default_role
roles = await guild.fetch_roles()
```

## Assigning and removing

```python
await member.add_roles(role, reason="Verified")
await member.add_roles(role_a, role_b)
await member.remove_roles(role)
await member.add_roles(discord.Object(id=role_id))      # by ID without fetching

has_role = role in member.roles
has_any = any(r.name in {"Admin", "Mod"} for r in member.roles)
```

## Creating roles

```python
role = await guild.create_role(
    name="Event Winner",
    colour=discord.Colour.gold(),
    hoist=True,                                   # show separately in the member list
    mentionable=False,
    permissions=discord.Permissions(send_messages=True, attach_files=True),
    reason="Monthly event",
)
```

Gradient role colours: `secondary_colour=` / `tertiary_colour=` (server feature required).

## Editing and deleting

```python
await role.edit(name="Champion", colour=discord.Colour.red(), hoist=False)
await role.edit(position=5)
await role.edit(permissions=discord.Permissions.none())
await role.delete(reason="Event over")
```

## Role attributes

| Attribute | Meaning |
|---|---|
| `role.name`, `role.id`, `role.mention` | |
| `role.colour` | `discord.Colour` |
| `role.position` | Higher = more powerful |
| `role.permissions` | `discord.Permissions` |
| `role.members` | Cached members with the role |
| `role.managed` | Owned by an integration/bot (can't be assigned) |
| `role.is_assignable()` | Can the bot assign it? |
| `role.hoist`, `role.mentionable` | |

Roles compare by position: `role_a > role_b`.

## Hierarchy check

```python
if not role.is_assignable():
    return await interaction.response.send_message(
        "My role must be above that role. Move it higher in Server Settings → Roles.", ephemeral=True)
```

## Level roles

```python
LEVEL_ROLES = {5: 111111111111111111, 10: 222222222222222222}

async def on_level_up(member: discord.Member, level: int) -> None:
    role_id = LEVEL_ROLES.get(level)
    if role_id:
        await member.add_roles(discord.Object(id=role_id), reason=f"Reached level {level}")
```

## See also
- [Members](23-Members.md) · [Permissions](26-Permissions.md) · [Select Menus](13-Select-Menus.md)
