import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatch, newGame, parseSave, visitDestinations } from '../src/game.mjs';
import { jammerSearchRoutes } from '../src/content.mjs';

const step = (game, type, extra = {}) => dispatch(game, { type, ...extra }).game;
function fixture() {
  const game = newGame();
  Object.assign(game.progress, { scene: 'cornfield', dialogue: null, danzaiReturned: true,
    tonyAwake: true, tonyProfileSeen: true, clues: ['miko-breathing'] });
  return game;
}
function finish(game) {
  for (let i = 0; game.progress.dialogue && i < 50; i++) game = step(game, 'advance');
  assert.equal(game.progress.dialogue, null);
  return game;
}

test('returning indoors starts at the backyard and every earlier search location is reachable', () => {
  const game = step(fixture(), 'search-jammer');
  assert.equal(game.progress.scene, 'yard');
  assert.equal(game.progress.searchingJammer, true);
  const seen = new Set(['yard']), queue = [game];
  while (queue.length) {
    const current = queue.shift();
    for (const destination of visitDestinations(current.progress)) {
      const next = step(current, 'visit', { scene: destination });
      assert.equal(next.progress.scene, destination);
      assert.equal(next.progress.visiting, undefined);
      assert.equal(next.progress.dialogue, null);
      assert.deepEqual(next.progress.clues, ['miko-breathing']);
      assert.ok(visitDestinations(next.progress).includes(current.progress.scene));
      if (!seen.has(destination)) { seen.add(destination); queue.push(next); }
    }
  }
  assert.deepEqual([...seen].sort(), Object.keys(jammerSearchRoutes).sort());
  assert.equal(step(game, 'visit', { scene: 'hospital' }), game);
});

test('search revisits cannot replay earlier clues, wake Tony, or jump ahead to rescue', () => {
  let game = step(fixture(), 'search-jammer');
  for (const location of ['tony', 'arthur', 'landing', 'wake']) {
    game = step(game, 'visit', { scene: location });
    const before = structuredClone(game.progress);
    for (const action of ['wake-tony', 'milk', 'phone', 'glass', 'stairs', 'body', 'hand', 'arthur-phone', 'search-rooms', 'danzai-statement', 'disable-jammer', 'jammer']) {
      assert.equal(step(game, action), game, `${action} in ${location}`);
    }
    assert.deepEqual(game.progress, before);
  }
});

test('finding the concealed device, exploring, saving, and returning still permits shutdown and rescue', () => {
  let game = step(step(fixture(), 'search-jammer'), 'visit', { scene: 'fireplace' });
  game = finish(step(game, 'jammer'));
  assert.equal(game.progress.jammer, 'found');
  game = step(step(game, 'visit', { scene: 'arthur' }), 'visit', { scene: 'tony' });
  game = parseSave(JSON.stringify(game));
  assert.equal(game.progress.scene, 'tony');
  assert.equal(game.progress.searchingJammer, true);
  assert.equal(game.progress.profilesPending, undefined);
  game = step(step(step(game, 'visit', { scene: 'yard' }), 'visit', { scene: 'fireplace' }), 'disable-jammer');
  game = finish(parseSave(JSON.stringify(game)));
  assert.equal(game.progress.policeCalled, true);
  assert.equal(game.progress.jammer, 'off');
  assert.equal(step(game, 'disable-jammer'), game);
  game = step(game, 'visit', { scene: 'yard' });
  game = finish(step(game, 'danzai-statement'));
  assert.equal(game.progress.scene, 'danzai-statement');
  assert.equal(game.progress.searchingJammer, undefined);
  game = finish(step(game, 'danzai-testimony'));
  assert.equal(game.progress.scene, 'police');
});

test('old living-room saves gain search routes and search navigation survives back/forward', () => {
  const old = fixture(); old.progress.scene = 'fireplace'; old.progress.visiting = 'yard';
  const restored = parseSave(JSON.stringify(old));
  assert.equal(restored.progress.scene, 'yard');
  assert.equal(restored.progress.searchingJammer, true);
  assert.equal(restored.progress.visiting, undefined);
  const bedroom = step(restored, 'visit', { scene: 'tony' });
  const back = step(bedroom, 'back');
  assert.equal(back.progress.scene, 'yard');
  assert.equal(step(back, 'forward').progress.scene, 'tony');
});
