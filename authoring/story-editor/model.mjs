export const NODE_WIDTH = 248;
export const NODE_HEIGHT = 124;
export const COLUMN_GAP = 86;
export const ROW_GAP = 66;
export const MAX_NODES = 2000;
export const KINDS = { scene: '剧情', choice: '选择', ending: '结局' };
export const STATUSES = { current: '原有剧情 · 只读', draft: '未实现', implemented: '已实现' };
export const isLocked = node => node?.status === 'current';

export function validateTree(value) {
  if (!value || value.version !== 1 || typeof value.title !== 'string' || !value.title.trim() || value.title.length > 200 ||
      !Array.isArray(value.nodes) || !value.nodes.length || value.nodes.length > MAX_NODES) throw new Error('剧情树格式不正确，或节点数超出限制。');
  const ids = new Set();
  let root;
  for (const node of value.nodes) {
    if (!node || typeof node.id !== 'string' || !/^[\w-]{1,100}$/.test(node.id) || ids.has(node.id) ||
        !(node.parentId === null || typeof node.parentId === 'string') ||
        typeof node.title !== 'string' || !node.title.trim() || node.title.length > 500 ||
        typeof node.notes !== 'string' || node.notes.length > 50000 ||
        typeof node.condition !== 'string' || node.condition.length > 200 ||
        !Object.hasOwn(KINDS, node.kind) || !Object.hasOwn(STATUSES, node.status) ||
        typeof node.collapsed !== 'boolean') throw new Error('节点内容不完整、重复或超出长度限制。');
    ids.add(node.id);
    if (node.parentId === null) {
      if (root) throw new Error('剧情树只能有一个起点。');
      root = node;
    }
  }
  if (!root) throw new Error('剧情树缺少起点。');
  const children = new Map(value.nodes.map(node => [node.id, []]));
  for (const node of value.nodes) {
    if (node.parentId !== null) {
      if (!ids.has(node.parentId)) throw new Error('找不到节点的上级。');
      children.get(node.parentId).push(node.id);
    }
  }
  const visited = new Set();
  const queue = [root.id];
  while (queue.length) {
    const id = queue.pop();
    if (visited.has(id)) throw new Error('剧情树不能循环连接。');
    visited.add(id);
    queue.push(...children.get(id));
  }
  if (visited.size !== value.nodes.length) throw new Error('存在循环或未连接的节点。');
  return value;
}


// Baseline content and original connections are immutable. Collapsing is only a view change.
export function validateProtectedNodes(before, after) {
  const existing = new Map(before.nodes.filter(isLocked).map(node => [node.id, node]));
  const candidate = new Map(after.nodes.map(node => [node.id, node]));
  for (const [id, node] of existing) {
    const updated = candidate.get(id);
    if (!updated || ['parentId', 'title', 'notes', 'condition', 'kind', 'status'].some(key => node[key] !== updated[key])) {
      throw new Error('灰色原有剧情为只读，不能修改、移动或删除；可以为它添加分支。');
    }
  }
  for (const node of after.nodes) if (isLocked(node) && !existing.has(node.id)) throw new Error('新节点只能标为未实现或已实现。');
  return after;
}

export function childrenOf(tree, id) { return tree.nodes.filter(node => node.parentId === id); }
export function descendantsOf(tree, id) {
  const children = new Map(tree.nodes.map(node => [node.id, []]));
  for (const node of tree.nodes) if (node.parentId !== null) children.get(node.parentId)?.push(node.id);
  const result = new Set();
  const queue = [...(children.get(id) ?? [])];
  while (queue.length) {
    const next = queue.pop();
    if (result.has(next)) continue;
    result.add(next);
    queue.push(...(children.get(next) ?? []));
  }
  return result;
}

function newNode(id, parentId, title = '新剧情') {
  return { id, parentId, title, notes: '', condition: '', kind: 'scene', status: 'draft', collapsed: false };
}

