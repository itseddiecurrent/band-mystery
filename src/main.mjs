import { arthurRelationships, characterProfileNames, clues, dialogues, lineFor, nearbyScenes, portrait, portraitFor, profiles, reviewGroups, purseHotspots, purseImages, scenes, storyTransitions } from './content.mjs';
import { bedrooms, canEnterCornfield, canSearchBedrooms, dispatch, newGame, parseSave, SAVE_KEY, visitDestinations } from './game.mjs';
import { canSolve } from './evidence_list.mjs';
import { createPortraitCache, portraitFilename } from './portrait-cache.mjs';

const byId = id => document.getElementById(id);
// Refresh URLs after the custom-domain rollback so browsers do not reuse cached redirects.
const assetFilename = name => name === 'arthur-phone-lock-screen.png' ? name : name.replace(/\.png$/, '.jpg');
const asset = name => new URL('../assets/' + assetFilename(name).split('/').map(encodeURIComponent).join('/'), import.meta.url).href + '?v=scene-images-1';
const portraitAsset = name => asset(portraitFilename(name));
const portraitCache = createPortraitCache(portraitAsset);
const loader = byId('asset-loader');
const stage = byId('stage');
const lens = byId('lens');
const panel = byId('panel');
const SESSION_KEY = 'band-mystery.web-session.v1';
const INVITE_CODE = 'BANDMYSTERY902';
const INVITE_KEY = 'band-mystery.invite.v1';
let accessGranted = false;
try { accessGranted = sessionStorage.getItem(INVITE_KEY) === 'granted'; } catch {}

let sessionId = null;
let game = null;
let saved = null;
let lensEnabled = false;
let image = null;
let portraitTarget = null;
const preloadedSceneImages = new Map();

function collectArtworkFiles(value, files, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) collectArtworkFiles(item, files, seen);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string' && child.endsWith('.png')) files.add(asset(child));
    collectArtworkFiles(child, files, seen);
  }
}

function gameImageUrls() {
  const files = new Set([asset('title-screen.png'), asset('bitcoin-wallet.png'), asset('danzai-flashback.png')]);
  for (const content of [scenes, dialogues, clues, purseImages]) collectArtworkFiles(content, files);
  return [...files, ...new Set([...Object.values(portrait), '蛋仔.png'].map(portraitAsset))];
}

function updateAssetProgress(done, total) {
  byId('asset-progress').max = total;
  byId('asset-progress').value = done;
  byId('asset-load-count').textContent = `${done} / ${total}`;
}

function decodeImageUrl(url) {
  const warmed = new Image();
  warmed.decoding = 'async';
  warmed.src = url;
  return warmed.decode().catch(() => false);
}

async function warmImageCache(urls, loaded, total = urls.length) {
  let cursor = 0;
  const failed = new Set();
  updateAssetProgress(loaded.size, total);
  const worker = async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      if (loaded.has(url)) continue;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      try {
        const response = await fetch(url, { cache: 'force-cache', credentials: 'same-origin', signal: controller.signal });
        if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
        await response.blob();
        loaded.add(url);
      } catch {
        failed.add(url);
      } finally {
        clearTimeout(timeout);
      }
      updateAssetProgress(loaded.size, total);
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, urls.length) }, worker));
  return failed;
}

async function loadGameImages() {
  const urls = gameImageUrls();
  const loaded = new Set();
  const actions = byId('asset-load-actions');
  const failureMessage = byId('asset-load-error');
  const retryButton = byId('asset-retry');
  const continueButton = byId('asset-continue');
  let failed = await warmImageCache(urls, loaded);

  const finish = () => {
    const title = byId('cover-art');
    title.src = asset('title-screen.png');
    // The invite form should never wait on Chrome's image decoder after all bytes are cached.
    title.decode().catch(() => false);
    portraitCache.preload([...Object.values(portrait), '蛋仔.png']);
    decodeImageUrl(asset(scenes.wake.image));
    decodeImageUrl(asset(scenes.wake.backstageImage));
    byId('invite-code').disabled = false;
    byId('invite-submit').disabled = false;
    byId('title').inert = false;
    loader.hidden = true;
  };

  if (!failed.size) {
    await finish();
    return;
  }

  const showFailure = () => {
    failureMessage.textContent = `${failed.size} 张图片加载失败。网络恢复后可重试，也可以先进入游戏。`;
    actions.hidden = false;
  };
  showFailure();
  retryButton.onclick = async () => {
    retryButton.disabled = true;
    continueButton.disabled = true;
    actions.hidden = true;
    const retryUrls = [...failed];
    failed = await warmImageCache(retryUrls, loaded, urls.length);
    retryButton.disabled = false;
    continueButton.disabled = false;
    if (failed.size) showFailure();
    else await finish();
  };
  continueButton.onclick = finish;
}

