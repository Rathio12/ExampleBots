# Testing

You can't unit-test Discord itself, but most bot bugs live in your own logic, and that is very testable.

## What to test

| Layer | How | In this repo |
|---|---|---|
| **Pure logic** (parsing, math, formatting) | Plain unit tests | `parseDuration`, `levelFromXp`, `progressBar` |
| **Database code** | Real SQLite in memory | Repository tests in all expert bots |
| **Command wiring** | Build every command without connecting | C# `ModuleTests`, load checks below |
| **Live interactions** | Manually, in a test server | Checklist below |

The trick: **keep logic out of handlers.** `parseDuration` lives in its own module, so it can be tested without Discord.

## Running the tests

| Language | Framework | Command |
|---|---|---|
| JavaScript | `node:test` (built in, no packages) | `npm test` |
| Python | `pytest` | `pytest` |
| C# | xUnit | `dotnet test` |

CI runs all of them on every push ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).

## Unit tests

```js
// JavaScript
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseDuration } from '../src/lib/duration.js';

describe('parseDuration', () => {
  it('parses combined units', () => assert.equal(parseDuration('1h30m'), 5400));
  it('rejects garbage', () => assert.equal(parseDuration('abc'), null));
});
```

```python
# Python
import pytest
from bot.utils.duration import parse_duration

@pytest.mark.parametrize(("text", "expected"), [("1h30m", 5400), ("2d", 172_800)])
def test_parse_valid(text, expected):
    assert parse_duration(text) == expected
```

```csharp
// C#
[Theory]
[InlineData("1h30m", 5400)]
[InlineData("2d", 172_800)]
public void Parses_valid_durations(string input, long expected) => Assert.Equal(expected, Duration.Parse(input));
```

## Database tests with in-memory SQLite

Each test gets a fresh database, so tests can't affect each other, and migrations are exercised too.

```js
beforeEach(() => { repos = createRepositories(openDatabase(':memory:', silentLogger)); });
```

```python
def test_warnings():
    async def scenario():
        db = await Database.open(":memory:")
        await db.warnings.add(1, 10, 99, "spam")
        assert len(await db.warnings.list(1, 10)) == 1
        await db.close()
    asyncio.run(scenario())   # no pytest-asyncio plugin needed
```

```csharp
public sealed class RepositoryTests : IDisposable
{
    private readonly Database _db = Database.InMemory();
    public void Dispose() => _db.Dispose();
}
```

## Checking command wiring

```js
// JavaScript: builders validate on toJSON()
for (const c of await loadModules(join(here, 'src/commands'))) c.data.toJSON();
```

```python
# Python: load extensions into a bot that never connects
for ext in EXTENSIONS:
    await bot.load_extension(ext)
for cmd in bot.tree.get_commands():
    cmd.to_dict(bot.tree)
```

```csharp
// C#: ModuleTests builds every module with the real DI registrations
await interactions.AddModulesAsync(typeof(DiscordBotService).Assembly, services);
```

## Handlers with fakes

```js
it('rejects invalid durations', async () => {
  const replies = [];
  const interaction = { options: { getString: () => 'banana' }, reply: async (p) => replies.push(p) };
  await timeout.execute(interaction, { modlog: {} });
  assert.match(replies[0].content, /Use a duration/);
});
```

Keep fakes tiny: only what the handler touches.

## Manual checklist

- [ ] Every command responds (no "application did not respond")
- [ ] Error paths: bad input, missing permissions, user not in server
- [ ] Members without permission can't see moderation commands
- [ ] Buttons and menus work, including after a restart where expected
- [ ] Audit log: edit, delete, join, leave, kick, ban, role change, voice
- [ ] Restart: reminders and settings survive
