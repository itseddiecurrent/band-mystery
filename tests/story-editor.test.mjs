import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { childrenOf, descendantsOf, editTree, layoutTree, validateTree, NODE_HEIGHT, validateProtectedNodes } from '../authoring/story-editor/model.mjs';
import { createStoryEditorServer } from '../scripts/story-editor.mjs';

const seed = JSON.parse(await readFile(new URL('../docs/story-tree.json', import.meta.url), 'utf8'));
const sample = () => ({ version: 1, title: '剧情测试', nodes: seed.nodes.slice(0, 4).map(node => ({ ...node, status: 'draft' })) });
let sequence = 0;
const id = () => `new-${++sequence}`;

test('initial editor document covers the entire existing story and stays separate from gameplay', () => {
  validateTree(seed);
  assert.equal(seed.nodes[0].title, '洛克醒来');
  assert.equal(seed.nodes.at(-1).title, '凯特与小柔私下谈话');
  assert.equal(seed.nodes.every(node => node.status === 'current'), true);
  assert.equal(seed.nodes.filter(node => node.kind === 'choice').length, 0);
});

test('adding a branch preserves the continuation and original data; siblings retain their parent', () => {
  const original = sample(), before = structuredClone(original);
  const result = editTree(original, { type: 'branch', id: 'party' }, id);
  const choice = result.tree.nodes.find(node => node.id === result.selectedId);
  assert.equal(choice.kind, 'choice');
  assert.equal(choice.parentId, 'party');
  const branches = childrenOf(result.tree, choice.id);
  assert.equal(branches.length, 2);
  assert.equal(branches[0].id, 'blackout');
  assert.deepEqual(original, before);
  const sibling = editTree(result.tree, { type: 'sibling', id: 'blackout' }, id);
  assert.equal(sibling.tree.nodes.find(node => node.id === sibling.selectedId).parentId, choice.id);
  assert.throws(() => editTree(original, { type: 'sibling', id: 'wake' }, id));
});

test('branching at a leaf creates two alternatives, while branching at a choice adds one', () => {
  const branch = editTree(sample(), { type: 'branch', id: 'blackout' }, id);
  assert.equal(childrenOf(branch.tree, branch.selectedId).length, 2);
  const another = editTree(branch.tree, { type: 'branch', id: branch.selectedId }, id);
  assert.equal(childrenOf(another.tree, branch.selectedId).length, 3);
});

test('reparenting cannot create a cycle; deletion removes only its subtree', () => {
  const branch = editTree(sample(), { type: 'branch', id: 'party' }, id);
  assert.throws(() => editTree(branch.tree, { type: 'move', id: 'party', parentId: 'blackout' }));
  assert.throws(() => editTree(branch.tree, { type: 'move', id: 'wake', parentId: 'blackout' }));
  const removed = editTree(branch.tree, { type: 'delete', id: branch.selectedId });
  assert.deepEqual(removed.tree.nodes.map(node => node.id), ['wake', 'backstage', 'party']);
  assert.equal(removed.selectedId, 'party');
  assert.throws(() => editTree(sample(), { type: 'delete', id: 'wake' }));
});

test('layout separates siblings and collapse hides descendants without deleting data', () => {
  const branch = editTree(sample(), { type: 'branch', id: 'party' }, id);
  const layout = layoutTree(branch.tree);
  const [a, b] = childrenOf(branch.tree, branch.selectedId);
  assert.ok(Math.abs(layout.positions.get(a.id).y - layout.positions.get(b.id).y) >= NODE_HEIGHT);
  const collapsed = editTree(branch.tree, { type: 'update', id: branch.selectedId, patch: { collapsed: true } });
  const hidden = layoutTree(collapsed.tree);
  assert.equal(hidden.positions.has(a.id), false);
  assert.equal(hidden.positions.has(b.id), false);
  assert.equal(descendantsOf(collapsed.tree, branch.selectedId).size, 2);
});

test('import validation rejects disconnected cycles, duplicate IDs and oversized node fields', () => {
  const disconnected = sample();
  disconnected.nodes[2].parentId = 'blackout';
  assert.throws(() => validateTree(disconnected));
  const duplicate = sample(); duplicate.nodes.push({ ...duplicate.nodes[0] });
  assert.throws(() => validateTree(duplicate));
  const oversized = sample(); oversized.nodes[1].title = 'x'.repeat(501);
  assert.throws(() => validateTree(oversized));
  const invalid = sample(); invalid.nodes[0].kind = '__proto__';
  assert.throws(() => validateTree(invalid));
});