function preloadSceneImage(name) {
  if (!name || name === image || preloadedSceneImages.has(name)) return;
  const warmed = new Image();
  warmed.decoding = 'async';
  warmed.fetchPriority = 'low';
  warmed.src = asset(name);
  const entry = { warmed, ready: warmed.decode().catch(() => false) };
  preloadedSceneImages.set(name, entry);
  while (preloadedSceneImages.size > 4) {
    preloadedSceneImages.delete(preloadedSceneImages.keys().next().value);
  }
}

function preloadLikelyNextImages(progress, location) {
  const names = [];
  const dialogue = progress.dialogue;
  if (dialogue) {
    const rows = dialogues[dialogue.id] ?? [];
    const nextArtwork = rows[dialogue.line + 1]?.[2]?.image;
    if (nextArtwork) names.push(nextArtwork);
    if (dialogue.line === rows.length - 1) {
      const [nextScene] = storyTransitions[dialogue.id] ?? [];
      if (nextScene && scenes[nextScene]?.image) names.push(scenes[nextScene].image);
    }
  } else {
    for (const nextScene of (nearbyScenes[location] ?? []).slice(0, 2)) {
      if (scenes[nextScene]?.image) names.push(scenes[nextScene].image);
    }
  }
  for (const name of new Set(names)) preloadSceneImage(name);
}

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

function hotspotButton({ id, label, rect }) {
  const target = button(label, () => send(id));
  target.className = 'hotspot';
  target.dataset.hotspot = id;
  const [left, top, width, height] = rect.map(value => `${value}%`);
  Object.assign(target.style, { left, top, width, height });
  return target;
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
  if (!accessGranted || !game) return;
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
  byId('scene').fetchPriority = 'high';
  byId('scene').src = asset(name);
  lens.style.backgroundImage = `url("${asset(name)}")`;
  lens.hidden = true;
}

function setPortrait(speaker, dialogueId) {
  const current = byId('portrait');
  const file = speaker && portraitFor(speaker, dialogueId);
  if (!file) {
    portraitTarget = null;
    current.hidden = true;
    return;
  }
  const entry = portraitCache.get(file);
  portraitTarget = entry;
  const show = () => {
    // Ignore a decode finishing after the player has advanced to another line.
    if (portraitTarget !== entry || !entry.loaded) return;
    const previous = byId('portrait');
    entry.image.id = 'portrait';
    entry.image.hidden = false;
    if (previous !== entry.image) {
      previous.hidden = true;
      previous.replaceWith(entry.image);
    }
  };
  if (entry.loaded) {
    show();
  } else {
    current.hidden = true;
    entry.image.fetchPriority = 'high';
    entry.ready.then(show);
  }
}

