import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import { clues, portrait, profiles, scenes } from '../src/content.mjs';
import { dispatch, newGame, parseSave } from '../src/game.mjs';

const step = (game, type) => dispatch(game, { type }).game;
function finishDialogue(game) {
  for (let i = 0; game.progress.dialogue && i < 20; i++) game = step(game, 'advance');
  assert.equal(game.progress.dialogue, null);
  return game;
}
function opening() {
  let game = step(finishDialogue(newGame()), 'dismiss-profiles');
  game = finishDialogue(step(game, 'phone'));
  return step(game, 'flashlight');
}

test('opening gates must be met and clues only enter the notebook once', () => {
  let game = newGame();
  assert.equal(step(game, 'phone'), game);
  game = opening();
  assert.equal(game.progress.scene, 'landing');
  assert.equal(step(game, 'stairs'), game);
  game = step(game, 'glass');
  assert.equal(step(game, 'glass'), game);
  game = finishDialogue(step(game, 'stairs'));
  assert.equal(step(game, 'hand'), game);
  assert.equal(step(game, 'finish'), game);
  game = finishDialogue(step(game, 'body'));
  game = finishDialogue(step(game, 'hand'));
  assert.deepEqual(game.progress.clues, ['glass', 'hand']);
  assert.equal(step(game, 'hand'), game);
  assert.equal(step(game, 'finish').progress.finished, true);
});

test('refresh resumes the exact line and rewind keeps history without future clues', () => {
  let game = step(newGame(), 'advance');
  assert.deepEqual(parseSave(JSON.stringify(game)), game);
  assert.equal(parseSave('{'), null);
  game = finishDialogue(step(opening(), 'glass'));
  game = finishDialogue(step(game, 'stairs'));
  game = finishDialogue(step(game, 'body'));
  game = finishDialogue(step(game, 'hand'));
  const previousHistory = structuredClone(game.history);
  const index = game.history.findIndex(row => row.checkpoint?.dialogue.id === 'opening');
  const restored = dispatch(game, { type: 'rewind', index }).game;
  assert.equal(restored.progress.dialogue.id, 'opening');
  assert.deepEqual(restored.progress.clues, []);
  assert.deepEqual(restored.history.slice(0, previousHistory.length), previousHistory);
  assert.deepEqual(parseSave(JSON.stringify(restored)), restored);
});

test('opening artwork resolves on disk', async () => {
  const filenames = [...Object.values(scenes).map(scene => scene.image), clues.hand.image, ...Object.values(portrait)];
  await Promise.all(filenames.map(name => access(new URL('../assets/' + name, import.meta.url))));
});

test('back and forward restore story steps and clue state without duplicating the archive', () => {
  const initial = newGame();
  assert.equal(step(initial, 'back'), initial);
  const lineTwo = step(initial, 'forward');
  assert.equal(lineTwo.progress.dialogue.line, 1);
  const lineOne = step(lineTwo, 'back');
  assert.deepEqual(lineOne.progress, initial.progress);
  assert.deepEqual(step(lineOne, 'forward').history, lineTwo.history);

  const landing = opening();
  assert.equal(step(landing, 'forward'), landing);
  const glass = step(landing, 'glass');
  const beforeGlass = step(glass, 'back');
  assert.deepEqual(beforeGlass.progress.clues, []);
  const restored = step(parseSave(JSON.stringify(beforeGlass)), 'forward');
  assert.deepEqual(restored.progress.clues, ['glass']);
  assert.deepEqual(restored.history, glass.history);
  assert.deepEqual(step(beforeGlass, 'glass').future, []);
});


test('the cast page follows the waking dialogue and gates the first investigation', () => {
  const game = finishDialogue(newGame());
  assert.equal(game.progress.profilesPending, true);
  assert.equal(step(game, 'phone'), game);
  assert.equal(parseSave(JSON.stringify(game)).progress.profilesPending, true);
  const ready = step(game, 'dismiss-profiles');
  assert.equal(step(ready, 'phone').progress.dialogue.id, 'phone');
  assert.deepEqual(profiles.map(([name]) => name), Object.keys(portrait));
});
