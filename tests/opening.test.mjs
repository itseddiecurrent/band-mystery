import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import { clues, portrait, profiles, scenes } from '../src/content.mjs';
import { dispatch, newGame, parseSave, visitDestinations } from '../src/game.mjs';

const step = (game, type) => dispatch(game, { type }).game;
function visitWithoutAdvancing(game, type, destination) {
  const response = dispatch(game, { type });
  assert.equal(response.effect, null);
  assert.deepEqual(response.game.progress, { ...game.progress, visiting: destination });
  return response.game;
}
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
  visitWithoutAdvancing(game, 'stairs', 'arthur');
  game = step(game, 'glass');
  assert.equal(step(game, 'glass'), game);
  const discovery = step(game, 'stairs');
  assert.equal(discovery.progress.dialogue.id, 'discovery');
  assert.equal(discovery.progress.profilesPending, undefined);
  game = finishDialogue(discovery);
  assert.equal(game.progress.profilesPending, 'arthur-profile');
  assert.equal(step(game, 'body'), game);
  game = parseSave(JSON.stringify(game));
  assert.equal(game.progress.profilesPending, 'arthur-profile');
  game = step(game, 'dismiss-profiles');
  assert.equal(game.progress.profilesPending, undefined);
  assert.equal(game.history.at(-1).label, '查看亚瑟的人物档案');
  assert.equal(step(game, 'dismiss-profiles'), game);
  assert.equal(step(step(game, 'back'), 'forward').progress.profilesPending, undefined);
  assert.equal(step(game, 'hand'), game);
  visitWithoutAdvancing(game, 'tony', 'tony');
  game = finishDialogue(step(game, 'body'));
  game = finishDialogue(step(game, 'hand'));
  assert.deepEqual(game.progress.clues, ['glass', 'hand']);
  assert.equal(step(game, 'hand'), game);
  assert.equal(step(game, 'tony').progress.scene, 'tony');
});

