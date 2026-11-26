import { storylineFor } from './storyline.mjs?v=storyline-1';
import { t } from './i18n.mjs?v=storyline-1';

const WIDTH = 360;
const STEP_X = 244;
const STEP_Y = 118;
const NODE_W = 218;
const NODE_H = 88;
const point = node => ({ x: 71 + node.column * STEP_X, y: 24 + node.row * STEP_Y });
const element = (tag, className, text) => {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text) result.textContent = text;
  return result;
};
const control = (label, action) => {
  const button = element('button', '', t(label));
  button.type = 'button';
  button.onclick = action;
  return button;
};

export function renderStoryline(body, game, onRewind) {
  const model = storylineFor(game);
  const byId = new Map(model.nodes.map(node => [node.id, node]));
  const height = (Math.max(...model.nodes.map(node => node.row)) + 1) * STEP_Y + 32;
  body.append(element('p', 'storyline-intro', t('当前实装只有一条剧情路线；调查与复查顺序不会产生分支。')));
  body.append(element('p', 'storyline-help', t('仅展示本次存档已探索的内容；回退不会隐藏已看过的路线。')));
  const toolbar = element('div', 'storyline-toolbar');
  const progress = element('span', 'storyline-progress', t('已探索 {count} / {total}', { count: model.unlockedCount, total: model.nodes.length }));
  toolbar.append(progress);
  const viewport = element('div', 'storyline-scroll');
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-label', t('剧情路线图，可横向与纵向滚动'));
  const size = element('div', 'storyline-size');
  const canvas = element('div', 'storyline-canvas');
  canvas.style.width = `${WIDTH}px`;
  canvas.style.height = `${height}px`;
  size.append(canvas);
  viewport.append(size);
  let zoom = 1;
  const nodeButtons = new Map();
  const zoomValue = element('output', 'storyline-zoom', '100%');
  zoomValue.setAttribute('aria-label', t('缩放比例'));
  function center(id) {
    const node = byId.get(id);
    if (!node) return;
    const { x, y } = point(node);
    viewport.scrollTo({ left: (x + NODE_W / 2) * zoom - viewport.clientWidth / 2,
      top: (y + NODE_H / 2) * zoom - viewport.clientHeight / 2 });
  }
  function setZoom(value) {
    const x = (viewport.scrollLeft + viewport.clientWidth / 2) / zoom;
    const y = (viewport.scrollTop + viewport.clientHeight / 2) / zoom;
    zoom = Math.max(.6, Math.min(1.4, Math.round(value * 10) / 10));
    canvas.style.transform = `scale(${zoom})`;
    size.style.width = `${WIDTH * zoom}px`;
    size.style.height = `${height * zoom}px`;
    zoomValue.textContent = `${Math.round(zoom * 100)}%`;
    smaller.disabled = zoom <= .6;
    larger.disabled = zoom >= 1.4;
    viewport.scrollTo({ left: x * zoom - viewport.clientWidth / 2, top: y * zoom - viewport.clientHeight / 2 });
  }
  const smaller = control('缩小路线图', () => setZoom(zoom - .1));
  const larger = control('放大路线图', () => setZoom(zoom + .1));
  smaller.textContent = '−';
  larger.textContent = '+';
  smaller.setAttribute('aria-label', t('缩小路线图'));
  larger.setAttribute('aria-label', t('放大路线图'));
  toolbar.append(control('定位当前位置', () => center(model.currentId)), control('从头查看', () => center('wake')), smaller, zoomValue, larger);
  body.append(toolbar);
  const legend = element('div', 'storyline-legend');
  for (const [kind, text] of [['current', '当前位置'], ['unlocked', '已探索'], ['locked', '未探索']]) {
    legend.append(element('span', `storyline-key ${kind}`, t(text)));
  }
  body.append(legend, viewport);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(WIDTH));
  svg.setAttribute('height', String(height));
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('storyline-connections');
  for (const edge of model.edges) {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    const a = point(from);
    const b = point(to);
    const path = document.createElementNS(svg.namespaceURI, 'path');
    if (from.row === to.row) {
      path.setAttribute('d', `M ${a.x + NODE_W} ${a.y + NODE_H / 2} H ${b.x}`);
    } else {
      const mid = (a.y + NODE_H + b.y) / 2;
      path.setAttribute('d', `M ${a.x + NODE_W / 2} ${a.y + NODE_H} V ${mid} H ${b.x + NODE_W / 2} V ${b.y}`);
    }
    path.classList.add(edge.unlocked ? 'unlocked' : 'locked');
    svg.append(path);
  }
  canvas.append(svg);
  const detail = element('div', 'storyline-detail');
  detail.setAttribute('aria-live', 'polite');
  function select(node) {
    for (const [id, button] of nodeButtons) button.setAttribute('aria-pressed', String(id === node.id));
    detail.replaceChildren(element('h3', '', t(node.title)));
    const description = node.optional ? (node.chosen ? '这项可选调查的线索已记入当前进度。' : '此前已探索这项调查，当前进度尚未记录对应线索。') :
      node.review ? '这项复查已探索；四项复查可按任意顺序进行。' : '已到达这段剧情，可回看已记录的探索。';
    detail.append(element('p', '', t(description)));
    if (node.details.length) {
      const list = element('ul', 'storyline-investigations');
      for (const item of node.details) {
        const label = item.unlocked ? t(item.title) : '???';
        const status = !item.unlocked ? t('未探索') : item.recorded ? t('本路线已记录') : t('已探索');
        list.append(element('li', item.unlocked ? '' : 'locked', `${label} · ${status}`));
      }
      detail.append(list);
    }
    if (node.checkpointIndex >= 0) detail.append(control('从此处继续', () => onRewind(node.checkpointIndex)));
  }
  for (const node of model.nodes) {
    const button = element('button', `storyline-node ${node.unlocked ? 'unlocked' : 'locked'}${node.current ? ' current' : ''}`);
    button.type = 'button';
    button.dataset.storyNode = node.id;
    button.disabled = !node.unlocked;
    const position = point(node);
    Object.assign(button.style, { left: `${position.x}px`, top: `${position.y}px`, width: `${NODE_W}px`, height: `${NODE_H}px` });
    button.append(element('strong', '', node.unlocked ? t(node.title) : '???'));
    const status = node.current ? '当前位置' : !node.unlocked ? '未探索' : node.optional ? (node.chosen ? '本路线已记录' : '此前已探索') : '已探索';
    button.append(element('span', '', t(status)));
    if (node.current) button.setAttribute('aria-current', 'step');
    if (node.unlocked) {
      button.setAttribute('aria-pressed', 'false');
      button.onclick = () => select(node);
    }
    nodeButtons.set(node.id, button);
    canvas.append(button);
  }
  body.append(detail);
  const active = byId.get(model.currentId) ?? model.nodes.find(node => node.unlocked);
  if (active) select(active);
  setZoom(1);
  // openPanel mounts this into the native dialog before the next frame.
  requestAnimationFrame(() => {
    if (!viewport.isConnected) return;
    center(model.currentId);
  });
}