async function fixture(t, initial = sample()) {
  const directory = await mkdtemp(join(tmpdir(), 'story-editor-test-'));
  const dataFile = join(directory, 'tree.json');
  await writeFile(dataFile, JSON.stringify(initial));
  const server = createStoryEditorServer({ dataFile });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const read = async () => (await fetch(`${url}/api/tree`)).json();
  const put = (body, headers = {}) => fetch(`${url}/api/tree`, { method: 'PUT', headers: { Origin: url, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return { url, read, put, dataFile };
}

test('server persists a valid edit and rejects stale or simultaneous writes', async t => {
  const { read, put, dataFile } = await fixture(t);
  const original = await read();
  const edited = structuredClone(original.tree); edited.nodes[1].notes = '新的中文笔记';
  const saved = await put({ tree: edited, revision: original.revision });
  assert.equal(saved.status, 200);
  const next = await read();
  assert.notEqual(next.revision, original.revision);
  assert.equal(JSON.parse(await readFile(dataFile, 'utf8')).nodes[1].notes, '新的中文笔记');
  assert.equal((await put({ tree: original.tree, revision: original.revision })).status, 409);
  const first = structuredClone(edited), second = structuredClone(edited);
  first.nodes[1].notes = 'first'; second.nodes[1].notes = 'second';
  const requests = await Promise.all([put({ tree: first, revision: next.revision }), put({ tree: second, revision: next.revision })]);
  assert.deepEqual(requests.map(r => r.status).sort(), [200, 409]);
});

test('invalid imports and cross-origin writes never alter the saved file', async t => {
  const { read, put, dataFile, url } = await fixture(t);
  const original = await read();
  const before = await readFile(dataFile, 'utf8');
  assert.equal((await put({ tree: { ...original.tree, nodes: [] }, revision: original.revision })).status, 400);
  assert.equal((await put(original, { Origin: 'https://other.example' })).status, 403);
  assert.equal((await fetch(`${url}/api/tree`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(original) })).status, 403);
  assert.equal(await readFile(dataFile, 'utf8'), before);
});

test('server exposes only authoring assets, not game configuration or unrelated files', async t => {
  const { url } = await fixture(t);
  const home = await fetch(url);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /剧情画布/);
  for (const path of ['/app.mjs', '/model.mjs', '/style.css']) assert.equal((await fetch(url + path)).status, 200);
  for (const path of ['/.env', '/src/game.mjs', '/analytics/index.html']) assert.equal((await fetch(url + path)).status, 404);
});


test('gray baseline nodes retain their text and connections while accepting new branches', () => {
  const baseline = { ...sample(), nodes: seed.nodes.slice(0, 4).map(node => ({ ...node })) };
  for (const action of [
    { type: 'update', id: 'party', patch: { title: 'changed' } },
    { type: 'update', id: 'party', patch: { status: 'draft' } },
    { type: 'move', id: 'blackout', parentId: 'wake' },
    { type: 'delete', id: 'party' },
    { type: 'update', id: 'party', patch: { notes: 'changed' } },
  ]) assert.throws(() => editTree(baseline, action, id), /只读/);
  const branch = editTree(baseline, { type: 'branch', id: 'party' }, id);
  assert.equal(branch.tree.nodes.find(node => node.id === 'blackout').parentId, 'party');
  assert.equal(childrenOf(branch.tree, 'party').length, 2);
  assert.equal(branch.tree.nodes.find(node => node.id === branch.selectedId).status, 'draft');
  validateProtectedNodes(baseline, branch.tree);
  assert.equal(editTree(baseline, { type: 'update', id: 'party', patch: { collapsed: true } }).tree.nodes.find(n => n.id === 'party').collapsed, true);
});

test('new yellow nodes can be marked implemented (green) but cannot impersonate the baseline', () => {
  const original = sample();
  const green = editTree(original, { type: 'update', id: 'party', patch: { status: 'implemented' } });
  assert.equal(green.tree.nodes.find(n => n.id === 'party').status, 'implemented');
  assert.throws(() => editTree(original, { type: 'update', id: 'party', patch: { status: 'current' } }), /新节点/);
});

test('save API protects gray nodes even if a client bypasses disabled controls', async t => {
  const original = sample(); original.nodes[0].status = 'current';
  const { read, put, dataFile } = await fixture(t, original);
  const saved = await read();
  const tampered = structuredClone(saved.tree); tampered.nodes[0].title = 'forged';
  assert.equal((await put({ tree: tampered, revision: saved.revision })).status, 400);
  assert.equal(JSON.parse(await readFile(dataFile, 'utf8')).nodes[0].title, '洛克醒来');
});
