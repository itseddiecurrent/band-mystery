import { clues, dialogues, scenes } from './content.mjs';

export const SAVE_KEY = 'band-mystery.opening.v1';

function record(game, label) {
  game.history.push({ label });
}

function showLine(game) {
  const { id, line } = game.progress.dialogue;
  const [speaker, message] = dialogues[id][line];
  record(game, speaker ? `${speaker}：「${message}」` : message);
}

function startDialogue(game, id) {
  game.progress.dialogue = { id, line: 0 };
  game.history.push({
    label: `对话 · ${scenes[game.progress.scene].label}`,
    checkpoint: structuredClone(game.progress),
  });
  showLine(game);
}

function enter(game, scene) {
  game.progress.scene = scene;
  record(game, scenes[scene].label);
}

export function newGame() {
  const game = {
    version: 2,
    progress: { scene: 'wake', dialogue: null, clues: [], examined: false, finished: false },
    history: [],
    past: [],
    future: [],
  };
  enter(game, 'wake');
  startDialogue(game, 'opening');
  return game;
}

function collect(game, id) {
  game.progress.clues.push(id);
  record(game, `已记录 · ${clues[id].label}`);
}

export function dispatch(game, action) {
  if (action.type === 'back' || (action.type === 'forward' && game.future.length)) {
    const backward = action.type === 'back';
    const source = backward ? 'past' : 'future';
    const destination = backward ? 'future' : 'past';
    if (!game[source].length) return { game };
    const next = structuredClone(game);
    next[destination].push(next.progress);
    next.progress = next[source].pop();
    return { game: next };
  }

  const result = applyAction(game, action.type === 'forward' ? { type: 'advance' } : action);
  if (result.game !== game) {
    result.game.past.push(structuredClone(game.progress));
    result.game.future = [];
  }
  return result;
}

function applyAction(game, action) {
  const next = structuredClone(game);
  const progress = next.progress;
  const result = (effect = null) => ({ game: next, effect });
  const unchanged = (effect = null) => ({ game, effect });

  if (action.type === 'rewind') {
    const checkpoint = next.history[action.index]?.checkpoint;
    if (!checkpoint) return unchanged();
    next.progress = structuredClone(checkpoint);
    record(next, `从此处继续 · ${scenes[checkpoint.scene].label}`);
    showLine(next);
    return result();
  }
  if (action.type === 'advance') {
    if (!progress.dialogue) return unchanged();
    const current = progress.dialogue;
    if (++current.line < dialogues[current.id].length) {
      showLine(next);
      return result();
    }
    progress.dialogue = null;
    if (current.id === 'opening') progress.profilesPending = true;
    if (current.id === 'examination') progress.examined = true;
    if (current.id === 'hand') {
      collect(next, 'hand');
      return result({ notice: '已记录：亚瑟的右手' });
    }
    if (current.id === 'phone') return result({ panel: 'phone' });
    return result();
  }
  if (progress.profilesPending) {
    if (action.type !== 'dismiss-profiles') return unchanged();
    delete progress.profilesPending;
    record(next, '查看人物档案');
    return result();
  }
  if (progress.dialogue || progress.finished) return unchanged();

  switch (action.type) {
    case 'phone':
      if (progress.scene !== 'wake') break;
      if (progress.phoneSeen) return unchanged({ panel: 'phone' });
      progress.phoneSeen = true;
      startDialogue(next, 'phone');
      return result();
    case 'flashlight':
      if (progress.scene !== 'wake' || !progress.phoneSeen) break;
      enter(next, 'landing');
      return result();
    case 'glass':
      if (progress.scene !== 'landing') break;
      if (progress.clues.includes('glass')) return unchanged({ panel: 'glass' });
      collect(next, 'glass');
      return result({ panel: 'glass', notice: '已记录：碎酒杯' });
    case 'stairs':
      if (progress.scene !== 'landing') break;
      if (!progress.clues.includes('glass')) return unchanged({ notice: '先检查楼梯旁的碎酒杯。' });
      enter(next, 'arthur');
      startDialogue(next, 'discovery');
      return result();
    case 'body':
      if (progress.scene !== 'arthur' || progress.examined) break;
      startDialogue(next, 'examination');
      return result();
    case 'hand':
      if (progress.scene !== 'arthur') break;
      if (!progress.examined) return unchanged({ notice: '先检查亚瑟的情况。' });
      if (progress.clues.includes('hand')) return unchanged({ panel: 'hand' });
      startDialogue(next, 'hand');
      return result();
    case 'finish':
      if (progress.scene !== 'arthur') break;
      if (!progress.clues.includes('hand')) return unchanged({ notice: '还有现场线索需要查看。' });
      progress.finished = true;
      record(next, '开场试玩结束');
      return result();
  }
  return unchanged();
}

function validProgress(progress) {
  if (!progress || !Object.hasOwn(scenes, progress.scene) ||
      !Array.isArray(progress.clues) || !progress.clues.every(id => Object.hasOwn(clues, id)) ||
      typeof progress.examined !== 'boolean' || typeof progress.finished !== 'boolean') return false;
  if (progress.dialogue === null) return true;
  const { id, line } = progress.dialogue ?? {};
  return Object.hasOwn(dialogues, id) && Number.isInteger(line) && line >= 0 && line < dialogues[id].length;
}

export function parseSave(raw) {
  try {
    const game = JSON.parse(raw);
    if (![1, 2].includes(game?.version) || !Array.isArray(game.history)) return null;
    if (game.version === 1) {
      const oldSteps = [game.progress, ...game.history.map(row => row?.checkpoint),
        ...(Array.isArray(game.past) ? game.past : []), ...(Array.isArray(game.future) ? game.future : [])];
      for (const progress of oldSteps) {
        const dialogue = progress?.dialogue;
        if (dialogue?.id === 'opening' && Number.isInteger(dialogue.line) && dialogue.line > 3) dialogue.line = 3;
        if (dialogue?.id === 'discovery' && dialogue.line === 1) dialogue.line = 0;
      }
      game.version = 2;
    }
    if (!validProgress(game.progress)) return null;
    if (!game.history.every(row => typeof row?.label === 'string' &&
      (!Object.hasOwn(row, 'checkpoint') || validProgress(row.checkpoint)))) return null;
    for (const key of ['past', 'future']) {
      if (!Object.hasOwn(game, key)) game[key] = [];
      if (!Array.isArray(game[key]) || !game[key].every(validProgress)) return null;
    }
    return game;
  } catch {
    return null;
  }
}