function render() {
  byId('invite-form').hidden = accessGranted;
  byId('cover-actions').hidden = !accessGranted;
  byId('new').disabled = !accessGranted;
  byId('continue').disabled = !accessGranted;
  if (!accessGranted) {
    byId('title').hidden = false;
    byId('game-header').hidden = true;
    byId('tools').hidden = true;
    byId('game').hidden = true;
    return;
  }
  byId('continue').hidden = !saved;
  byId('title').hidden = Boolean(game);
  byId('game-header').hidden = !game;
  byId('tools').hidden = !game;
  byId('game').hidden = !game;
  if (!game) {
    setPortrait(null);
    return;
  }

  const progress = game.progress;
  const location = progress.visiting ?? progress.scene;
  const dialogue = progress.dialogue;
  const backstageMemory = dialogue?.id === 'opening-backstage';
  const hospitalMemory = dialogue?.id === 'miko-memory';
  const jammerCloseup = location === 'fireplace' && !progress.visiting && !dialogue && progress.jammer === 'found';
  const scene = jammerCloseup ? scenes.fireplace.closeup : scenes[location];
  byId('back').disabled = !game.past.length;
  byId('forward').disabled = !dialogue && !game.future.length;
  const currentLine = dialogue ? lineFor(progress) : null;
  const artwork = currentLine?.[2];
  setImage(artwork?.image ?? (backstageMemory ? scenes.wake.backstageImage : hospitalMemory ? scenes.landing.image : dialogue?.id === 'hand' ? clues.hand.image : scene.image));
  preloadLikelyNextImages(progress, location);
  byId('scene').alt = artwork?.alt ?? (backstageMemory ? '演出结束后的后台' : hospitalMemory ? '昨晚楼梯口的回忆' : dialogue?.id === 'hand' ? clues.hand.label : scene.label);
  const description = byId('scene-description');
  description.textContent = scene.description ?? '';
  description.hidden = !scene.description;
  const jammerLight = byId('jammer-light');
  jammerLight.hidden = location !== 'fireplace' || jammerCloseup;
  jammerLight.classList.toggle('off', progress.jammer === 'off');
  const [speaker, line] = currentLine ?? [];
  stage.classList.toggle('speaking', backstageMemory || ['willy-crash', 'hand'].includes(dialogue?.id) ? Boolean(speaker) : Boolean(dialogue));
  stage.classList.toggle('memory', location === 'tony-memory' || Boolean(artwork?.memory) || backstageMemory || dialogue?.id === 'opening-memory' || hospitalMemory || dialogue?.id === 'final-reconstruction');
  stage.classList.toggle('backstage-memory', backstageMemory);
  byId('dialogue').hidden = !dialogue;
  setPortrait(speaker, dialogue?.id);
  stage.classList.toggle('finished', progress.finished);
  byId('ending').hidden = !progress.finished;
  if (dialogue) {
    byId('speaker').textContent = speaker ?? '';
    byId('line').textContent = line;
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
        (item.id === 'body' || item.id === 'hand' || item.id === 'arthur-phone');
      if (!inspecting && !earlyDrink && !revisitArthur) continue;
      if (item.id === 'arthur-phone' && !progress.examined) continue;
      if (beforeWakingTony && item.id === 'milk') continue;
      if (progress.tonyAwake && item.id === 'wake-tony') continue;
      if (item.id === 'cornfield' && !canEnterCornfield(progress)) continue;
      if (item.id === 'jammer' && progress.jammer) continue;
      const target = hotspotButton(item);
      if (item.id === 'disable-jammer') {
        target.setAttribute('role', 'switch');
        target.setAttribute('aria-checked', 'true');
      }
      if (item.id === 'danzai-testimony') {
        target.classList.add('visible-hotspot');
      }
      hotspots.append(target);
      if (focused === item.id) target.focus();
    }
  }
  const actions = byId('actions');
  actions.replaceChildren();
  if (inspecting) {
    if (['tony', 'hospital', 'review'].includes(progress.scene) && progress.clues.includes('milk') && !progress.clues.includes('tony-pillow')) {
      actions.append(button('回看托尼的睡前回忆', () => send('recall-pillow')));
    }
    if (progress.scene === 'hospital') {
      if (!progress.clues.includes('willy-phone')) {
        actions.append(button('查看警方调查结果', () => send('hospital')));
      }
      if (!progress.hospitalFollowupDone) {
        actions.append(button('陪小柔坐一会儿', () => send('hospital-followup')));
      } else if (!progress.clues.includes('miko-text')) {
        actions.append(button('查看小柔发给威利的短信', () => send('miko-text')));
      }
    }
    if (progress.scene === 'hospital' && progress.clues.includes('miko-testimony')) {
      actions.append(button('离开医院，继续调查', () => send('continue-investigation')));
    }
    if (progress.scene === 'review') {
      for (const [group, { label }] of Object.entries(reviewGroups)) {
        const completed = progress.reviewedGroups?.includes(group);
        const control = button(completed ? `${label}（已完成）` : label, () => send('review-group', { group }));
        control.disabled = completed;
        actions.append(control);
      }
    }
    if (progress.scene === 'arthur') actions.append(button('去隔间', () => send('tony')));
    if (canSearchBedrooms(progress)) {
      actions.append(
        button('去其他房间看看', () => send('search-rooms')),
        button('去托尼车那里看看', () => send('tony-car')),
      );
    }
    if (progress.scene === 'tony-tire-tracks') {
      actions.append(button('回到车尾', () => send('tony-car')));
    }
    if (progress.scene === 'tony-car' || progress.scene === 'tony-tire-tracks') {
      actions.append(button('回后院', () => send('return-yard')));
    }
    if (progress.scene === 'bedroom-hall') {
      for (const room of bedrooms) {
        const checked = progress.searchedBedrooms?.includes(room) ? '（已检查）' : '';
        actions.append(button(`去${scenes[room].label}${checked}`, () => send('enter-bedroom', { scene: room })));
      }
      actions.append(button('回后院', () => send('return-yard')));
    }
    if (progress.scene === 'yard' && canEnterCornfield(progress)) {
      actions.append(button('去小柔那里看看', () => send('cornfield')));
    }
    if (progress.scene === 'band-bedroom') {
      actions.append(button('查看门口地面', () => send('bedroom-shoe')));
    }
    if (bedrooms.includes(progress.scene)) {
      actions.append(button('检查房间', () => send('search-bedroom')));
      actions.append(button('回走廊', () => send('return-bedroom-hall')));
    }
    if (progress.scene === 'cornfield') actions.append(button('回屋找设备', () => send('fireplace')));
    if (progress.scene === 'fireplace') {
      if (progress.policeCalled) actions.append('手机已恢复信号。 ');
      actions.append(button('去后门', () => send('danzai-statement')));
    }
    if (progress.scene === 'police') actions.append(button('询问警方亚瑟状况', () => send('inspect-clip')));
    if (progress.scene === 'clip-detail') actions.append(button('问托尼', () => send('ask-tony-photo')));
    if (progress.scene === 'group-photo' && progress.clues.includes('tie-clip')) {
      actions.append(button('翻看去年夏天的合照', () => send('open-old-photo')));
    }
    if (progress.scene === 'old-photo') actions.append(button('查看去年夏天的合照', () => send('record-old-photo')));
    if (['group-photo', 'old-photo'].includes(progress.scene) && progress.clues.includes('tie-clip')) {
      actions.append(button('查看警方调查结果，随后去医院', () => send('hospital')));
    }
    if (progress.scene === 'willy-crash' && progress.clues.includes('willy-phone')) {
      actions.append(button('去医院看小柔', () => send('hospital')));
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
    if (id === 'arthur-phone') img.className = 'phone-clue';
    if (clue.crop) {
      const { x, y, width, height, sourceWidth } = clue.crop;
      const closeup = document.createElement('div');
      closeup.className = 'clue-closeup';
      closeup.style.aspectRatio = `${width} / ${height}`;
      img.style.width = `${sourceWidth / width * 100}%`;
      img.style.left = `${-x / width * 100}%`;
      img.style.top = `${-y / height * 100}%`;
      closeup.append(img);
      container.append(closeup);
    } else {
      container.append(img);
    }
  }
  appendText(container, clue.detail);
}

