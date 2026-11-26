import assert from 'node:assert/strict';
import test from 'node:test';
import { dialogues, scenes, clues, reviewGroups } from '../src/content.mjs';
import { newGame, dispatch, parseSave } from '../src/game.mjs';
import { storylineFor, storylineNodes, storylineEdges } from '../src/storyline.mjs';
import { t } from '../src/i18n.mjs';

const step = (game, type, extra = {}) => dispatch(game, { type, ...extra }).game;
function finish(game) {
  for (let i = 0; game.progress.dialogue && i < 80; i++) game = step(game, 'advance');
  assert.equal(game.progress.dialogue, null);
  return game;
}
const nodeAt = (game, id) => {
  const nodes = storylineFor(game).nodes;
  return nodes.find(node => node.id === id) ?? nodes.flatMap(node => node.details).find(node => node.id === id) ?? { unlocked: false, recorded: false };
};
function examined() {
  let game = step(finish(newGame()), 'dismiss-profiles');
  game = step(finish(step(game, 'phone')), 'flashlight');
  game = step(game, 'glass');
  game = step(finish(step(game, 'stairs')), 'dismiss-profiles');
  return finish(step(game, 'body'));
}

test('a new game exposes only its current story node, with no locked titles or ending metadata', () => {
  const game = newGame();
  const before = JSON.stringify(game);
  const map = storylineFor(game);
  assert.equal(map.currentId, 'wake');
  assert.equal(map.unlockedCount, 1);
  for (const node of map.nodes.filter(node => !node.unlocked)) {
    assert.equal(node.title, null);
    assert.equal(node.image, null);
    assert.equal(node.optional, false);
    assert.equal(node.review, false);
    assert.equal(node.ending, false);
    assert.equal(node.checkpointIndex, -1);
  }
  assert.ok(!JSON.stringify(map).includes('蛋仔'));
  assert.ok(!JSON.stringify(map).includes('作案'));
  assert.equal(JSON.stringify(game), before);
});

test('the graph is one route regardless of investigation order and covers every implemented dialogue', () => {
  const dialogueIds = storylineNodes.flatMap(node => node.dialogueIds);
  assert.deepEqual([...dialogueIds].sort(), Object.keys(dialogues).sort());
  assert.equal(new Set(storylineNodes.map(node => node.id)).size, storylineNodes.length);
  assert.equal(storylineEdges.length, storylineNodes.length - 1);
  assert.ok(storylineNodes.every(node => node.column === 0));
  for (let i = 1; i < storylineNodes.length; i++) assert.deepEqual(storylineEdges[i - 1], [storylineNodes[i - 1].id, storylineNodes[i].id]);
  assert.deepEqual(storylineNodes.flatMap(node => node.details).filter(node => node.optional).map(node => node.id), ['phone', 'old-photo', 'message']);
  assert.equal(storylineNodes.filter(node => node.ending).length, 1);
  for (const node of storylineNodes) {
    for (const id of node.clueIds ?? []) assert.ok(Object.hasOwn(clues, id));
    for (const id of node.sceneIds ?? []) assert.ok(Object.hasOwn(scenes, id));
    assert.ok(!/\p{Script=Han}/u.test(t(node.title, {}, 'en')), node.title);
  }
  const byId = new Map(storylineNodes.map(node => [node.id, node]));
  for (const [from, to] of storylineEdges) {
    assert.ok(byId.has(from) && byId.has(to));
    assert.ok(byId.get(from).row <= byId.get(to).row);
  }
});

test('optional clues remain hidden until explored and stay revealed after rewind and save recovery', () => {
  let game = examined();
  assert.equal(nodeAt(game, 'phone').unlocked, false);
  game = step(game, 'arthur-phone');
  assert.equal(nodeAt(game, 'phone').unlocked, true);
  assert.equal(nodeAt(game, 'phone').recorded, true);
  const start = game.history.findIndex(row => row.checkpoint?.dialogue?.id === 'opening');
  game = step(game, 'rewind', { index: start });
  assert.equal(nodeAt(game, 'phone').unlocked, true);
  assert.equal(nodeAt(game, 'phone').recorded, false);
  assert.equal(storylineFor(game).currentId, 'wake');
  const restored = parseSave(JSON.stringify(game));
  assert.ok(restored);
  assert.deepEqual(storylineFor(restored), storylineFor(game));
  assert.equal(nodeAt(newGame(), 'phone').unlocked, false, 'Starting a new game resets the per-save map.');
});

