import { clues, dialogues, portrait, profiles, scenes } from './content.mjs';
import { dispatch, newGame, parseSave, SAVE_KEY } from './game.mjs';

const byId = id => document.getElementById(id);
const asset = name => new URL('../assets/' + encodeURIComponent(name), import.meta.url).href;
const stage = byId('stage');
const lens = byId('lens');
const panel = byId('panel');
let game = null;
let saved = null;
let lensEnabled = false;
let image = null;

try {
  const raw = sessionStorage.getItem(SAVE_KEY);
  saved = parseSave(raw);
  if (raw && !saved) notify('无法恢复旧进度，请开始新游戏。');
} catch {
  notify('当前浏览器无法保存进度。');
}

function notify(message) {
  byId('notice').textContent = message;
}

function button(label, handler) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.addEventListener('click', handler);
  return element;
}

function save() {
  saved = game;
  try {
    sessionStorage.setItem(SAVE_KEY, JSON.stringify(game));
  } catch {
    notify('无法保存本次进度，刷新可能丢失。');
  }
}

function send(type, extra = {}) {
  const previous = game;
  const result = dispatch(game, { type, ...extra });
  notify(result.effect?.notice ?? '');
  game = result.game;
  if (game !== previous) {
    save();
    render();
  }
  if (result.effect?.panel) openPanel(result.effect.panel);
}

function setImage(name) {
  if (image === name) return;
  image = name;
  byId('scene').src = asset(name);
  lens.style.backgroundImage = `url("${asset(name)}")`;
  lens.hidden = true;
}

function render() {
  byId('continue').hidden = !saved;
  byId('title').hidden = Boolean(game);
  byId('game-header').hidden = !game;
  byId('tools').hidden = !game;
  byId('game').hidden = !game;
  if (!game) return;

  const progress = game.progress;
  const scene = scenes[progress.scene];
  const dialogue = progress.dialogue;
  byId('back').disabled = !game.past.length;
  byId('forward').disabled = !dialogue && !game.future.length;
  const currentLine = dialogue ? dialogues[dialogue.id][dialogue.line] : null;
  setImage(dialogue?.id === 'hand' ? clues.hand.image : scene.image);
  byId('scene').alt = dialogue?.id === 'hand' ? clues.hand.label : scene.label;
  stage.classList.toggle('speaking', Boolean(dialogue));
  byId('dialogue').hidden = !dialogue;
  if (dialogue) {
    const [speaker, line] = currentLine;
    byId('speaker').textContent = speaker ?? '';
    byId('line').textContent = line;
    const icon = byId('portrait');
    const character = speaker;
    byId('portrait-frame').hidden = !portrait[character];
    if (portrait[character]) {
      icon.src = asset(portrait[character]);
    }
  }

  const inspecting = !dialogue && !progress.finished && !progress.profilesPending;
  byId('lens-toggle').disabled = !inspecting;
  if (!inspecting) lens.hidden = true;
  const hotspots = byId('hotspots');
  const focused = document.activeElement?.dataset.hotspot;
  hotspots.replaceChildren();
  if (inspecting) {
    for (const item of scene.hotspots) {
      const target = button(item.label, () => send(item.id));
      target.className = 'hotspot';
      target.dataset.hotspot = item.id;
      for (const [index, property] of ['left', 'top', 'width', 'height'].entries()) {
        target.style[property] = item.rect[index] + '%';
      }
      hotspots.append(target);
      if (focused === item.id) target.focus();
    }
  }
  const actions = byId('actions');
  actions.replaceChildren();
  if (progress.finished) actions.append('开场试玩结束');
  else if (inspecting && progress.scene === 'arthur') {
    actions.append(button('去隔间', () => send('finish')));
  }
  if (progress.profilesPending) openPanel('profiles');
}

function appendText(container, message) {
  const paragraph = document.createElement('p');
  paragraph.textContent = message;
  container.append(paragraph);
}

function showClue(container, id) {
  const clue = clues[id];
  if (clue.image) {
    const img = document.createElement('img');
    img.src = asset(clue.image);
    img.alt = clue.label;
    container.append(img);
  }
  appendText(container, clue.detail);
}