function openPanel(kind) {
  lens.hidden = true;
  const body = byId('panel-body');
  const title = byId('panel-title');
  const fromPurse = panel.open && body.querySelector('.purse-contents');
  body.replaceChildren();
  panel.classList.toggle('cast-panel', kind === 'profiles' || kind === 'solve');
  panel.classList.toggle('solve-panel', kind === 'solve');
  if (kind === 'solve') {
    title.textContent = '解谜';
    const instruction = document.createElement('p');
    instruction.textContent = '请选择嫌疑人';
    const warning = document.createElement('p');
    warning.className = 'solve-warning';
    warning.setAttribute('role', 'alert');
    warning.hidden = true;
    const grid = document.createElement('div');
    grid.className = 'suspect-grid';
    for (const [name] of profiles) {
      const card = button(name, () => {
        if (canSolve(game.progress, name)) {
          panel.close();
          send('solve', { suspect: name });
          return;
        }
        grid.hidden = true;
        instruction.hidden = true;
        warning.textContent = '解密失败';
        warning.hidden = false;
      });
      card.className = 'suspect-card';
      const image = document.createElement('img');
      image.src = portraitAsset(portrait[name]);
      image.alt = '';
      const label = document.createElement('span');
      label.textContent = name;
      card.replaceChildren(image, label);
      grid.append(card);
    }
    const retry = button('重新选择', () => { grid.hidden = false; instruction.hidden = false; warning.hidden = true; });
    body.append(instruction, warning, grid, retry);
  } else if (kind === 'profiles') {
    title.textContent = '人物档案';
    const grid = document.createElement('div');
    grid.className = 'cast-grid';
    for (const [name, role, detail, age] of profiles) {
      const card = document.createElement('article');
      const image = document.createElement('img');
      image.src = portraitAsset(portrait[name]);
      image.alt = '';
      const heading = document.createElement('h3');
      heading.textContent = name;
      card.append(image, heading);
      appendText(card, age == null ? role : `${age} 岁 · ${role}`);
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
    image.src = portraitAsset(portrait[name]);
    image.alt = `${name}的立绘`;
    const details = document.createElement('div');
    const [, role, description, age] = profiles.find(([member]) => member === name);
    appendText(details, age == null ? role : `${age} 岁 · ${role}`);
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
  } else if (kind === 'miko-purse' || kind === 'miko-purse-open') {
    title.textContent = '小柔的挎包';
    const opened = kind === 'miko-purse-open';
    const image = document.createElement('img');
    image.src = asset(opened ? purseImages.open : purseImages.closed);
    image.alt = opened ? '打开的挎包，里面有药盒、诊断书和处方、泛黄的检查记录和一个未拆封的盒子' : '木椅上合着的酒红色挎包';
    if (opened) {
      const contents = document.createElement('div');
      contents.className = 'purse-contents';
      contents.append(image, ...purseHotspots.map(hotspotButton));
      body.append(contents);
      panel.querySelector('form button').focus();
    } else {
      const choices = document.createElement('nav');
      choices.className = 'purse-actions';
      choices.setAttribute('aria-label', '挎包操作');
      choices.append(
        button('打开挎包', () => openPanel('miko-purse-open')),
        button('保持原样', () => panel.close()),
      );
      body.append(image, choices);
    }
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
    if (fromPurse) {
      const back = button('返回挎包', () => openPanel('miko-purse-open'));
      body.append(back);
      back.focus();
    }
  }
  if (!panel.open) panel.showModal();
}

panel.addEventListener('close', () => {
  if (game?.progress.profilesPending && !panel.open) send('dismiss-profiles');
});

byId('invite-form').onsubmit = event => {
  event.preventDefault();
  const input = byId('invite-code');
  if (input.value.trim() !== INVITE_CODE) {
    byId('invite-error').hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    input.select();
    return;
  }
  accessGranted = true;
  try { sessionStorage.setItem(INVITE_KEY, 'granted'); } catch {}
  input.value = '';
  input.removeAttribute('aria-invalid');
  byId('invite-error').hidden = true;
  render();
  byId(saved ? 'continue' : 'new').focus();
};
byId('new').onclick = () => {
  if (!accessGranted) return;
  if (saved && !confirm('开始新游戏会覆盖本次进度和记录。继续吗？')) return;
  notify('');
  game = newGame();
  save();
  render();
};
byId('continue').onclick = () => {
  if (!accessGranted || !saved) return;
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
loadGameImages();
