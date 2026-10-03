import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { levelFromXp, progressBar, xpForNextLevel } from '../src/lib/levels.js';

describe('xpForNextLevel', () => {
  it('follows 5n² + 50n + 100', () => {
    assert.equal(xpForNextLevel(0), 100);
    assert.equal(xpForNextLevel(1), 155);
    assert.equal(xpForNextLevel(10), 1100);
  });
});

describe('levelFromXp', () => {
  it('starts at level 0', () => {
    assert.deepEqual(levelFromXp(0), { level: 0, currentXp: 0, neededXp: 100 });
  });

  it('levels up exactly at the threshold', () => {
    assert.equal(levelFromXp(99).level, 0);
    assert.deepEqual(levelFromXp(100), { level: 1, currentXp: 0, neededXp: 155 });
    assert.equal(levelFromXp(255).level, 2);
  });

  it('keeps leftover XP as progress', () => {
    assert.deepEqual(levelFromXp(120), { level: 1, currentXp: 20, neededXp: 155 });
  });
});

describe('progressBar', () => {
  it('renders filled and empty segments', () => {
    assert.equal(progressBar(0, 100, 10), '▱▱▱▱▱▱▱▱▱▱');
    assert.equal(progressBar(50, 100, 10), '▰▰▰▰▰▱▱▱▱▱');
    assert.equal(progressBar(100, 100, 10), '▰▰▰▰▰▰▰▰▰▰');
  });
});