test('an opened photo is revealed, but only its recorded clue counts on the current route', () => {
  const game = newGame();
  game.progress = { scene: 'old-photo', dialogue: null, clues: ['tie-clip'], examined: true, finished: false };
  assert.equal(nodeAt(game, 'old-photo').unlocked, true);
  assert.equal(nodeAt(game, 'old-photo').recorded, false);
  const recorded = step(game, 'record-old-photo');
  assert.equal(nodeAt(recorded, 'old-photo').recorded, true);
  assert.equal(nodeAt(recorded, 'message').unlocked, false);
});

test('review order stays within one chapter and a failed accusation never unlocks the successful accusation', () => {
  function review(order) {
    let game = newGame();
    game.history = [];
    game.past = [];
    game.progress = { scene: 'review', dialogue: null, clues: ['tony-pillow', 'miko-testimony', 'tie-clip', 'danzai-testimony'], reviewedGroups: [], examined: true, finished: false };
    for (const group of order) game = finish(step(game, 'review-group', { group }));
    return game;
  }
  const groups = Object.keys(reviewGroups);
  const partial = review(groups.slice(0, 2));
  assert.equal(nodeAt(partial, groups[0]).unlocked, true);
  assert.equal(nodeAt(partial, groups[2]).unlocked, false);
  const a = review(groups);
  const b = review([...groups].reverse());
  assert.deepEqual(storylineFor(a).nodes.map(node => node.unlocked), storylineFor(b).nodes.map(node => node.unlocked));
  const failed = step(a, 'solve', { suspect: '威利' });
  assert.equal(nodeAt(failed, 'accuse').unlocked, false);
  const solved = step(a, 'solve', { suspect: '蛋仔' });
  assert.equal(nodeAt(solved, 'accuse').unlocked, true);
  assert.equal(storylineFor(solved).currentId, 'accuse');
  assert.equal(nodeAt(solved, 'confrontation').unlocked, false);
});

test('legacy history restores visited nodes and saved checkpoints can revisit without losing discoveries', () => {
  const game = examined();
  const body = nodeAt(game, 'body');
  assert.ok(body.checkpointIndex >= 0);
  const revisited = step(game, 'rewind', { index: body.checkpointIndex });
  assert.equal(revisited.progress.dialogue.id, 'discovery');
  const legacy = structuredClone(game);
  legacy.past = [];
  legacy.future = [];
  legacy.history = legacy.history.map(({ label }) => ({ label }));
  assert.equal(nodeAt(legacy, 'backstage').unlocked, true);
  assert.equal(nodeAt(legacy, 'body').unlocked, true);
  assert.equal(nodeAt(legacy, 'private').unlocked, false);
  legacy.history.push({ label: '剧情结束' });
  const ending = nodeAt(legacy, 'ending');
  assert.equal(ending.unlocked, true);
  assert.equal(ending.current, false);
});


test('revealed thumbnails reference shipped assets and locked nodes never expose them', async () => {
  const { access } = await import('node:fs/promises');
  const game = newGame();
  // Archived checkpoints reveal the complete map without changing the current route.
  game.history = Object.keys(dialogues).map(id => ({ checkpoint: { dialogue: { id }, clues: [], scene: 'wake' } }));
  game.history.push({ label: '剧情结束' }, { checkpoint: { scene: 'bedroom-hall', searchingJammer: true, clues: [] } });
  const map = storylineFor(game);
  assert.equal(map.unlockedCount, 26);
  for (const node of map.nodes) {
    assert.ok(node.image);
    await access(new URL(`../assets/${node.image}`, import.meta.url));
    assert.ok(node.chapter >= 0 && node.chapter < 6);
  }
});
