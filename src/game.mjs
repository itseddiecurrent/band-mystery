import { characterProfileNames, clues, dialogues, nearbyScenes, purseHotspots, scenes } from './content.mjs';

export const bedrooms = ['band-bedroom', 'miko-lili-bedroom'];

export function canEnterCornfield(progress) {
  return progress.danzaiReturned === true;
}

export function canSearchBedrooms(progress) {
  return progress.scene === 'yard' && progress.clues.includes('drink') && !canEnterCornfield(progress);
}

export function visitDestinations(progress) {
  const location = progress.visiting ?? progress.scene;
  if (location === 'yard' && (!progress.tonyAwake || progress.scene === 'tony')) return ['tony'];
  if (progress.scene === 'tony') {
    if (location === 'tony') return ['landing', 'arthur', 'yard'];
    if (location === 'landing') return ['arthur', 'tony'];
  }
  return (nearbyScenes[location] ?? []).filter(scene => scene !== 'cornfield' || canEnterCornfield(progress));
}

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
    version: 3,
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
  const arrive = (scene, dialogue) => {
    enter(next, scene);
    if (dialogue) startDialogue(next, dialogue);
  };
  const recordClue = (id, effect) => {
    collect(next, id);
    return result({ notice: `已记录：${clues[id].label}`, ...effect });
  };
  const visit = scene => {
    if (scene === progress.scene) delete progress.visiting;
    else progress.visiting = scene;
    record(next, `前往 · ${scenes[scene].label}`);
    return result();
  };

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
    if (current.id === 'opening-return') progress.profilesPending = true;
    if (current.id === 'discovery') progress.profilesPending = 'arthur-profile';
    if (current.id === 'tony-arrival') progress.profilesPending = 'tony-profile';
    if (current.id === 'examination') progress.examined = true;
    if (current.id === 'wake-tony') progress.tonyAwake = true;
    if (current.id === 'jammer') progress.jammer = 'found';
    if (current.id === 'call-police') progress.policeCalled = true;
    if (current.id === 'danzai-return') progress.danzaiReturned = true;
    switch (current.id) {
      case 'opening':
        startDialogue(next, 'opening-backstage');
        break;
      case 'opening-backstage':
        startDialogue(next, 'opening-memory');
        break;
      case 'opening-memory':
        startDialogue(next, 'opening-return');
        break;
      case 'hand':
        return recordClue(current.id);
      case 'milk':
        return recordClue(current.id, { panel: current.id });
      case 'backdoor':
        arrive('lili', 'lili-discovery');
        break;
      case 'lili-testimony': {
        const recorded = recordClue(current.id);
        arrive('yard');
        return recorded;
      }
      case 'drink': {
        const recorded = recordClue(current.id);
        startDialogue(next, 'yard-report');
        return recorded;
      }
      case 'danzai-testimony': {
        const recorded = recordClue(current.id);
        arrive('police', 'police-arrival');
        return recorded;
      }
      case 'phone':
        return result({ panel: 'phone' });
      case 'ask-tony-photo':
        enter(next, 'group-photo');
        break;
      case 'compare-clip':
        return recordClue('tie-clip');
    }
    return result();
  }
  if (progress.profilesPending) {
    if (action.type !== 'dismiss-profiles') return unchanged();
    const name = characterProfileNames[progress.profilesPending];
    record(next, name ? `查看${name}的人物档案` : '查看人物档案');
    if (progress.profilesPending === 'tony-profile') progress.tonyProfileSeen = true;
    delete progress.profilesPending;
    return result();
  }
  if (progress.dialogue || progress.finished) return unchanged();
  if (action.type === 'visit' && visitDestinations(progress).includes(action.scene)) {
    return visit(action.scene);
  }
  if (action.type === 'drink' && progress.visiting === 'yard' && (!progress.tonyAwake || progress.scene === 'tony')) {
    return unchanged({ notice: '喝了一半的饮料，没什么特别' });
  }
  const revisitingArthur = progress.scene === 'tony' && progress.visiting === 'arthur';
  if (action.type === 'arthur-phone' && progress.examined &&
      (revisitingArthur || (progress.scene === 'arthur' && !progress.visiting))) {
    if (progress.clues.includes('arthur-phone')) return unchanged({ panel: 'arthur-phone' });
    collect(next, 'arthur-phone');
    return result({ panel: 'arthur-phone', notice: '已记录：亚瑟的手机' });
  }
  if (revisitingArthur) {
    if (action.type === 'body') {
      startDialogue(next, 'examination');
      return result();
    }
    if (action.type === 'hand' && progress.clues.includes('hand')) return unchanged({ panel: 'hand' });
  }
  if (progress.visiting) return unchanged();

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
      if (!progress.clues.includes('glass')) return visit('arthur');
      enter(next, 'arthur');
      startDialogue(next, 'discovery');
      return result();
    case 'body':
      if (progress.scene !== 'arthur' || progress.examined) break;
      startDialogue(next, 'examination');
      return result();
    case 'hand':
      if (progress.scene !== 'arthur') break;
      if (!progress.examined) return unchanged({ notice: '亚瑟的右手紧握着。' });
      if (progress.clues.includes('hand')) return unchanged({ panel: 'hand' });
      startDialogue(next, 'hand');
      return result();
    case 'tony':
      if (progress.scene !== 'arthur') break;
      if (!progress.clues.includes('hand')) return visit('tony');
      arrive('tony', 'tony-arrival');
      return result();
    case 'wake-tony':
      if (progress.scene !== 'tony' || progress.tonyAwake) break;
      startDialogue(next, 'wake-tony');
      return result();
    case 'milk':
      if (progress.scene !== 'tony') break;
      if (!progress.tonyAwake) return unchanged({ notice: '床头柜上搁着一杯牛奶。' });
      if (progress.clues.includes('milk')) return unchanged({ panel: 'milk' });
      startDialogue(next, 'milk');
      return result();
    case 'backdoor':
      if (progress.scene !== 'tony') break;
      if (!progress.clues.includes('milk')) return visit('yard');
      startDialogue(next, 'backdoor');
      return result();
    case 'lili-testimony':
      if (progress.scene !== 'lili') break;
      startDialogue(next, 'lili-testimony');
      return result();
    case 'drink':
      if (progress.scene !== 'yard') break;
      if (progress.clues.includes('drink')) return unchanged({ panel: 'drink' });
      startDialogue(next, 'drink');
      return result();
    case 'tony-car':
      if (!canSearchBedrooms(progress) && progress.scene !== 'tony-tire-tracks') break;
      enter(next, 'tony-car');
      return result();
    case 'tony-tire-tracks':
      if (progress.scene !== 'tony-car') break;
      progress.sawTireTracks = true;
      enter(next, 'tony-tire-tracks');
      return result();
    case 'search-rooms':
      if (!canSearchBedrooms(progress)) break;
      enter(next, 'bedroom-hall');
      return result();
    case 'miko-purse':
      if (progress.scene === 'miko-lili-bedroom') return unchanged({ panel: 'miko-purse' });
      break;
    case 'miko-pill-box':
    case 'miko-diagnosis-prescription':
    case 'miko-injury-record':
    case 'miko-pregnancy-test':
      if (progress.scene !== 'miko-lili-bedroom') break;
      if (progress.clues.includes(action.type)) return unchanged({ panel: action.type });
      return recordClue(action.type, { panel: action.type });
    case 'enter-bedroom':
      if (progress.scene !== 'bedroom-hall' || !bedrooms.includes(action.scene)) break;
      enter(next, action.scene);
      return result();
    case 'search-bedroom': {
      if (!bedrooms.includes(progress.scene)) break;
      const room = scenes[progress.scene];
      const searched = progress.searchedBedrooms ??= [];
      if (searched.includes(progress.scene)) return unchanged({ notice: room.inspection });
      searched.push(progress.scene);
      record(next, `已检查 · ${room.label}`);
      return result({ notice: room.inspection });
    }
    case 'return-bedroom-hall':
      if (!bedrooms.includes(progress.scene)) break;
      enter(next, 'bedroom-hall');
      return result();
    case 'return-yard':
      if (!['bedroom-hall', 'tony-car', 'tony-tire-tracks'].includes(progress.scene)) break;
      enter(next, 'yard');
      if (canSearchBedrooms(progress) && progress.sawTireTracks === true &&
          bedrooms.every(scene => progress.searchedBedrooms?.includes(scene)) &&
          purseHotspots.every(({ id }) => progress.clues.includes(id))) {
        startDialogue(next, 'danzai-return');
      }
      return result();
    case 'cornfield':
      if (progress.scene !== 'yard' || !canEnterCornfield(progress)) break;
      arrive('cornfield', 'cornfield');
      return result();
    case 'miko-knife':
    case 'miko-wrist':
    case 'miko-breathing':
    case 'miko-missing-shoe':
      if (progress.scene !== 'cornfield') break;
      if (progress.clues.includes(action.type)) return unchanged({ panel: action.type });
      collect(next, action.type);
      return result({ panel: action.type });
    case 'fireplace':
      if (progress.scene !== 'cornfield') break;
      arrive('fireplace');
      return result();
    case 'jammer':
      if (progress.scene !== 'fireplace' || progress.jammer) break;
      startDialogue(next, 'jammer');
      return result();
    case 'disable-jammer':
      if (progress.scene !== 'fireplace' || progress.jammer !== 'found') break;
      progress.jammer = 'off';
      record(next, '关闭屏蔽器，手机恢复信号');
      startDialogue(next, 'call-police');
      return result();
    case 'danzai-statement':
      if (progress.scene !== 'fireplace') break;
      if (!progress.policeCalled) return visit('yard');
      arrive('danzai-statement', 'danzai-arrival');
      return result();
    case 'danzai-testimony':
      if (progress.scene !== 'danzai-statement') break;
      startDialogue(next, 'danzai-testimony');
      return result();
    case 'inspect-clip':
      if (progress.scene !== 'police') break;
      arrive('clip-detail', 'inspect-clip');
      return result();
    case 'ask-tony-photo':
      if (progress.scene !== 'clip-detail') break;
      startDialogue(next, 'ask-tony-photo');
      return result();
    case 'compare-clip':
      if (progress.scene !== 'group-photo') break;
      if (progress.clues.includes('tie-clip')) return unchanged({ panel: 'tie-clip' });
      startDialogue(next, 'compare-clip');
      return result();
    case 'open-old-photo':
      if (progress.scene !== 'group-photo' || !progress.clues.includes('tie-clip')) break;
      enter(next, 'old-photo');
      return result();
    case 'record-old-photo':
      if (progress.scene !== 'old-photo') break;
      if (progress.clues.includes('old-photo')) return unchanged({ panel: 'old-photo' });
      collect(next, 'old-photo');
      return result({ panel: 'old-photo' });
    case 'hospital':
      if (!['group-photo', 'old-photo'].includes(progress.scene) || !progress.clues.includes('tie-clip')) break;
      arrive('hospital', 'hospital-arrival');
      return result();
  }
  return unchanged();
}

