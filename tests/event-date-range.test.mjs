import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEventDateRange } from '../src/lib/event-date-range.ts';

test('event date range accepts a valid inclusive start and exclusive end', () => {
  assert.deepEqual(parseEventDateRange('2026-02-01', '2026-03-01'), { from: '2026-02-01', to: '2026-03-01' });
});

test('event date range accepts no filters', () => {
  assert.deepEqual(parseEventDateRange(null, null), { from: null, to: null });
});

test('event date range rejects malformed and impossible calendar dates', () => {
  assert.equal(parseEventDateRange('2026-2-01', null), null);
  assert.equal(parseEventDateRange('2026-02-30', null), null);
  assert.equal(parseEventDateRange(null, ''), null);
});

test('event date range rejects equal or reversed bounds', () => {
  assert.equal(parseEventDateRange('2026-03-01', '2026-03-01'), null);
  assert.equal(parseEventDateRange('2026-03-02', '2026-03-01'), null);
});
