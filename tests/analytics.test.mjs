import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PlayAnalytics } from '../src/analytics.mjs';
import { newGame, dispatch } from '../src/game.mjs';
import { cleanBatch, validBatch } from '../supabase/functions/game-analytics/validation.mjs';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
function fixture(options = {}) {
  let time = Date.now();
  const local = storage(), session = storage();
  const args = { local, session, uuid: randomUUID, now: () => time,
    fetcher: async () => ({ ok: false }), config: { endpoint: 'https://example.invalid/events', version: 'test' }, ...options };
  const tracker = new PlayAnalytics(args);
  return { tracker, args, advance: ms => { time += ms; }, game: newGame() };
}

test('refresh/continue resumes one analytics run; an intentional new game creates another', async () => {
  const { tracker, args, game } = fixture();
  tracker.begin(game, 'session', true);
  const id = tracker.run.id;
  const refreshed = new PlayAnalytics(args);
  refreshed.begin(game, 'session');
  assert.equal(refreshed.run.id, id);
  assert.equal(refreshed.queue.filter(e => e.kind === 'start').length, 1);
  assert.equal(refreshed.queue.filter(e => e.kind === 'resume').length, 1);
  refreshed.begin(newGame(), 'session', true);
  assert.notEqual(refreshed.run.id, id);
  assert.equal(refreshed.queue.filter(e => e.kind === 'start').length, 2);
  assert.equal(refreshed.queue.filter(e => e.kind === 'exit').length, 1);
});

test('hidden tabs and periods after 90 seconds without interaction do not inflate active playtime', () => {
  const { tracker, advance, game } = fixture();
  tracker.begin(game, 'session', true);
  advance(10_000); tracker.setVisible(false);
  advance(600_000); tracker.setVisible(true);
  advance(200_000); tracker.tick();
  assert.equal(tracker.run.active, 100_000);
  tracker.touch(); advance(20_000); tracker.tick();
  assert.equal(tracker.run.active, 120_000);
});

test('progressing dialogue is not counted as a new start, checkpoint, or decision on each line', () => {
  const { tracker, game } = fixture();
  tracker.begin(game, 'session', true);
  const next = dispatch(game, { type: 'forward' }).game;
  tracker.update(next, { type: 'forward' });
  assert.equal(tracker.queue.filter(e => e.kind === 'start').length, 1);
  assert.equal(tracker.queue.filter(e => e.kind === 'checkpoint').length, 1);
  assert.equal(tracker.queue.filter(e => e.kind === 'choice').length, 0);
  tracker.heartbeat();
  assert.equal(tracker.queue.at(-1).line, 1);
});

test('an ending is recorded once per run even after a rewind and forward', () => {
  const { tracker, game, advance } = fixture();
  tracker.begin(game, 'session', true);
  const finished = structuredClone(game);
  finished.progress.finished = true;
  finished.progress.endingId = 'good-ending';
  advance(10_000); tracker.update(finished, { type: 'forward' });
  advance(60_000); tracker.heartbeat();
  assert.equal(tracker.run.active, 10_000);
  tracker.update(game, { type: 'back' });
  tracker.update(finished, { type: 'forward' });
  assert.equal(tracker.queue.filter(e => e.kind === 'ending').length, 1);
  finished.progress.endingId = 'bad-ending';
  tracker.update(finished);
  assert.equal(tracker.queue.filter(e => e.kind === 'ending').length, 2);
});

test('offline retries preserve event IDs and clear only successfully delivered events', async () => {
  const { tracker, game, args } = fixture();
  tracker.begin(game, 'session', true);
  await new Promise(resolve => setImmediate(resolve));
  const ids = tracker.queue.map(e => e.event_id);
  const refreshed = new PlayAnalytics(args);
  assert.deepEqual(refreshed.queue.map(e => e.event_id), ids);
  await tracker.flush();
  assert.deepEqual(tracker.queue.map(e => e.event_id), ids);
  const delivered = [];
  tracker.fetcher = async (_, init) => {
    delivered.push(...JSON.parse(init.body).events);
    return { ok: true };
  };
  await tracker.flush();
  assert.deepEqual(delivered.map(e => e.event_id), ids);
  assert.equal(tracker.queue.length, 0);
});

test('turning off sharing clears pending events and stops collection', async () => {
  const { tracker, game, args } = fixture();
  tracker.begin(game, 'session', true);
  tracker.setEnabled(false);
  tracker.heartbeat(); tracker.update(game, { type: 'phone' }); tracker.begin(game, 'session', true);
  assert.equal(tracker.queue.length, 0);
  assert.equal(new PlayAnalytics(args).enabled, false);
});

test('blocked browser storage and failed network requests never prevent gameplay', async () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const { tracker, game } = fixture({ local: blocked, session: blocked, fetcher: async () => { throw new Error('offline'); } });
  assert.doesNotThrow(() => tracker.begin(game, 'session', true));
  await tracker.flush();
  assert.ok(tracker.queue.length > 0);
});

test('offline queue is bounded while preserving the initial start and ending', () => {
  const { tracker, game } = fixture();
  tracker.begin(game, 'session', true);
  for (let i = 0; i < 500; i++) tracker.heartbeat();
  game.progress.finished = true;
  tracker.update(game);
  assert.equal(tracker.queue.length, 300);
  assert.equal(tracker.queue[0].kind, 'start');
  assert.equal(tracker.queue.at(-1).kind, 'ending');
});

test('collector validates payloads, bounds fields, rejects stale events, and strips extra data', () => {
  const { tracker, game } = fixture();
  tracker.begin(game, 'session', true);
  const event = tracker.queue[0];
  assert.equal(validBatch(tracker.queue), true);
  assert.equal(validBatch([{ ...event, event_id: 'bad-id' }]), false);
  assert.equal(validBatch([{ ...event, active_ms: -1 }]), false);
  assert.equal(validBatch([{ ...event, kind: 'ending', ending: null }]), false);
  assert.equal(validBatch([{ ...event, occurred_at: '2000-01-01T00:00:00Z' }]), false);
  assert.equal(validBatch(Array(21).fill(event)), false);
  assert.equal(validBatch([]), false);
  assert.equal('email' in cleanBatch([{ ...event, email: 'never-store@example.com' }])[0], false);
});