function openPanel(kind) {
  lens.hidden = true;
  const body = byId('panel-body');
  const title = byId('panel-title');
  body.replaceChildren();
  panel.classList.toggle('cast-panel', kind === 'profiles');
  if (kind === 'profiles') {
    title.textContent = '人物档案';
    const grid = document.createElement('div');
    grid.className = 'cast-grid';
    for (const [name, role, detail] of profiles) {
      const card = document.createElement('article');
      const image = document.createElement('img');
      image.src = asset(portrait[name]);
      image.alt = '';
      const heading = document.createElement('h3');
      heading.textContent = name;
      card.append(image, heading);
      appendText(card, role);
      appendText(card, detail);
      grid.append(card);
    }
    body.append(grid);
    if (game.progress.profilesPending) body.append(button('继续调查', () => panel.close()));
  } else if (kind === 'phone') {
    title.textContent = '手机';
    body.append(button('打开手电筒', () => {
      panel.close();
      send('flashlight');
    }));
  } else if (kind === 'clues') {
    title.textContent = '线索册';
    if (!game.progress.clues.length) appendText(body, '尚未发现线索。');
    for (const id of game.progress.clues) {
      body.append(button(clues[id].label, () => openPanel(id)));
    }
  } else if (kind === 'history') {
    title.textContent = '游玩记录';
    const list = document.createElement('ol');
    game.history.forEach((row, index) => {
      const item = document.createElement('li');
      item.textContent = row.label;
      if (row.checkpoint) item.append(' ', button('从此处继续', () => {
        panel.close();
        send('rewind', { index });
      }));
      list.append(item);
    });
    body.append(list);
  } else {
    title.textContent = clues[kind].label;
    showClue(body, kind);
  }
  if (!panel.open) panel.showModal();
}

panel.addEventListener('close', () => {
  if (game?.progress.profilesPending && !panel.open) send('dismiss-profiles');
});

byId('new').onclick = () => {
  if (saved && !confirm('开始新游戏会覆盖本次进度和记录。继续吗？')) return;
  notify('');
  game = newGame();
  save();
  render();
};
byId('continue').onclick = () => {
  if (!saved) return;
  game = saved;
  render();
};
byId('exit').onclick = () => {
  if (!confirm('退出会清除本次进度及记录。继续吗？')) return;
  notify('');
  try {
    sessionStorage.removeItem(SAVE_KEY);
  } catch {
    notify('浏览器未允许清除会话存档。');
  }
  saved = game = null;
  lensEnabled = false;
  byId('lens-toggle').setAttribute('aria-pressed', 'false');
  render();
  byId('new').focus();
};
byId('back').onclick = () => send('back');
byId('forward').onclick = () => send('forward');
byId('dialogue').onclick = () => send('forward');
document.addEventListener('keydown', event => {
  const isControl = event.target instanceof Element && event.target.closest('button, input, a');
  if (event.key !== 'Enter' || panel.open || !game?.progress.dialogue) return;
  if (isControl && event.target !== byId('dialogue')) return;
  event.preventDefault();
  if (!event.repeat) send('forward');
});
document.querySelectorAll('[data-panel]').forEach(control => {
  control.onclick = () => openPanel(control.dataset.panel);
});

byId('lens-toggle').onclick = event => {
  lensEnabled = !lensEnabled;
  lens.hidden = true;
  event.currentTarget.setAttribute('aria-pressed', String(lensEnabled));
};
function placeLens(event) {
  if (!lensEnabled || !game || game.progress.dialogue || game.progress.finished || panel.open) return;
  const bounds = stage.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;
  if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) {
    lens.hidden = true;
    return;
  }
  lens.hidden = false;
  const radius = lens.offsetWidth / 2;
  const zoom = 2.4;
  lens.style.left = x + 'px';
  lens.style.top = y + 'px';
  lens.style.backgroundSize = `${bounds.width * zoom}px ${bounds.height * zoom}px`;
  lens.style.backgroundPosition = `${radius - x * zoom}px ${radius - y * zoom}px`;
}
stage.addEventListener('pointerdown', placeLens);
stage.addEventListener('pointermove', placeLens);
stage.addEventListener('pointerleave', () => { lens.hidden = true; });
render();
