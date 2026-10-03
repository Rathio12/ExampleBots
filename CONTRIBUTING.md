# Contributing

Thanks for helping people learn to build Discord bots. This repository is a teaching resource, so clarity matters more than cleverness.

## Ground rules

1. **Keep the languages in sync.** Every tier has the same features in JavaScript, Python and C#. If you add `/hug` to the Python enhanced bot, add it to the other two as well (or open an issue so someone else can).
2. **Comment for beginners.** Explain *why*, not just *what*. Match the comment density of the surrounding file.
3. **Stay idiomatic.** Use each library the way its own documentation recommends (discord.js handlers, discord.py cogs, Discord.Net modules).
4. **No secrets.** Never commit `.env`, tokens, or real server/user IDs.

## Development setup

| Language | Install | Check |
|---|---|---|
| JavaScript | `npm install` | `npm test` (expert), `node --check` |
| Python | `pip install -r requirements-dev.txt` | `pytest`, `ruff check .` |
| C# | `dotnet restore` | `dotnet build`, `dotnet test` |

CI runs all of these on every pull request.

## Wiki changes

The wiki lives in [`wiki/`](wiki). Pages are plain Markdown, so you can edit them in a pull request like any other file. Keep code samples short and runnable, and show all three languages when a concept differs between them.

## Commit style

Short, imperative subject lines: `Add starboard recipe`, `Fix purge skipping pinned messages`.
