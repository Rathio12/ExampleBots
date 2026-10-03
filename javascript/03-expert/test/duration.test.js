// Run with: npm test   (uses Node's built-in test runner — no extra packages)
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatDuration, parseDuration } from '../src/lib/duration.js';

describe('parseDuration', () => {
  it('parses single units', () => {
    assert.equal(parseDuration('30s'), 30);
    assert.equal(parseDuration('10m'), 600);
    assert.equal(parseDuration('2h'), 7200);
    assert.equal(parseDuration('1d'), 86_400);
    assert.equal(parseDuration('1w'), 604_800);
  });

  it('parses combined units, spaces and upper case', () => {
    assert.equal(parseDuration('1h30m'), 5400);
    assert.equal(parseDuration('1d 12h'), 129_600);
    assert.equal(parseDuration('2H'), 7200);
  });

  it('rejects invalid input', () => {
    for (const input of ['', 'abc', '10', 'm10', '10x', '0m', '-5m', '1.5h', null, undefined]) {
      assert.equal(parseDuration(input), null, `expected null for ${input}`);
    }
  });
});

describe('formatDuration', () => {
  it('formats seconds into readable parts', () => {
    assert.equal(formatDuration(0), '0s');
    assert.equal(formatDuration(59), '59s');
    assert.equal(formatDuration(5400), '1h 30m');
    assert.equal(formatDuration(694_861), '1w 1d 1h 1m 1s');
  });

  it('round-trips with parseDuration', () => {
    assert.equal(parseDuration(formatDuration(129_600).replace(/ /g, '')), 129_600);
  });
});
