# Testing

![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white&style=flat-square) ![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[JavaScript portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Framework** | `node:test` + `node:assert` (built in, no packages) |
| **Used in** | [03-expert/test/](../../javascript/03-expert/test) |

## Running tests

```json
"scripts": { "test": "node --test" }
```

`node --test` finds files named `*.test.js` (and files in `test/` folders) automatically.

## Unit test

```js
// test/duration.test.js
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatDuration, parseDuration } from '../src/lib/duration.js';

describe('parseDuration', () => {
  it('parses combined units', () => {
    assert.equal(parseDuration('1h30m'), 5400);
  });

  it('rejects invalid input', () => {
    for (const input of ['', 'abc', '10', '0m']) assert.equal(parseDuration(input), null);
  });
});
```

## Database test

```js
import { beforeEach, describe, it } from 'node:test';
import { openDatabase } from '../src/database/index.js';
import { createRepositories } from '../src/database/repositories.js';

const silent = { debug() {}, info() {}, warn() {}, error() {} };
let repos;
beforeEach(() => { repos = createRepositories(openDatabase(':memory:', silent)); });

it('ranks members by XP', () => {
  repos.levels.addXp('g1', 'alice', 50);
  repos.levels.addXp('g1', 'bob', 100);
  assert.equal(repos.levels.getRank('g1', 50), 2);
});
```

## Testing a command with fakes

```js
import timeout from '../src/commands/moderation/timeout.js';

it('rejects an invalid duration', async () => {
  const replies = [];
  const interaction = {
    options: { getString: () => 'banana' },
    reply: async (payload) => replies.push(payload),
  };
  await timeout.execute(interaction, { modlog: {} });
  assert.match(replies[0].content, /duration/);
});
```

## Validating every command definition

```js
import { loadModules } from '../src/loaders.js';

it('all commands produce valid JSON', async () => {
  const commands = await loadModules(new URL('../src/commands', import.meta.url).pathname);
  for (const command of commands) command.data.toJSON();   // builders throw on invalid definitions
});
```

## Mocks

```js
import { mock } from 'node:test';
const send = mock.fn(async () => {});
await notify({ send }, 'hi');
assert.equal(send.mock.callCount(), 1);
```

## In CI

The repo's [GitHub Actions workflow](../../.github/workflows/ci.yml) runs `npm ci`, a syntax check, and `npm test` for every JavaScript bot.

## See also
- [Testing](../Testing.md) (all languages) · [Project Structure](38-Project-Structure.md)
