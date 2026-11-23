import { NODE_WIDTH, NODE_HEIGHT, KINDS, STATUSES, childrenOf, descendantsOf, editTree, layoutTree, validateTree, validateProtectedNodes, isLocked } from './model.mjs';

const $ = id => document.getElementById(id);
const canvas = $('canvas'), world = $('world');
const DRAFT_KEY = 'band-mystery.story-editor.draft.v1';
let tree, layout, selectedId, revision;
let undo = [], redo = [], generation = 0, savedGeneration = 0;
let scale = 1, offset = { x: 55, y: 180 };
let saveTimer, toastTimer, typingTimer, saving = false, conflict = false, typingSnapshot;
let nodeElements = new Map();
const svgNS = 'http://www.w3.org/2000/svg';

function toast(message) {
  $('toast').textContent = message;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3200);
}
function setSaveState(message, state) {
  $('save-state').textContent = message;
  $('save-state').dataset.state = state;
}
function download(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportTree(value = tree) { if (value) download(value, `剧情树-${new Date().toISOString().slice(0, 10)}.json`); }
function storeDraft() {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ revision, tree })); }
  catch { toast('浏览器备份不可用，请保持服务运行，或导出 JSON。'); }
}
function dirty() {
  generation++;
  storeDraft();
  if (!conflict) setSaveState('未保存', 'dirty');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 700);
}
async function save() {
  clearTimeout(saveTimer);
  if (!tree || savedGeneration === generation || saving || conflict) return;
  saving = true;
  const sentGeneration = generation;
  const snapshot = structuredClone(tree);
  setSaveState('正在保存…', 'saving');
  try {
    const response = await fetch('/api/tree', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tree: snapshot, revision }) });
    const result = await response.json();
    if (response.status === 409) { conflict = true; throw new Error(result.error); }
    if (!response.ok) throw new Error(result.error || '保存失败。');
    revision = result.revision;
    savedGeneration = sentGeneration;
    if (generation === sentGeneration) {
      localStorage.removeItem(DRAFT_KEY);
      setSaveState('已保存到文档', 'saved');
    } else storeDraft();
  } catch (error) {
    storeDraft();
    setSaveState(conflict ? '文件有更新 · 点击处理' : '保存失败 · 点击重试', conflict ? 'conflict' : 'error');
    toast(error.message || '保存失败。草稿已在本机保留，可导出 JSON。');
  } finally {
    saving = false;
    if (!conflict && generation !== sentGeneration) saveTimer = setTimeout(save, 500);
  }
}

function confirmAction(title, message, accept = '确认') {
  return new Promise(resolve => {
    const dialog = $('confirm-dialog');
    $('confirm-title').textContent = title;
    $('confirm-message').textContent = message;
    $('confirm-ok').textContent = accept;
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      dialog.close();
      $('confirm-ok').onclick = null;
      $('confirm-cancel').onclick = null;
      dialog.oncancel = null;
      resolve(value);
    };
    $('confirm-ok').onclick = () => finish(true);
    $('confirm-cancel').onclick = () => finish(false);
    dialog.oncancel = event => { event.preventDefault(); finish(false); };
    dialog.showModal();
  });
}