test('the investigation reaches police arrival with each clue and the device shutdown recorded once', () => {
  let game = step(finishDialogue(step(step(opening(), 'glass'), 'stairs')), 'dismiss-profiles');
  game = finishDialogue(step(game, 'body'));
  game = finishDialogue(step(game, 'hand'));

  game.progress.finished = true;
  game = parseSave(JSON.stringify(game));
  assert.equal(game.progress.finished, false);
  game = finishDialogue(step(game, 'tony'));
  assert.equal(game.progress.profilesPending, 'tony-profile');
  assert.equal(step(game, 'wake-tony'), game);
  const oldSave = structuredClone(game);
  delete oldSave.progress.profilesPending;
  assert.equal(parseSave(JSON.stringify(oldSave)).progress.profilesPending, 'tony-profile');
  game = step(game, 'dismiss-profiles');
  assert.equal(game.history.at(-1).label, '查看托尼的人物档案');
  assert.equal(parseSave(JSON.stringify(game)).progress.profilesPending, undefined);
  assert.equal(step(game, 'milk'), game);
  assert.deepEqual(visitDestinations(game.progress), ['landing', 'arthur', 'yard']);
  const upstairs = dispatch(game, { type: 'visit', scene: 'landing' }).game;
  assert.equal(upstairs.progress.visiting, 'landing');
  const arthur = dispatch(upstairs, { type: 'visit', scene: 'arthur' }).game;
  assert.deepEqual(dispatch(arthur, { type: 'hand' }), { game: arthur, effect: { panel: 'hand' } });
  const reexamination = step(arthur, 'body');
  assert.equal(reexamination.progress.dialogue.id, 'examination');
  assert.deepEqual(finishDialogue(reexamination).progress, arthur.progress);
  assert.deepEqual(dispatch(arthur, { type: 'visit', scene: 'tony' }).game.progress, game.progress);
  const scouting = visitWithoutAdvancing(game, 'backdoor', 'yard');
  const restoredVisit = parseSave(JSON.stringify(scouting));
  assert.deepEqual(visitDestinations(restoredVisit.progress), ['tony']);
  assert.equal(step(restoredVisit, 'lili-testimony'), restoredVisit);
  const drinkInspection = dispatch(restoredVisit, { type: 'drink' });
  assert.equal(drinkInspection.game, restoredVisit);
  assert.deepEqual(drinkInspection.effect, { notice: '喝了一半的饮料，没什么特别' });
  assert.equal(dispatch(restoredVisit, { type: 'visit', scene: 'cornfield' }).game, restoredVisit);
  const returnedToTony = dispatch(restoredVisit, { type: 'visit', scene: 'tony' }).game;
  assert.deepEqual(returnedToTony.progress, game.progress);
  game = returnedToTony;
  game = step(step(game, 'wake-tony'), 'forward');
  assert.deepEqual(game.progress.dialogue, { id: 'wake-tony', line: 1 });
  game = step(parseSave(JSON.stringify(game)), 'forward');
  assert.equal(game.progress.dialogue, null);
  assert.equal(game.progress.tonyAwake, true);
  game = finishDialogue(step(game, 'milk'));
  assert.equal(step(game, 'milk'), game);

  game = finishDialogue(step(game, 'backdoor'));
  assert.equal(game.progress.scene, 'lili');
  game = finishDialogue(step(game, 'lili-testimony'));
  assert.equal(game.progress.scene, 'yard');
  assert.equal(step(game, 'cornfield'), game);
  game = finishDialogue(step(game, 'drink'));
  assert.equal(step(game, 'drink'), game);
  const cornfieldClues = ['miko-knife', 'miko-wrist', 'miko-breathing'];
  for (const id of cornfieldClues) assert.equal(step(game, id), game);
  game = finishDialogue(step(game, 'cornfield'));
  assert.equal(step(game, 'fireplace').progress.scene, 'fireplace');
  for (const id of cornfieldClues) {
    const inspection = dispatch(game, { type: id });
    assert.deepEqual(inspection.effect, { panel: id });
    game = inspection.game;
    assert.equal(game.progress.clues.at(-1), id);
    assert.deepEqual(dispatch(game, { type: id }), { game, effect: { panel: id } });
  }
  game = step(game, 'fireplace');
  assert.equal(step(game, 'disable-jammer'), game);
  visitWithoutAdvancing(game, 'danzai-statement', 'yard');
  game = finishDialogue(step(game, 'jammer'));

  game = parseSave(JSON.stringify(game));
  assert.equal(game.progress.jammer, 'found');
  game = step(game, 'disable-jammer');
  assert.equal(game.progress.jammer, 'off');
  assert.deepEqual(parseSave(JSON.stringify(game)), game);
  game = step(game, 'advance');
  assert.deepEqual(game.progress.dialogue, { id: 'call-police', line: 1 });
  assert.equal(step(game, 'danzai-statement'), game);
  game = finishDialogue(parseSave(JSON.stringify(game)));
  assert.equal(game.progress.policeCalled, true);
  assert.equal(step(game, 'disable-jammer'), game);
  assert.equal(game.history.filter(row => row.label === '关闭屏蔽器，手机恢复信号').length, 1);

  game = finishDialogue(step(game, 'danzai-statement'));
  game = finishDialogue(step(game, 'danzai-testimony'));
  assert.equal(game.progress.scene, 'police');
  assert.deepEqual(game.progress.clues, ['glass', 'hand', 'milk', 'lili-testimony', 'drink', ...cornfieldClues, 'danzai-testimony']);
  assert.equal(game.history.filter(row => row.label.startsWith('已记录 · ')).length, 9);
  assert.equal(step(game, 'danzai-testimony'), game);

  assert.equal(step(game, 'ask-tony-photo'), game);
  game = finishDialogue(step(game, 'inspect-clip'));
  game = finishDialogue(step(parseSave(JSON.stringify(game)), 'ask-tony-photo'));
  assert.equal(game.progress.scene, 'group-photo');
  assert.equal(step(game, 'hospital'), game);
  assert.equal(step(game, 'open-old-photo'), game);
  game = finishDialogue(step(game, 'compare-clip'));
  assert.equal(game.progress.clues.at(-1), 'tie-clip');
  assert.equal(step(game, 'compare-clip'), game);
  const skippedPhoto = finishDialogue(step(game, 'hospital'));
  assert.equal(skippedPhoto.progress.scene, 'hospital');
  assert.equal(skippedPhoto.progress.clues.includes('old-photo'), false);
  game = step(game, 'open-old-photo');
  assert.equal(game.progress.scene, 'old-photo');
  game = step(game, 'record-old-photo');
  assert.equal(step(game, 'record-old-photo'), game);
  assert.equal(game.progress.clues.at(-1), 'old-photo');
  assert.equal(finishDialogue(step(game, 'hospital')).progress.scene, 'hospital');
});

test('refresh resumes the exact line and rewind keeps history without future clues', () => {
  let game = step(newGame(), 'advance');
  assert.deepEqual(parseSave(JSON.stringify(game)), game);
  assert.equal(parseSave('{'), null);
  game = finishDialogue(step(opening(), 'glass'));
  game = step(finishDialogue(step(game, 'stairs')), 'dismiss-profiles');
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

test('investigation artwork resolves on disk', async () => {
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