function validProgress(progress) {
  if (!progress || !Object.hasOwn(scenes, progress.scene) ||
      (progress.visiting !== undefined && !Object.hasOwn(nearbyScenes, progress.visiting)) ||
      !Array.isArray(progress.clues) || !progress.clues.every(id => Object.hasOwn(clues, id)) ||
      (progress.sawTireTracks !== undefined && typeof progress.sawTireTracks !== 'boolean') ||
      (progress.searchedBedrooms !== undefined && (!Array.isArray(progress.searchedBedrooms) ||
        !progress.searchedBedrooms.every(scene => bedrooms.includes(scene)))) ||
      typeof progress.examined !== 'boolean' || typeof progress.finished !== 'boolean') return false;
  if (progress.dialogue === null) return true;
  const { id, line } = progress.dialogue ?? {};
  return Object.hasOwn(dialogues, id) && Number.isInteger(line) && line >= 0 && line < dialogues[id].length;
}

export function parseSave(raw) {
  try {
    const game = JSON.parse(raw);
    if (![1, 2, 3].includes(game?.version) || !Array.isArray(game.history)) return null;
    if (game.version < 3) {
      const oldSteps = [game.progress, ...game.history.map(row => row?.checkpoint),
        ...(Array.isArray(game.past) ? game.past : []), ...(Array.isArray(game.future) ? game.future : [])];
      for (const progress of oldSteps) {
        const dialogue = progress?.dialogue;
        if (game.version === 1) {
          if (dialogue?.id === 'opening' && Number.isInteger(dialogue.line) && dialogue.line > 3) dialogue.line = 3;
          if (dialogue?.id === 'discovery' && dialogue.line === 1) dialogue.line = 0;
        }
        if (dialogue?.id === 'yard-report' && Number.isInteger(dialogue.line) && dialogue.line >= 3) {
          // Older saves kept Danzai's return at the end of Tony's report.
          dialogue.id = 'danzai-return';
          dialogue.line -= 3;
        } else if (Array.isArray(progress?.clues) && progress.clues.includes('drink') &&
            (progress.scene !== 'yard' || dialogue === null)) {
          progress.danzaiReturned = true;
        }
      }
      game.version = 3;
    }
    if (!validProgress(game.progress)) return null;
    if (!game.history.every(row => typeof row?.label === 'string' &&
      (!Object.hasOwn(row, 'checkpoint') || validProgress(row.checkpoint)))) return null;
    for (const key of ['past', 'future']) {
      if (!Object.hasOwn(game, key)) game[key] = [];
      if (!Array.isArray(game[key]) || !game[key].every(validProgress)) return null;
    }
    const timeline = [...game.past, game.progress, ...game.future.slice().reverse()];
    let sawTireTracks = false;
    for (const progress of timeline) {
      // Older saves recorded the tire-track visit as a scene, without a progress flag.
      // Rewinding to a dialogue checkpoint can start a new path before that visit.
      if (progress.dialogue) sawTireTracks = false;
      if (progress.scene === 'tony-tire-tracks') sawTireTracks = true;
      if (sawTireTracks) progress.sawTireTracks ??= true;
    }
    const steps = [...timeline, ...game.history.map(row => row.checkpoint)];
    for (const progress of steps) {
      // Resume saves from the opening demo and from before Tony's profile was added.
      if (progress?.scene === 'arthur' && progress.finished) progress.finished = false;
      if (progress?.scene === 'tony' && !progress.dialogue && !progress.tonyAwake && !progress.tonyProfileSeen) {
        progress.profilesPending = 'tony-profile';
      }
    }
    return game;
  } catch {
    return null;
  }
}
