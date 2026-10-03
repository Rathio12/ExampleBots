# Security Best Practices

A bot often has more power than most members of a server. Treat it accordingly.

## 1. Protect the token

- Store it in `.env` or the host's secret manager. **Never** hard-code it.
- `.env` must be in `.gitignore` (it is in this repo). Commit `.env.example` with placeholders instead.
- Never paste it into Discord, screenshots, pastebins or forum posts.
- Leaked? Developer Portal → Bot → **Reset Token**. Deleting the commit isn't enough: scrapers copy tokens within seconds.
- Beware "free hosting" and "token checker" sites. Many exist to collect tokens.

## 2. Least privilege

- Request only the permissions you use. **Avoid Administrator.**
- Request only the intents you use. Privileged intents expose personal data.
- Put default member permissions on every sensitive command.

## 3. Never let user input ping people

User text (tags, poll questions, reminders, AI output, nicknames) can contain `@everyone`:

```js
new Client({ allowedMentions: { parse: ['users'] } });                 // safe default
channel.send({ content: userText, allowedMentions: { parse: [] } });   // user content: ping nobody
```

```python
commands.Bot(..., allowed_mentions=discord.AllowedMentions(everyone=False, roles=False, users=True))
await channel.send(user_text, allowed_mentions=discord.AllowedMentions.none())
```

```csharp
await channel.SendMessageAsync(userText, allowedMentions: AllowedMentions.None);
```

## 4. Validate everything

- Discord validates option types and ranges, but **autocomplete values and custom IDs can be anything**. Re-check them.
- Check **who** clicked a button. Anyone who can see the message can click it.
- Check the role hierarchy before moderation actions.
- Reject unexpected characters (e.g. tag names must match `^[a-z0-9_-]{1,32}$`).

## 5. SQL injection

Always use parameters (`?`, `$name`) and escape `%`/`_` in `LIKE` patterns. See [Databases & Persistence](Databases-and-Persistence.md).

## 6. No `eval` commands

"Owner-only eval" commands are a classic full compromise: one bug in the owner check and anyone runs code on your server.

## 7. Rate-limit your own commands

Cooldowns protect against spam and against API bills (AI and other paid APIs).

## 8. Safe HTTP

- Timeouts on every request (`AbortSignal.timeout`, `aiohttp.ClientTimeout`, `HttpClient.Timeout`).
- Treat **user-supplied URLs** as hostile: they can target internal addresses such as `169.254.169.254` (SSRF). Allow-list domains or block private IP ranges.
- Never send your token or API keys to third parties.

## 9. Personal data

- Store only what you need. Message logs are personal data.
- Scope everything by `guild_id`. Delete a guild's data when the bot is removed, if you promise to.
- Public bots need a privacy policy for verification.
- Follow Discord's [Developer Policy](https://discord.com/developers/docs/policies-and-agreements/developer-policy).

## 10. Dependencies

- Dependabot is configured in this repo.
- `npm audit`, `pip-audit`, `dotnet list package --vulnerable`.
- Pin major versions (`^14`, `>=2.5,<3`).

## 11. Run unprivileged

The Docker images use a non-root user, and the systemd example uses a dedicated `bot` user.

## Checklist

- [ ] Token only in `.env` / secrets, ignored by git
- [ ] No Administrator permission, only needed intents
- [ ] Safe `allowedMentions` default
- [ ] Moderation commands: default permissions + hierarchy checks
- [ ] Parameterised SQL
- [ ] Cooldowns on expensive commands, timeouts on HTTP
- [ ] Dependencies monitored, runs as non-root
