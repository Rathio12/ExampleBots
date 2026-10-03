// Integration test against a real (in-memory) SQLite database.
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { openDatabase } from '../src/database/index.js';
import { createRepositories } from '../src/database/repositories.js';

const silentLogger = { debug() {}, info() {}, warn() {}, error() {} };
let repos;

beforeEach(() => {
  repos = createRepositories(openDatabase(':memory:', silentLogger));
});

describe('levels', () => {
  it('accumulates XP and ranks members', () => {
    repos.levels.addXp('g1', 'alice', 50);
    assert.equal(repos.levels.addXp('g1', 'alice', 25), 75);
    repos.levels.addXp('g1', 'bob', 100);
    assert.equal(repos.levels.getRank('g1', 75), 2);
    assert.deepEqual(repos.levels.getTop('g1', 10).map((r) => r.userId), ['bob', 'alice']);
  });

  it('keeps guilds separate', () => {
    repos.levels.addXp('g1', 'alice', 50);
    assert.equal(repos.levels.getXp('g2', 'alice'), 0);
  });
});

describe('warnings', () => {
  it('adds, lists and clears', () => {
    repos.warnings.add('g1', 'u1', 'mod', 'spam');
    repos.warnings.add('g1', 'u1', 'mod', 'more spam');
    assert.equal(repos.warnings.list('g1', 'u1').length, 2);
    assert.equal(repos.warnings.clear('g1', 'u1'), 2);
    assert.equal(repos.warnings.list('g1', 'u1').length, 0);
  });
});

describe('tags', () => {
  it('refuses duplicates and escapes LIKE wildcards in search', () => {
    assert.equal(repos.tags.create('g1', 'rules', 'Be nice', 'u1'), true);
    assert.equal(repos.tags.create('g1', 'rules', 'Again', 'u1'), false);
    repos.tags.create('g1', 'faq', 'Read the FAQ', 'u1');
    assert.deepEqual(repos.tags.search('g1', 'ru'), ['rules']);
    assert.deepEqual(repos.tags.search('g1', '%'), []);
  });
});

describe('reminders', () => {
  it('returns only due reminders and enforces ownership on delete', () => {
    const due = repos.reminders.add('u1', 'c1', 'past', 1);
    repos.reminders.add('u1', 'c1', 'future', 9_999_999_999);
    assert.deepEqual(repos.reminders.due(100).map((r) => r.id), [due]);
    assert.equal(repos.reminders.removeForUser(due, 'someone-else'), false);
    assert.equal(repos.reminders.removeForUser(due, 'u1'), true);
  });
});

describe('settings', () => {
  it('stores channels and invalidates the cache', () => {
    assert.equal(repos.settings.get('g1').auditlogChannelId, null);
    repos.settings.setAuditlogChannel('g1', 'c9');
    assert.equal(repos.settings.get('g1').auditlogChannelId, 'c9');
  });
});
