import { storylineFor, storylineChapters } from './storyline.mjs?v=storyline-2';
import { t } from './i18n.mjs?v=storyline-2';

// Map coordinates describe the route, while the HUD remains anchored to the viewport.
const NODE_W = 224;
const NODE_H = 126;
const GAP = 330;
const HEIGHT = 680;
const levels = [290, 170, 330, 250, 390, 230, 340, 190];
const point = node => ({ x: 160 + node.row * GAP, y: levels[node.row % levels.length] });
const element = (tag, className, text) => {
  const result = document.createElement(tag);
  if (className) result.className = className;
  if (text) result.textContent = text;
  return result;
};
const control = (label, action, className = '') => {
  const button = element('button', className, t(label));
  button.type = 'button';
  button.onclick = action;
  return button;
};

export function renderStoryline(body, game, onRewind) {
  const model = storylineFor(game);
  const byId = new Map(model.nodes.map(node => [node.id, node]));
  const width = model.nodes.length * GAP + 160;
  const chapterRail = element('nav', 'storyline-chapters');
  chapterRail.setAttribute('aria-label', t('剧情章节'));
  const viewport = element('div', 'storyline-scroll');
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-label', t('剧情路线图，可横向与纵向滚动'));
  const size = element('div', 'storyline-size');
  const canvas = element('div', 'storyline-canvas');
  Object.assign(canvas.style, { width: `${width}px`, height: `${HEIGHT}px` });
  size.append(canvas);
  viewport.append(size);
  const footer = element('footer', 'storyline-footer');
  const progress = element('div', 'storyline-progress');
  progress.append(element('span', '', t('剧情探索度')));
  const meter = element('progress');
  meter.max = model.nodes.length;
  meter.value = model.unlockedCount;
  meter.setAttribute('aria-label', t('已探索 {count} / {total}', { count: model.unlockedCount, total: model.nodes.length }));
  const percent = element('div', 'storyline-percent');
  percent.append(element('strong', '', String(Math.round(model.unlockedCount / model.nodes.length * 100))), element('span', '', '%'));
  progress.append(meter, percent);
  const detail = element('div', 'storyline-detail');
  detail.setAttribute('aria-live', 'polite');
  const controls = element('div', 'storyline-controls');
  const zoomValue = element('output', 'storyline-zoom', '100%');
  zoomValue.setAttribute('aria-label', t('缩放比例'));
  let zoom = 1;
  let verticalOffset = 0;
  let selected = model.currentId ?? model.nodes[0].id;
  let viewTarget = selected;
  let selectedChapter = byId.get(selected)?.chapter ?? 0;
  const nodeButtons = new Map();
  const chapterButtons = [];
  function center(id) {
    const node = byId.get(id);
    if (!node) return;
    viewTarget = id;
    const { x, y } = point(node);
    viewport.scrollTo({ left: (x + NODE_W / 2) * zoom - viewport.clientWidth / 2,
      top: verticalOffset + (y + NODE_H / 2) * zoom - viewport.clientHeight / 2 });
  }
  function setZoom(value) {
    zoom = Math.max(.6, Math.min(2, Math.round(value * 10) / 10));
    canvas.style.transform = `scale(${zoom})`;
    size.style.width = `${width * zoom}px`;
    verticalOffset = Math.max(0, (viewport.clientHeight - HEIGHT * zoom) / 2);
    canvas.style.top = `${verticalOffset}px`;
    size.style.height = `${Math.max(viewport.clientHeight, HEIGHT * zoom)}px`;
    zoomValue.textContent = `${Math.round(zoom * 100)}%`;
    smaller.disabled = zoom <= .6;
    larger.disabled = zoom >= 2;
    center(viewTarget);
  }
  function markChapter(chapter) {
    selectedChapter = chapter;
    chapterButtons.forEach((button, index) => button.setAttribute('aria-current', index === chapter ? 'page' : 'false'));
  }
  function select(node) {
    selected = node.id;
    markChapter(node.chapter);
    for (const [id, button] of nodeButtons) button.setAttribute('aria-pressed', String(id === selected));
    detail.replaceChildren();
    const heading = element('div', 'storyline-selection');
    heading.append(element('span', 'storyline-selected-status', t(node.current ? '当前位置' : '已探索')), element('h3', '', t(node.title)));
    detail.append(heading);
    if (node.details.length) {
      const investigations = element('details', 'storyline-investigations');
      investigations.append(element('summary', '', t('调查记录')));
      const list = element('ul');
      for (const item of node.details) {
        const row = element('li', item.unlocked ? '' : 'locked');
        row.append(element('span', '', item.unlocked ? t(item.title) : '???'), element('small', '', t(!item.unlocked ? '未探索' : item.recorded ? '本路线已记录' : '已探索')));
        list.append(row);
      }
      investigations.append(list);
      detail.append(investigations);
    }
    if (node.checkpointIndex >= 0) detail.append(control('从此处继续', () => onRewind(node.checkpointIndex), 'storyline-resume'));
  }
  for (let chapter = 0; chapter < storylineChapters.length; chapter++) {
    const first = model.nodes.find(node => node.chapter === chapter);
    const known = model.nodes.some(node => node.chapter === chapter && node.unlocked);
    const button = control('剧情路线', () => { markChapter(chapter); center(first.id); }, 'storyline-chapter');
    button.replaceChildren(element('span', 'storyline-chapter-number', String(chapter + 1).padStart(2, '0')), element('span', 'storyline-chapter-name', known ? t(storylineChapters[chapter]) : '???'));
    button.setAttribute('aria-label', t('第 {number} 章：{title}', { number: chapter + 1, title: known ? t(storylineChapters[chapter]) : '???' }));
    chapterButtons.push(button);
    chapterRail.append(button);
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(HEIGHT));
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('storyline-connections');
  for (const edge of model.edges) {
    const a = point(byId.get(edge.from));
    const b = point(byId.get(edge.to));
    const x1 = a.x + NODE_W;
    const y1 = a.y + NODE_H / 2;
    const x2 = b.x;
    const y2 = b.y + NODE_H / 2;
    const mid = (x1 + x2) / 2;
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', `M ${x1} ${y1} H ${mid - 12} Q ${mid} ${y1} ${mid} ${y1 + Math.sign(y2 - y1) * 12} V ${y2 - Math.sign(y2 - y1) * 12} Q ${mid} ${y2} ${mid + 12} ${y2} H ${x2}`);
    path.classList.add(edge.unlocked ? 'unlocked' : 'locked');
    svg.append(path);
  }
  canvas.append(svg);
  for (const node of model.nodes) {
    const button = element('button', `storyline-node ${node.unlocked ? 'unlocked' : 'locked'}${node.current ? ' current' : ''}`);
    button.type = 'button';
    button.dataset.storyNode = node.id;
    button.disabled = !node.unlocked;
    const position = point(node);
    Object.assign(button.style, { left: `${position.x}px`, top: `${position.y}px`, width: `${NODE_W}px`, height: `${NODE_H}px` });
    button.append(element('strong', 'storyline-node-title', node.unlocked ? t(node.title) : '???'));
    if (node.image) {
      const image = element('img');
      image.src = new URL(`../assets/${node.image}`, import.meta.url).href;
      image.alt = '';
      image.draggable = false;
      button.append(image);
    } else button.append(element('span', 'storyline-unknown-art', '—'));
    const status = element('span', 'storyline-node-status', t(node.current ? '当前位置' : node.unlocked ? '已探索' : '未探索'));
    button.append(status);
    if (node.current) button.setAttribute('aria-current', 'step');
    if (node.unlocked) {
      button.setAttribute('aria-pressed', 'false');
      button.onclick = event => { if (!dragged || event.detail === 0) select(node); };
      button.onkeydown = event => {
        const direction = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
        if (!direction) return;
        event.preventDefault();
        const target = model.nodes[node.row + direction];
        if (target?.unlocked) { select(target); center(target.id); nodeButtons.get(target.id).focus({ preventScroll: true }); }
      };
    }
    nodeButtons.set(node.id, button);
    canvas.append(button);
  }
  const smaller = control('缩小路线图', () => setZoom(zoom - .2));
  const larger = control('放大路线图', () => setZoom(zoom + .2));
  smaller.setAttribute('aria-label', t('缩小路线图'));
  larger.setAttribute('aria-label', t('放大路线图'));
  smaller.textContent = '−';
  larger.textContent = '+';
  controls.append(smaller, zoomValue, larger, control('定位当前位置', () => {
    const active = byId.get(model.currentId);
    if (active) { select(active); center(active.id); nodeButtons.get(active.id).focus({ preventScroll: true }); }
  }, 'storyline-locate'));
  footer.append(progress, detail, controls);
  const hint = element('p', 'storyline-pan-hint', t('拖动浏览 · 单一路线'));
  body.append(chapterRail, viewport, hint, footer);
  let dragged = false;
  let drag = null;
  viewport.onpointerdown = event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    dragged = false;
    drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
  };
  viewport.onpointermove = event => {
    if (!drag) return;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 5) {
      dragged = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('dragging');
      viewport.scrollTo(drag.left + drag.x - event.clientX, drag.top + drag.y - event.clientY);
    }
  };
  const endDrag = () => { drag = null; viewport.classList.remove('dragging'); };
  viewport.onpointerup = endDrag;
  viewport.onpointercancel = endDrag;
  viewport.onlostpointercapture = endDrag;
  // A regular mouse wheel pans along the route; trackpads retain two-axis scrolling.
  viewport.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) > 0 || event.shiftKey) return;
    event.preventDefault();
    viewport.scrollLeft += event.deltaY;
  }, { passive: false });
  const active = byId.get(selected);
  if (active) select(active);
  const resize = new ResizeObserver(() => {
    if (!viewport.isConnected) { resize.disconnect(); return; }
    setZoom(zoom);
  });
  resize.observe(viewport);
  body.closest('dialog')?.addEventListener('close', () => resize.disconnect(), { once: true });
  requestAnimationFrame(() => {
    if (!viewport.isConnected) return;
    setZoom(1);
    markChapter(selectedChapter);
    nodeButtons.get(selected)?.focus({ preventScroll: true });
    // Poll input only while this overlay is on top; discovery rendering is event-driven.
    let previous = [];
    let lastMove = 0;
    const controller = now => {
      const panel = body.closest('dialog');
      if (!panel?.open || !panel.classList.contains('storyline-panel') || !viewport.isConnected) return;
      const pad = [...(navigator.getGamepads?.() ?? [])].find(Boolean);
      if (pad) {
        const pressed = pad.buttons.map(button => button.pressed);
        if (pressed[1] && !previous[1]) { panel.close(); return; }
        const direction = pressed[14] || pad.axes[0] < -.5 ? -1 : pressed[15] || pad.axes[0] > .5 ? 1 : 0;
        if (direction && now - lastMove > 220) {
          const node = model.nodes[byId.get(selected).row + direction];
          if (node?.unlocked) { select(node); center(node.id); nodeButtons.get(node.id).focus({ preventScroll: true }); }
          lastMove = now;
        }
        if (pressed[0] && !previous[0]) detail.querySelector('button')?.click();
        for (const [key, delta] of [[4, -1], [5, 1]]) if (pressed[key] && !previous[key]) chapterButtons[Math.max(0, Math.min(5, selectedChapter + delta))].click();
        previous = pressed;
      }
      requestAnimationFrame(controller);
    };
    requestAnimationFrame(controller);
  });
}