// All edits return new data so a complete action can be undone, including reparenting.
export function editTree(tree, action, idFactory = () => crypto.randomUUID()) {
  const next = structuredClone(tree);
  const node = next.nodes.find(row => row.id === action.id);
  if (!node) throw new Error('未找到节点。');
  let selectedId = node.id;
  const protectedChildren = childrenOf(next, node.id).some(isLocked);
  const branchSize = action.type === 'branch' && node.kind !== 'choice' && !protectedChildren ? (childrenOf(next, node.id).length ? 2 : 3) : 1;
  if (['child', 'sibling', 'branch'].includes(action.type) && next.nodes.length + branchSize > MAX_NODES) throw new Error('节点数已达上限。');
  if (action.type === 'child' || action.type === 'sibling') {
    if (action.type === 'sibling' && node.parentId === null) throw new Error('起点没有同级节点，请添加子节点。');
    const created = newNode(idFactory(), action.type === 'child' ? node.id : node.parentId);
    const position = action.type === 'sibling' ? next.nodes.indexOf(node) + 1 : next.nodes.length;
    next.nodes.splice(position, 0, created);
    if (action.type === 'child') node.collapsed = false;
    selectedId = created.id;
  } else if (action.type === 'branch') {
    if (node.kind === 'choice' || protectedChildren) {
      const created = newNode(idFactory(), node.id, '新分支');
      next.nodes.push(created);
      selectedId = created.id;
    } else {
      const choice = { ...newNode(idFactory(), node.id, '在这里做出选择'), kind: 'choice' };
      const continuation = childrenOf(next, node.id);
      for (const child of continuation) child.parentId = choice.id;
      const alternative = newNode(idFactory(), choice.id, '新分支');
      if (!continuation.length) next.nodes.push(newNode(idFactory(), choice.id, '分支一'));
      next.nodes.push(choice, alternative);
      selectedId = choice.id;
    }
    node.collapsed = false;
  } else if (action.type === 'update') {
    for (const key of ['title', 'notes', 'condition', 'kind', 'status', 'collapsed']) {
      if (Object.hasOwn(action.patch, key)) node[key] = action.patch[key];
    }
  } else if (action.type === 'delete') {
    if (node.parentId === null) throw new Error('不能删除剧情起点。');
    const removed = descendantsOf(next, node.id);
    removed.add(node.id);
    next.nodes = next.nodes.filter(row => !removed.has(row.id));
    selectedId = node.parentId;
  } else if (action.type === 'move') {
    const parent = next.nodes.find(row => row.id === action.parentId);
    if (node.parentId === null || !parent || parent.id === node.id || descendantsOf(next, node.id).has(parent.id)) throw new Error('不能移动到自身或后续节点中。');
    node.parentId = parent.id;
    parent.collapsed = false;
  } else if (action.type === 'reorder') {
    const siblings = childrenOf(next, node.parentId);
    const target = siblings[siblings.indexOf(node) + action.direction];
    if (target) {
      const a = next.nodes.indexOf(node), b = next.nodes.indexOf(target);
      [next.nodes[a], next.nodes[b]] = [next.nodes[b], next.nodes[a]];
    }
  } else throw new Error('不支持的操作。');
  validateTree(next);
  validateProtectedNodes(tree, next);
  return { tree: next, selectedId };
}

export function layoutTree(tree) {
  const children = new Map(tree.nodes.map(node => [node.id, []]));
  for (const node of tree.nodes) if (node.parentId !== null) children.get(node.parentId).push(node);
  const root = tree.nodes.find(node => node.parentId === null);
  const stack = [{ node: root, depth: 0, expanded: false }];
  const positions = new Map();
  const edges = [];
  let leaf = 0;
  while (stack.length) {
    const { node, depth, expanded } = stack.pop();
    const visibleChildren = node.collapsed ? [] : children.get(node.id);
    if (!expanded && visibleChildren.length) {
      stack.push({ node, depth, expanded: true });
      for (let i = visibleChildren.length - 1; i >= 0; i--) stack.push({ node: visibleChildren[i], depth: depth + 1, expanded: false });
      continue;
    }
    const y = visibleChildren.length
      ? (positions.get(visibleChildren[0].id).y + positions.get(visibleChildren.at(-1).id).y) / 2
      : leaf++ * (NODE_HEIGHT + ROW_GAP);
    positions.set(node.id, { x: depth * (NODE_WIDTH + COLUMN_GAP), y, depth });
    for (const child of visibleChildren) edges.push({ from: node.id, to: child.id });
  }
  const order = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.pop();
    order.push(node.id);
    if (!node.collapsed) queue.push(...[...children.get(node.id)].reverse());
  }
  return { positions, edges, order,
    width: Math.max(...[...positions.values()].map(p => p.x)) + NODE_WIDTH,
    height: Math.max(...[...positions.values()].map(p => p.y)) + NODE_HEIGHT };
}