function current() { return tree?.nodes.find(node => node.id === selectedId); }
function snapshot() { return { tree: structuredClone(tree), selectedId }; }
function remember(value = snapshot()) {
  undo.push(value);
  if (undo.length > 100) undo.shift();
  redo = [];
}
function finishTyping() {
  clearTimeout(typingTimer);
  typingSnapshot = undefined;
}
function run(action, focus = true) {
  if (!tree) return;
  finishTyping();
  try {
    const result = editTree(tree, { ...action, id: action.id ?? selectedId });
    if (JSON.stringify(result.tree) === JSON.stringify(tree)) return;
    remember();
    tree = result.tree; selectedId = result.selectedId;
    dirty(); render();
    if (focus) locate();
    if (['child', 'sibling', 'branch'].includes(action.type)) openInspector(true);
  } catch (error) { toast(error.message); }
}
function restore(direction) {
  if (!tree) return;
  finishTyping();
  const source = direction === 'undo' ? undo : redo;
  const target = direction === 'undo' ? redo : undo;
  if (!source.length) return;
  target.push(snapshot());
  ({ tree, selectedId } = source.pop());
  dirty(); render(); locate();
}
function transform() {
  world.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
  canvas.style.backgroundSize = `${100 * scale}px ${100 * scale}px, ${100 * scale}px ${100 * scale}px, ${20 * scale}px ${20 * scale}px, ${20 * scale}px ${20 * scale}px`;
  canvas.style.backgroundPosition = `${offset.x}px ${offset.y}px`;
  $('zoom-value').textContent = `${Math.round(scale * 100)}%`;
}
function zoomTo(next, point = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 }) {
  next = Math.min(1.8, Math.max(.08, next));
  offset = { x: point.x - (point.x - offset.x) * next / scale, y: point.y - (point.y - offset.y) * next / scale };
  scale = next; transform();
}
function locate() {
  const p = layout?.positions.get(selectedId);
  if (!p) return;
  if (scale < .55) scale = .85;
  offset = { x: Math.max(35, (canvas.clientWidth - NODE_WIDTH * scale) / 2) - p.x * scale, y: (canvas.clientHeight - NODE_HEIGHT * scale) / 2 - p.y * scale };
  transform();
}
function fit() {
  if (!layout) return;
  scale = Math.max(.08, Math.min(1, (canvas.clientWidth - 90) / layout.width, (canvas.clientHeight - 150) / layout.height));
  offset = { x: (canvas.clientWidth - layout.width * scale) / 2, y: (canvas.clientHeight - layout.height * scale) / 2 };
  transform();
}
function startView() {
  scale = canvas.clientWidth < 600 ? .8 : 1;
  const root = layout.positions.get(selectedId);
  offset = { x: 60 - root.x * scale, y: (canvas.clientHeight - NODE_HEIGHT * scale) / 2 - root.y * scale };
  transform();
}
function select(id, center = false) {
  if (!tree?.nodes.some(node => node.id === id)) return;
  finishTyping();
  selectedId = id;
  // Selecting from the outline/search can reveal nodes below collapsed parents.
  let ancestor = tree.nodes.find(node => node.id === id);
  const collapsed = [];
  while (ancestor?.parentId) {
    ancestor = tree.nodes.find(node => node.id === ancestor.parentId);
    if (ancestor.collapsed) collapsed.push(ancestor);
  }
  if (collapsed.length) {
    remember();
    for (const node of collapsed) node.collapsed = false;
    dirty(); render();
  } else {
    for (const [nodeId, element] of nodeElements) {
      element.classList.toggle('selected', nodeId === id);
      element.setAttribute('aria-pressed', String(nodeId === id));
    }
    renderInspector(); renderOutline(); updateButtons();
  }
  if (center) locate();
}
function openInspector(focus = false) {
  $('inspector').hidden = false; $('inspector-open').hidden = true;
  if (focus) { $('node-title').focus(); $('node-title').select(); }
}
function render() {
  layout = layoutTree(tree);
  $('tree-title').textContent = tree.title;
  $('node-count').textContent = `${tree.nodes.length} 个节点`;
  $('nodes').replaceChildren(); $('edges').replaceChildren(); nodeElements = new Map();
  const byId = new Map(tree.nodes.map(node => [node.id, node]));
  const selectedPath = new Set([selectedId]);
  let ancestor = byId.get(selectedId);
  while (ancestor?.parentId) { selectedPath.add(ancestor.parentId); ancestor = byId.get(ancestor.parentId); }
  for (const { from, to } of layout.edges) {
    const a = layout.positions.get(from), b = layout.positions.get(to);
    const x1 = a.x + NODE_WIDTH, y1 = a.y + NODE_HEIGHT / 2, x2 = b.x, y2 = b.y + NODE_HEIGHT / 2;
    const mid = x1 + (x2 - x1) / 2;
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', `M ${x1} ${y1} H ${mid} V ${y2} H ${x2 - 5}`);
    path.setAttribute('class', 'connector');
    if (selectedPath.has(to) && selectedPath.has(from)) path.style.stroke = '#d9b779';
    $('edges').append(path);
    const condition = byId.get(to).condition;
    if (condition) {
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', mid); label.setAttribute('y', Math.min(y1, y2) - 14); label.setAttribute('class', 'edge-label');
      label.textContent = condition.length > 14 ? condition.slice(0, 14) + '…' : condition;
      const title = document.createElementNS(svgNS, 'title'); title.textContent = condition; label.append(title);
      $('edges').append(label);
    }
  }
  for (const id of layout.order) {
    const node = byId.get(id), p = layout.positions.get(id);
    const card = document.createElement('div');
    card.className = 'story-node' + (id === selectedId ? ' selected' : '');
    card.style.left = `${p.x}px`; card.style.top = `${p.y}px`;
    card.dataset.id = id; card.dataset.kind = node.kind; card.dataset.status = node.status;
    card.setAttribute('role', 'button'); card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${node.title}，${STATUSES[node.status]}，${KINDS[node.kind]}`);
    card.setAttribute('aria-pressed', String(id === selectedId));
    const badge = document.createElement('span'); badge.className = `node-badge ${node.status}`;
    badge.textContent = node.status === 'current' ? '原有 · 只读' : `${STATUSES[node.status]}${node.kind === 'choice' ? ' · 选择' : node.kind === 'ending' ? ' · 结局' : ''}`;
    const title = document.createElement('span'); title.className = 'node-title'; title.textContent = node.title;
    if (badge.textContent) card.append(badge);
    card.append(title);
    card.addEventListener('click', event => { event.stopPropagation(); select(id); });
    card.addEventListener('dblclick', event => { event.stopPropagation(); select(id); openInspector(true); });
    card.addEventListener('contextmenu', event => { event.preventDefault(); select(id); contextMenu(event.clientX, event.clientY); });
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); select(id); openInspector(true); } });
    const children = childrenOf(tree, id);
    if (children.length) {
      const collapse = document.createElement('button');
      collapse.className = 'collapse-toggle'; collapse.textContent = node.collapsed ? '+' : '−';
      collapse.title = node.collapsed ? '展开后续' : '折叠后续';
      collapse.setAttribute('aria-label', `${collapse.title}：${node.title}`);
      collapse.setAttribute('aria-expanded', String(!node.collapsed));
      collapse.onclick = event => { event.stopPropagation(); run({ type: 'update', id, patch: { collapsed: !node.collapsed } }, false); };
      card.append(collapse);
    }
    $('nodes').append(card); nodeElements.set(id, card);
  }
  renderInspector(); renderOutline(); updateButtons(); transform();
}
function updateButtons() {
  const node = current();
  $('undo').disabled = !undo.length; $('redo').disabled = !redo.length;
  $('add-sibling').disabled = !node || node.parentId === null;
  for (const id of ['add-child', 'add-branch']) $(id).disabled = !node;
}
function renderInspector() {
  const node = current(); if (!node) return;
  const locked = isLocked(node);
  $('readonly-notice').hidden = !locked;
  for (const id of ['node-title', 'node-notes', 'node-kind', 'node-status', 'node-condition']) $(id).disabled = locked;
  $('node-title').value = node.title; $('node-notes').value = node.notes;
  $('node-condition').value = node.condition; $('node-condition').disabled = locked || node.parentId === null;
  $('node-kind').value = node.kind; $('node-status').value = node.status;
  $('inspector-title').textContent = KINDS[node.kind];
  $('node-position').textContent = node.parentId === null ? '故事起点' : STATUSES[node.status];
  const childCount = childrenOf(tree, node.id).length;
  $('child-count').textContent = `${childCount} 个后续`;
  $('delete-node').disabled = locked || node.parentId === null;
  const siblings = childrenOf(tree, node.parentId), siblingIndex = siblings.findIndex(row => row.id === node.id);
  $('move-up').disabled = locked || siblingIndex <= 0;
  $('move-down').disabled = locked || siblingIndex >= siblings.length - 1;
  const forbidden = descendantsOf(tree, node.id); forbidden.add(node.id);
  $('node-parent').replaceChildren();
  if (node.parentId === null) {
    const option = new Option('故事起点', ''); $('node-parent').append(option); $('node-parent').disabled = true;
  } else {
    for (const parent of tree.nodes) if (!forbidden.has(parent.id)) $('node-parent').append(new Option(parent.title, parent.id));
    $('node-parent').value = node.parentId; $('node-parent').disabled = locked;
  }
}
function renderOutline() {
  const query = $('search').value.trim().toLocaleLowerCase();
  $('outline-list').replaceChildren();
  const fullLayout = layoutTree({ ...tree, nodes: tree.nodes.map(node => ({ ...node, collapsed: false })) });
  let count = 0;
  for (const id of fullLayout.order) {
    const node = tree.nodes.find(row => row.id === id);
    if (query && !`${node.title} ${node.notes}`.toLocaleLowerCase().includes(query)) continue;
    const button = document.createElement('button'); button.className = 'outline-row' + (id === selectedId ? ' active' : '');
    const number = document.createElement('span'); number.textContent = String(++count).padStart(2, '0');
    button.append(number, document.createTextNode(node.title));
    button.onclick = () => { select(id, true); if (window.innerWidth < 760) toggleOutline(false); };
    $('outline-list').append(button);
  }
  if (!count) { const p = document.createElement('p'); p.textContent = '没有找到相关节点'; p.style.fontSize = '14px'; $('outline-list').append(p); }
}
function toggleOutline(show = $('outline').hidden) {
  $('outline').hidden = !show; $('outline-toggle').setAttribute('aria-expanded', String(show));
  if (show) $('search').focus();
}
function editField(key, value) {
  if (!current() || isLocked(current())) return;
  if (key === 'title' && !value.trim()) { $('node-title').setCustomValidity('请输入节点标题'); return; }
  if (key === 'title') $('node-title').setCustomValidity('');
  try {
    const result = editTree(tree, { type: 'update', id: selectedId, patch: { [key]: value } });
    if (JSON.stringify(result.tree) === JSON.stringify(tree)) return;
    if (!typingSnapshot) { typingSnapshot = snapshot(); remember(typingSnapshot); }
    clearTimeout(typingTimer);
    typingTimer = setTimeout(finishTyping, 1000);
    tree = result.tree; dirty();
    // Keep the caret stable while repainting the canvas and updated labels.
    const active = document.activeElement, start = active.selectionStart, end = active.selectionEnd;
    render();
    active.focus();
    if (typeof start === 'number') active.setSelectionRange(start, end);
  } catch (error) { toast(error.message); }
}
async function deleteSelected() {
  const node = current(); if (!node || isLocked(node) || node.parentId === null) return;
  const count = descendantsOf(tree, node.id).size;
  if (await confirmAction('删除这段剧情？', `将删除「${node.title}」${count ? `及其 ${count} 个后续节点` : ''}。\n删除后可以撤销。`, '删除')) run({ type: 'delete' });
}
function contextMenu(x, y) {
  const menu = $('context-menu');
  menu.hidden = false;
  for (const button of menu.querySelectorAll('button')) button.disabled = (button.dataset.action === 'sibling' && current().parentId === null) || (button.dataset.action === 'delete' && (current().parentId === null || isLocked(current())));
  menu.style.left = `${Math.min(x, window.innerWidth - menu.offsetWidth - 10)}px`;
  menu.style.top = `${Math.min(y, window.innerHeight - menu.offsetHeight - 10)}px`;
}

$('node-form').onsubmit = event => event.preventDefault();
for (const [id, key] of [['node-title', 'title'], ['node-notes', 'notes'], ['node-condition', 'condition']]) {
  $(id).addEventListener('input', event => { if (!event.isComposing) editField(key, event.target.value); });
  $(id).addEventListener('compositionend', event => editField(key, event.target.value));
  $(id).addEventListener('blur', () => { finishTyping(); if (key === 'title' && !$(id).value.trim()) { $(id).value = current().title; $(id).setCustomValidity(''); toast('标题不能为空，已保留原名称。'); } });
}
for (const [id, key] of [['node-kind', 'kind'], ['node-status', 'status']]) $(id).onchange = event => run({ type: 'update', patch: { [key]: event.target.value } }, false);
$('node-parent').onchange = event => run({ type: 'move', parentId: event.target.value });
$('add-child').onclick = () => run({ type: 'child' });
$('add-sibling').onclick = () => run({ type: 'sibling' });
$('add-branch').onclick = () => run({ type: 'branch' });
$('delete-node').onclick = deleteSelected;
$('move-up').onclick = () => run({ type: 'reorder', direction: -1 }, false);
$('move-down').onclick = () => run({ type: 'reorder', direction: 1 }, false);
$('undo').onclick = () => restore('undo'); $('redo').onclick = () => restore('redo');
$('save').onclick = async () => {
  if (!conflict) { if (savedGeneration === generation) toast('所有修改已保存。'); else await save(); return; }
  if (await confirmAction('文档已被其他窗口更新', '先导出当前草稿，然后重新载入文件中的版本。当前修改不会覆盖其他窗口的内容。', '导出并重新载入')) { exportTree(); localStorage.removeItem(DRAFT_KEY); location.reload(); }
};
$('save-state').onclick = () => $('save').click();
$('export').onclick = () => exportTree();
$('import').onclick = () => $('import-file').click();
$('import-file').onchange = async event => {
  const file = event.target.files[0]; event.target.value = ''; if (!file || !tree) return;
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error('JSON 文件请控制在 2 MB 以内。');
    const imported = validateTree(JSON.parse(await file.text()));
    validateProtectedNodes(tree, imported);
    if (!(await confirmAction('导入剧情树？', `用「${imported.title}」的 ${imported.nodes.length} 个节点替换当前画布。可以撤销，建议先导出备份。`, '导入'))) return;
    finishTyping(); remember(); tree = structuredClone(imported); selectedId = tree.nodes.find(node => node.parentId === null).id;
    dirty(); render(); startView(); toast('剧情树已导入。');
  } catch (error) { toast(error.message || '无法读取此文件。'); }
};
$('zoom-in').onclick = () => zoomTo(scale * 1.2); $('zoom-out').onclick = () => zoomTo(scale / 1.2);
$('fit').onclick = fit; $('locate').onclick = locate;
$('outline-toggle').onclick = () => toggleOutline(); $('search').oninput = renderOutline;
$('inspector-close').onclick = () => { $('inspector').hidden = true; $('inspector-open').hidden = false; };
$('inspector-open').onclick = () => openInspector();
$('context-menu').onclick = event => {
  const button = event.target.closest('button[data-action]'); if (!button) return;
  $('context-menu').hidden = true;
  if (button.dataset.action === 'delete') deleteSelected(); else run({ type: button.dataset.action });
};
document.addEventListener('pointerdown', event => { if (!event.target.closest('#context-menu')) $('context-menu').hidden = true; });
let pan, touches = new Map(), pinch;
canvas.addEventListener('pointerdown', event => {
  if (event.target.closest('.story-node') || event.button > 0) return;
  touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
  canvas.setPointerCapture(event.pointerId);
  if (touches.size === 2) {
    const [a, b] = [...touches.values()];
    pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale };
    pan = undefined;
  } else pan = { x: event.clientX, y: event.clientY, offset: { ...offset } };
  canvas.classList.add('panning'); canvas.focus({ preventScroll: true });
});
canvas.addEventListener('pointermove', event => {
  if (!touches.has(event.pointerId)) return;
  touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pinch && touches.size === 2) {
    const [a, b] = [...touches.values()], rect = canvas.getBoundingClientRect();
    zoomTo(pinch.scale * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch.distance), { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top });
  } else if (pan) {
    offset = { x: pan.offset.x + event.clientX - pan.x, y: pan.offset.y + event.clientY - pan.y }; transform();
  }
});
function endPan(event) {
  touches.delete(event.pointerId); pan = undefined; pinch = undefined;
  if (!touches.size) canvas.classList.remove('panning');
}
canvas.addEventListener('pointerup', endPan); canvas.addEventListener('pointercancel', endPan);
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  if (event.ctrlKey || event.metaKey) {
    const rect = canvas.getBoundingClientRect(); zoomTo(scale * Math.exp(-event.deltaY * .008), { x: event.clientX - rect.left, y: event.clientY - rect.top });
  } else { offset.x -= event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX; offset.y -= event.shiftKey && !event.deltaX ? 0 : event.deltaY; transform(); }
}, { passive: false });
document.addEventListener('keydown', event => {
  if ($('confirm-dialog').open) return;
  const editing = event.target.closest('input,textarea,select');
  if (event.key === 'Escape') { $('context-menu').hidden = true; if (editing) event.target.blur(); return; }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); $('save').click(); return; }
  if (editing) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); restore(event.shiftKey ? 'redo' : 'undo'); return; }
  if (!tree || event.target.closest('button,.story-node')) return;
  if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteSelected(); }
  if (event.key === 'Enter') { event.preventDefault(); run({ type: 'sibling' }); }
  if (event.key === 'Tab' && document.activeElement === canvas && !event.shiftKey) { event.preventDefault(); run({ type: 'child' }); }
  if (event.key === 'ArrowRight') { const child = childrenOf(tree, selectedId)[0]; if (child) { event.preventDefault(); select(child.id, true); } }
  if (event.key === 'ArrowLeft' && current().parentId) { event.preventDefault(); select(current().parentId, true); }
});
window.addEventListener('beforeunload', event => { if (tree && savedGeneration !== generation) { storeDraft(); event.preventDefault(); event.returnValue = ''; } });
window.addEventListener('resize', () => { $('context-menu').hidden = true; });
$('retry').onclick = () => location.reload();

async function load() {
  try {
    const response = await fetch('/api/tree');
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error);
    tree = validateTree(payload.tree); revision = payload.revision;
    let draft;
    try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) { draft = JSON.parse(raw); validateTree(draft.tree); } }
    catch { toast('浏览器备份不可用，已使用文档版本。'); }
    if (draft && JSON.stringify(draft.tree) !== JSON.stringify(tree)) {
      if (draft.revision === revision) { validateProtectedNodes(tree, draft.tree); tree = draft.tree; dirty(); toast('已恢复上次未保存的草稿。'); }
      else if (await confirmAction('发现另一份未保存草稿', '文档也已更新。可先导出浏览器草稿作备份，再使用最新文档；不会覆盖文件。', '导出旧草稿')) { exportTree(draft.tree); localStorage.removeItem(DRAFT_KEY); }
      else localStorage.removeItem(DRAFT_KEY);
    } else { try { localStorage.removeItem(DRAFT_KEY); } catch {} }
    selectedId = tree.nodes.find(node => node.parentId === null).id;
    render(); startView();
    if (window.innerWidth < 760) { $('inspector').hidden = true; $('inspector-open').hidden = false; }
    if (!generation) setSaveState('已保存到文档', 'saved');
  } catch (error) {
    $('load-error').hidden = false; $('load-error-message').textContent = error.message;
    setSaveState('读取失败', 'error');
  }
}
load();
