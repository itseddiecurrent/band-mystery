import { arthurRelationships, characterProfileNames, clues, dialogues, portrait, profiles, scenes } from './content.mjs';
import { canEnterCornfield, dispatch, newGame, parseSave, SAVE_KEY, visitDestinations } from './game.mjs';

const byId = id => document.getElementById(id);
const asset = name => new URL('../assets/' + encodeURIComponent(name), import.meta.url).href;
const stage = byId('stage');
const lens = byId('lens');
const panel = byId('panel');
const SESSION_KEY = 'band-mystery.web-session.v1';
let sessionId = null;
let game = null;
let saved = null;
let lensEnabled = false;
let image = null;

function notify(message) {
  byId('notice').textContent = message;
}

function updateSessionId(id) {
  const url = new URL(location.href);
  if (id) url.searchParams.set('session_id', id);
  else url.searchParams.delete('session_id');
  if (url.href !== location.href) history.replaceState(history.state, '', url);
  sessionId = id;
}

function readSession(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: sessionId, game: saved }));
}

function initializeSession() {
  const requestedId = new URL(location.href).searchParams.get('session_id');
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const stored = readSession(raw);
    if (requestedId && stored?.id === requestedId) {
      saved = parseSave(JSON.stringify(stored.game));
      if (stored.game === null || saved) {
        sessionId = requestedId;
        return;
      }
      notify('无法恢复旧进度，请开始新游戏。');
    }

    const legacy = raw === null && !window.opener ? sessionStorage.getItem(SAVE_KEY) : null;
    if (legacy) {
      saved = parseSave(legacy);
      if (!saved) notify('无法恢复旧进度，请开始新游戏。');
    }

    updateSessionId(crypto.randomUUID());
    persistSession();
    if (legacy !== null) sessionStorage.removeItem(SAVE_KEY);
  } catch {
    if (!sessionId) updateSessionId(crypto.randomUUID());
    notify('无法保存本次进度，刷新可能丢失。');
  }
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
  if (!sessionId) updateSessionId(crypto.randomUUID());
  try {
    persistSession();
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
  const location = progress.visiting ?? progress.scene;
  const scene = scenes[location];
  const dialogue = progress.dialogue;
  byId('back').disabled = !game.past.length;
  byId('forward').disabled = !dialogue && !game.future.length;
  const currentLine = dialogue ? dialogues[dialogue.id][dialogue.line] : null;
  setImage(dialogue?.id === 'hand' ? clues.hand.image : scene.image);
  byId('scene').alt = dialogue?.id === 'hand' ? clues.hand.label : scene.label;
  const jammerLight = byId('jammer-light');
  jammerLight.hidden = location !== 'fireplace';
  jammerLight.classList.toggle('off', progress.jammer === 'off');
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

  const exploring = !dialogue && !progress.finished && !progress.profilesPending;
  const inspecting = exploring && !progress.visiting;
  const inTonyChapter = progress.scene === 'tony';
  const beforeWakingTony = inTonyChapter && !progress.tonyAwake;
  byId('lens-toggle').disabled = !exploring || (!progress.visiting && !scene.hotspots.length);
  if (byId('lens-toggle').disabled) lens.hidden = true;
  const hotspots = byId('hotspots');
  const focused = document.activeElement?.dataset.hotspot;
  hotspots.replaceChildren();
  if (exploring) {
    for (const item of scene.hotspots) {
      const earlyDrink = location === 'yard' && item.id === 'drink' && (!progress.tonyAwake || inTonyChapter);
      const revisitArthur = inTonyChapter && location === 'arthur' &&
        (item.id === 'body' || (item.id === 'hand' && progress.clues.includes('hand')));
      if (!inspecting && !earlyDrink && !revisitArthur) continue;
      if (beforeWakingTony && item.id === 'milk') continue;
      if (progress.tonyAwake && item.id === 'wake-tony') continue;
      if (item.id === 'cornfield' && !canEnterCornfield(progress)) continue;
      if (item.id === 'jammer' && progress.jammer) continue;
      const target = button(item.label, () => send(item.id));
      target.className = 'hotspot';
      if (item.id === 'danzai-testimony') {
        target.classList.add('visible-hotspot');
      }
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
  if (inspecting) {
    if (progress.scene === 'arthur') actions.append(button('去隔间', () => send('tony')));
    if (progress.scene === 'cornfield') actions.append(button('回屋找设备', () => send('fireplace')));
    if (progress.scene === 'fireplace' && progress.jammer === 'found') {
      actions.append(button('关闭设备', () => send('disable-jammer')));
    }
    if (progress.scene === 'fireplace') {
      if (progress.policeCalled) actions.append('手机已恢复信号。 ');
      actions.append(button('去后门', () => send('danzai-statement')));
    }
    if (progress.scene === 'police') actions.append(button('查看领带夹', () => send('inspect-clip')));
    if (progress.scene === 'clip-detail') actions.append(button('问托尼', () => send('ask-tony-photo')));
    if (progress.scene === 'group-photo' && progress.clues.includes('tie-clip')) {
      actions.append(button('翻看去年夏天的合照', () => send('open-old-photo')));
    }
    if (progress.scene === 'old-photo') actions.append(button('查看去年夏天的合照', () => send('record-old-photo')));
    if (['group-photo', 'old-photo'].includes(progress.scene) && progress.clues.includes('tie-clip')) {
      actions.append(button('去医院', () => send('hospital')));
    }
  }
  if (exploring && (progress.visiting || inTonyChapter)) {
    const labels = { landing: '回楼上', arthur: '回去检查亚瑟尸体' };
    for (const destination of visitDestinations(progress)) {
      if (inspecting && inTonyChapter && destination === 'yard') {
        const label = progress.clues.includes('milk') ? '去后门' : '去后院';
        actions.append(button(label, () => send('backdoor')));
        continue;
      }
      const label = inTonyChapter ? labels[destination] : undefined;
      actions.append(button(label ?? `去${scenes[destination].label}`, () => send('visit', { scene: destination })));
    }
    if (inspecting && beforeWakingTony) actions.append(button('叫醒托尼', () => send('wake-tony')));
  }
  if (progress.profilesPending) {
    openPanel(progress.profilesPending === true ? 'profiles' : progress.profilesPending);
  }
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
    for (const [name, role, detail, age] of profiles) {
      const card = document.createElement('article');
      const image = document.createElement('img');
      image.src = asset(portrait[name]);
      image.alt = '';
      const heading = document.createElement('h3');
      heading.textContent = name;
      card.append(image, heading);
      appendText(card, `${age} 岁 · ${role}`);
      appendText(card, detail);
      grid.append(card);
    }
    body.append(grid);
    if (game.progress.profilesPending) body.append(button('继续调查', () => panel.close()));
  } else if (Object.hasOwn(characterProfileNames, kind)) {
    const name = characterProfileNames[kind];
    title.textContent = `人物档案 · ${name}`;
    const profile = document.createElement('div');
    profile.className = 'character-profile';
    const image = document.createElement('img');
    image.src = asset(portrait[name]);
    image.alt = `${name}的立绘`;
    const details = document.createElement('div');
    const [, role, description, age] = profiles.find(([member]) => member === name);
    appendText(details, `${age} 岁 · ${role}`);
    appendText(details, description);
    if (kind === 'arthur-profile') {
      const heading = document.createElement('h3');
      heading.textContent = '与乐队成员的关系';
      const list = document.createElement('ul');
      for (const relationship of arthurRelationships) {
        const item = document.createElement('li');
        item.textContent = relationship;
        list.append(item);
      }
      details.append(heading, list);
    }
    profile.append(image, details);
    body.append(profile, button('继续调查', () => panel.close()));
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
  updateSessionId(null);
  try {
    sessionStorage.removeItem(SESSION_KEY);
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
  if (!lensEnabled || byId('lens-toggle').disabled || panel.open) return;
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
initializeSession();
render();
