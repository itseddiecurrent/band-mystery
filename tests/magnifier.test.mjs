import assert from 'node:assert/strict';
import test from 'node:test';
import { dispatch, newGame, parseSave } from '../src/game.mjs';
import { scenes } from '../src/content.mjs';
import { magnifierClues, pointInHotspot } from '../src/magnifier.mjs';
import { lensAction } from './lens-actions.mjs';

const locations = { glass: 'landing', hand: 'arthur', drink: 'yard', 'miko-knife': 'cornfield',
  'miko-wrist': 'cornfield', 'miko-missing-shoe': 'cornfield', 'compare-clip': 'group-photo' };
function atTarget(type) {
  const game = newGame();
  game.progress = { scene: locations[type], dialogue: null, clues: [], examined: true, finished: false,
    tonyAwake: true, tonyProfileSeen: true };
  game.past = []; game.future = []; game.history = [];
  return game;
}
const finish = game => {
  for (let i = 0; game.progress.dialogue && i < 40; i++) game = dispatch(game, { type: 'advance' }).game;
  assert.equal(game.progress.dialogue, null);
  return game;
};

test('all seven clues require a magnifier inspection at their actual scene target', () => {
  assert.equal(Object.keys(magnifierClues).length, 7);
  for (const [type, clue] of Object.entries(magnifierClues)) {
    const game = atTarget(type);
    const before = JSON.stringify(game);
    assert.equal(dispatch(game, { type }).game, game, `${type}: ordinary action must not discover it`);
    const correct = lensAction(game, { type });
    for (const inspection of [undefined, { tool: 'mouse', scene: game.progress.scene, point: correct.inspection.point },
      { tool: 'magnifier', scene: 'wake', point: correct.inspection.point },
      { tool: 'magnifier', scene: game.progress.scene, point: [0, 0] },
      { tool: 'magnifier', scene: game.progress.scene, point: [NaN, 50] },
      { tool: 'magnifier', scene: game.progress.scene, point: [50] }]) {
      assert.equal(dispatch(game, { type, inspection }).game, game, type);
    }
    assert.equal(JSON.stringify(game), before);
    const discovered = finish(dispatch(game, correct).game);
    assert.ok(discovered.progress.clues.includes(clue), type);
    assert.equal(discovered.progress.clues.filter(id => id === clue).length, 1);
    assert.ok(parseSave(JSON.stringify(discovered)), type);
    assert.deepEqual(dispatch(discovered, { type }).game.progress.clues, discovered.progress.clues);
  }
});

test('the lens cannot inspect a clue through dialogue, profile overlays or the wrong location', () => {
  for (const type of Object.keys(magnifierClues)) {
    const game = atTarget(type);
    const action = lensAction(game, { type });
    for (const patch of [{ dialogue: { id: 'opening', line: 0 } }, { profilesPending: true },
      { finished: true }, { scene: 'wake' }]) {
      const blocked = structuredClone(game); Object.assign(blocked.progress, patch);
      assert.equal(dispatch(blocked, action).game, blocked, type);
    }
  }
});

test('Arthur’s hand remains lens-only during revisits and early drink scouting does not collect evidence', () => {
  const game = atTarget('hand');
  game.progress.scene = 'tony'; game.progress.visiting = 'arthur';
  assert.equal(dispatch(game, { type: 'hand' }).game, game);
  const found = dispatch(game, lensAction(game, { type: 'hand' })).game;
  assert.ok(found.progress.clues.includes('hand'));
  const drink = atTarget('drink');
  drink.progress.scene = 'tony'; drink.progress.visiting = 'yard';
  const response = dispatch(drink, lensAction(drink, { type: 'drink' }));
  assert.equal(response.game, drink);
  assert.ok(!response.game.progress.clues.includes('drink'));
});

test('rewind removes the found clue and collecting it again still needs the lens; old recorded clues remain usable', () => {
  const game = atTarget('glass');
  const found = dispatch(game, lensAction(game, { type: 'glass' })).game;
  const back = dispatch(found, { type: 'back' }).game;
  assert.ok(!back.progress.clues.includes('glass'));
  assert.equal(dispatch(back, { type: 'glass' }).game, back);
  assert.deepEqual(dispatch(back, { type: 'forward' }).game.progress, found.progress);
  const restored = parseSave(JSON.stringify(found));
  assert.equal(dispatch(restored, { type: 'glass' }).effect.panel, 'glass');
});

test('non-selected clues retain their original direct interactions and hit tests reject out-of-bounds values', () => {
  const game = atTarget('miko-wrist');
  assert.ok(dispatch(game, { type: 'miko-breathing' }).game.progress.clues.includes('miko-breathing'));
  const body = atTarget('hand'); body.progress.examined = false;
  assert.equal(dispatch(body, { type: 'body' }).game.progress.dialogue.id, 'examination');
  assert.equal(pointInHotspot([50, 50], [45, 45, 10, 10]), true);
  assert.equal(pointInHotspot([60, 50], [45, 45, 10, 10]), false);
  for (const [type, location] of Object.entries(locations)) assert.ok(scenes[location].hotspots.some(item => item.id === type));
});
