# Limits Cheat Sheet

Numbers you'll run into sooner or later. Discord occasionally changes limits, so if something looks off, check the [official docs](https://discord.com/developers/docs).

## Interactions

| Limit | Value |
|---|---|
| Time to send the initial response | **3 seconds** |
| Time to send follow-ups / edit the response | **15 minutes** |
| Initial responses per interaction | **1** |
| Autocomplete choices returned | **25** |
| Autocomplete response time | 3 seconds (no deferring) |

## Commands

| Limit | Value |
|---|---|
| Global slash commands per app | 100 |
| Guild slash commands per app per guild | 100 |
| Command creations per day per guild | 200 |
| Name length | 1–32 characters, lowercase, no spaces (context menus may use spaces and capitals) |
| Description length | 1–100 characters |
| Options per command | 25 |
| Choices per option | 25 |
| Subcommand nesting | group → subcommand (2 levels) |
| String option length | 0–6,000 (`min_length` / `max_length`) |

## Messages and embeds

| Limit | Value |
|---|---|
| Message content | 2,000 characters |
| Embeds per message | 10 |
| Embed title | 256 |
| Embed description | 4,096 |
| Fields per embed | 25 |
| Field name / value | 256 / 1,024 |
| Footer text | 2,048 |
| Author name | 256 |
| **Total characters across all embeds in a message** | **6,000** |
| File upload (no boost) | 10 MB |

## Components

| Limit | Value |
|---|---|
| Action rows per message | 5 |
| Buttons per action row | 5 |
| Select menus per action row | 1 (takes the whole row) |
| Options per select menu | 25 |
| Custom ID length | 100 characters |
| Button label | 80 characters |
| Modal title | 45 characters |
| Text inputs per modal | 5 |
| Text input value | 4,000 characters |

## Moderation and channels

| Limit | Value |
|---|---|
| Timeout duration | up to **28 days** |
| Ban message deletion | up to 7 days |
| Bulk delete | 2–100 messages, all younger than **14 days** |
| Channel name/topic edits | **2 per 10 minutes** per channel |
| Audit log retention | 45 days |
| Audit log reason | 512 characters |
| Channels per guild | 500 |
| Roles per guild | 250 |

## Gateway and rate limits

| Limit | Value |
|---|---|
| Global REST rate limit | 50 requests / second |
| Guilds per shard | 2,500 (sharding becomes mandatory) |
| Identify calls | 1,000 per 24 hours |
| Gateway events sent by the bot | 120 per 60 seconds per connection |
| Privileged intents without verification | until the bot is in 100 guilds |
