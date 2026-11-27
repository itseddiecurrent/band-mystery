import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, dispatch, parseSave, visitDestinations } from '../src/game.mjs';
import { dialogues, sodaChoices } from '../src/content.mjs';
import { storylineFor } from '../src/storyline.mjs';
import { localizedHistory, localizedLine, setLanguage, t } from '../src/i18n.mjs';

const step = (game, type, extra = {}) => dispatch(game, { type, ...extra }).game;
const finish = game => {
  for (let count = 0; game.progress.dialogue && count < 80; count++) game = step(game, 'advance');
  assert.equal(game.progress.dialogue, null);
  return game;
};
const atChoice = () => finish(newGame());

test('the show flashback leads to the party conversation, a clear soda insert, and a gated choice', () => {
  let game = newGame();
  for (const _ of dialogues.opening) game = step(game, 'advance');
  for (const _ of dialogues['opening-backstage']) game = step(game, 'advance');
  assert.deepEqual(game.progress.dialogue, { id: 'party-soda', line: 0 });
  assert.equal(game.progress.scene, 'party');
  assert.match(localizedLine(game.progress, 'en')[1], /thirsty, Lili/);
  game = step(step(game, 'advance'), 'advance');
  assert.equal(localizedLine(game.progress, 'en')[2].image, 'party-soda-closeup.png');
  assert.equal(localizedLine(game.progress, 'en')[2].focusObject, true);
  game = step(game, 'advance');
  assert.equal(game.progress.sodaChoicePending, true);
  for (const action of ['advance', 'phone', 'flashlight', 'backdoor', 'lili-testimony']) assert.equal(step(game, action), game);
  assert.equal(step(game, 'choose-soda', { id: 'invalid' }), game);
  assert.equal(step(newGame(), 'choose-soda', { id: 'lili' }).progress.sodaChoice, undefined);
  assert.deepEqual(parseSave(JSON.stringify(game)), game);
  assert.ok(game.history.some(row => row.checkpoint?.sodaChoicePending));
});

test('taking Lili’s can keeps her awake and pauses without entering the original investigation or an ending', () => {
  let game = step(atChoice(), 'choose-soda', { id: 'lili' });
  assert.equal(game.progress.liliAwake, true);
  game = finish(game);
  assert.equal(game.progress.partyRoutePaused, true);
  assert.equal(game.progress.finished, false);
  assert.equal(game.progress.scene, 'party');
  assert.equal(game.progress.sodaChoicePending, undefined);
  assert.deepEqual(visitDestinations(game.progress), []);
  for (const action of ['advance', 'phone', 'backdoor', 'lili-testimony', 'drink', 'hospital']) assert.equal(step(game, action), game);
  assert.deepEqual(parseSave(JSON.stringify(game)), game);
  const map = storylineFor(game);
  assert.equal(map.currentId, 'soda-lili');
  const awake = map.nodes.find(node => node.id === 'soda-lili');
  const fridge = map.nodes.find(node => node.id === 'soda-fridge');
  assert.equal(awake.chosen, true);
  assert.equal(awake.paused, true);
  assert.equal(fridge.unlocked, false);
  assert.equal(fridge.title, null);
  assert.equal(fridge.image, null);
  assert.ok(map.edges.some(edge => edge.from === 'party' && edge.to === 'soda-lili' && edge.unlocked));
  assert.ok(!map.edges.some(edge => edge.from === 'soda-lili'));
  assert.equal(map.nodes.find(node => node.id === 'backyard').unlocked, false);
  assert.equal(map.nodes.find(node => node.id === 'ending').unlocked, false);
});

test('fridge choice preserves Miko’s scene and reaches the original drowsy Lili route', () => {
  let game = step(atChoice(), 'choose-soda', { id: 'fridge' });
  assert.equal(game.progress.liliAwake, false);
  for (const _ of dialogues['party-soda-fridge']) game = step(game, 'advance');
  assert.equal(game.progress.dialogue.id, 'opening-memory');
  assert.match(dialogues['opening-memory'][6][1], /水/);
  game = step(finish(game), 'dismiss-profiles');
  game = step(finish(step(game, 'phone')), 'flashlight');
  game = step(game, 'glass');
  game = step(finish(step(game, 'stairs')), 'dismiss-profiles');
  game = finish(step(game, 'body'));
  game = finish(step(game, 'hand'));
  game = step(finish(step(game, 'tony')), 'dismiss-profiles');
  game = finish(step(game, 'wake-tony'));
  game = finish(step(game, 'milk'));
  game = finish(step(game, 'tony-pillow'));
  game = finish(step(game, 'backdoor'));
  assert.equal(game.progress.scene, 'lili');
  assert.equal(game.progress.liliAwake, false);
  assert.equal(game.progress.partyRoutePaused, undefined);
});

test('back, forward, rewind and locale switches preserve or replace the choice without leaking route state', () => {
  const choice = atChoice();
  const taken = step(choice, 'choose-soda', { id: 'lili' });
  assert.deepEqual(step(step(taken, 'back'), 'forward').progress, taken.progress);
  const paused = finish(taken);
  const checkpoint = paused.history.findIndex(row => row.checkpoint?.sodaChoicePending);
  const restored = step(parseSave(JSON.stringify(paused)), 'rewind', { index: checkpoint });
  assert.equal(restored.progress.sodaChoice, undefined);
  assert.equal(restored.progress.partyRoutePaused, undefined);
  const fridge = step(restored, 'choose-soda', { id: 'fridge' });
  assert.equal(fridge.progress.liliAwake, false);
  assert.deepEqual(fridge.future, []);
  const fork = storylineFor(fridge).nodes.filter(node => ['soda-lili', 'soda-fridge'].includes(node.id));
  assert.deepEqual(fork.map(node => [node.id, node.unlocked, node.chosen]), [['soda-lili', true, false], ['soda-fridge', true, true]]);
  const serialized = JSON.stringify(fridge);
  setLanguage('en');
  assert.ok(localizedHistory(fridge.history, 'en').every(text => !/\p{Script=Han}/u.test(text)));
  for (const choice of sodaChoices) assert.ok(!/\p{Script=Han}/u.test(t(choice.label)));
  setLanguage('zh');
  assert.equal(JSON.stringify(fridge), serialized);
});

test('old saves skip the new decision and invalid branch flags are rejected', () => {
  const old = newGame();
  old.progress.dialogue = { id: 'opening-memory', line: 1 };
  old.progress.scene = 'wake';
  let restored = parseSave(JSON.stringify(old));
  assert.ok(restored);
  restored = finish(restored);
  assert.equal(restored.progress.profilesPending, true);
  assert.equal(restored.progress.sodaChoice, undefined);
  for (const patch of [{ sodaChoice: 'other' }, { liliAwake: 'yes' }, { partyRoutePaused: true }, { sodaChoicePending: true }]) {
    const bad = structuredClone(old);
    Object.assign(bad.progress, patch);
    assert.equal(parseSave(JSON.stringify(bad)), null);
  }
});
