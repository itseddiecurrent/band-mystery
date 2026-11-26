import { clues, dialogues, scenes, lineFor } from './content.mjs?v=jammer-search-1';

// Only playable content belongs here. Authoring-canvas proposals are deliberately separate.
const chapter = (id, row, title, dialogueIds, extra = {}) => ({ id, row, column: 1, title, dialogueIds, ...extra });
const implementedNodes = [
  chapter('wake', 0, '庆功宴后醒来', ['opening']),
  chapter('backstage', 1, '回想演出后台', ['opening-backstage']),
  chapter('party', 2, '庆功宴上的交谈', ['opening-memory']),
  chapter('hallway', 3, '照亮楼梯与走廊', ['opening-return', 'phone'], { sceneIds: ['landing'] }),
  chapter('body', 4, '楼梯下的发现', ['discovery', 'examination', 'hand']),
  chapter('phone', 4, '查看亚瑟的手机', [], { column: 3, optional: true, clueIds: ['arthur-phone'] }),
  chapter('tony', 5, '叫醒托尼并询问', ['tony-arrival', 'wake-tony', 'milk']),
  chapter('pillow', 6, '托尼的睡前回忆', ['pillow-observation'], { sceneIds: ['tony-memory'], clueIds: ['tony-pillow'] }),
  chapter('backyard', 7, '后门与庭院的证词', ['backdoor', 'lili-discovery', 'lili-testimony', 'drink', 'yard-report']),
  chapter('search', 8, '搜查房间与停车处', [], { sceneIds: ['bedroom-hall', 'tony-car', 'tony-tire-tracks', 'band-bedroom', 'miko-lili-bedroom'] }),
  chapter('car', 9, '检查停车处', [], { column: 0, sceneIds: ['tony-car', 'tony-tire-tracks'] }),
  chapter('shared-room', 9, '检查三人的房间', [], { sceneIds: ['band-bedroom'], clueIds: ['bedroom-shoe'] }),
  chapter('miko-room', 9, '检查小柔与小莉的房间', [], { column: 2, sceneIds: ['miko-lili-bedroom'], clueIds: ['miko-pill-box', 'miko-diagnosis-prescription', 'miko-injury-record', 'miko-pregnancy-test'] }),
  chapter('rescue', 10, '玉米地里的求救', ['danzai-return', 'cornfield'], { sceneIds: ['cornfield'] }),
  chapter('jammer-search', 11, '寻找屏蔽器', [], { flag: 'searchingJammer' }),
  chapter('signal', 12, '找到设备并恢复通讯', ['jammer', 'call-police']),
  chapter('witness', 13, '询问蛋仔的经过', ['danzai-arrival', 'danzai-testimony']),
  chapter('police', 14, '警方抵达与检查', ['police-arrival', 'inspect-clip', 'ask-tony-photo']),
  chapter('photo', 15, '核对当晚的合照', ['compare-clip'], { sceneIds: ['group-photo'] }),
  chapter('old-photo', 15, '翻看去年夏天的合照', [], { column: 3, optional: true, sceneIds: ['old-photo'], clueIds: ['old-photo'] }),
  chapter('news', 16, '新的调查结果', ['willy-crash']),
  chapter('hospital', 17, '医院里的交谈', ['hospital-arrival', 'hospital-followup', 'hospital-aftermath', 'miko-memory']),
  chapter('message', 17, '阅读小柔的短信', ['miko-text'], { column: 3, optional: true, clueIds: ['miko-text'] }),
  chapter('theory', 18, '核对证词与现场', ['police-conclusion', 'fall-reconstruction']),
  chapter('review', 19, '重新调查，顺序自选', [], { sceneIds: ['review'] }),
  chapter('review-drinks', 20, '复查饮料与尸检', ['review-drinks'], { column: 0, review: true }),
  chapter('review-vehicle', 20, '复查威利的车', ['review-vehicle'], { review: true }),
  chapter('review-extortion', 20, '警方发现的内幕', ['review-extortion'], { column: 2, review: true }),
  chapter('review-feather', 20, '复查指甲里的黑色碎屑', ['review-feather'], { column: 3, review: true }),
  chapter('accuse', 21, '指认蛋仔', ['solve-success', 'rehearsal-arrival']),
  chapter('confrontation', 22, '排练室的质询', ['confrontation']),
  chapter('reconstruction', 23, '还原作案经过', ['final-reconstruction']),
  chapter('arrest', 24, '警方带走蛋仔', ['arrest']),
  chapter('sunset', 25, '山坡上的日落', ['sunset']),
  chapter('private', 26, '回到医院之后', ['kat-miko-private']),
  chapter('ending', 27, '故事结束', [], { ending: true }),
];

// Investigations are details of a chapter, never alternative story routes.
const detailParents = {
  phone: 'body', car: 'search', 'shared-room': 'search', 'miko-room': 'search',
  'old-photo': 'photo', message: 'hospital', 'review-drinks': 'review',
  'review-vehicle': 'review', 'review-extortion': 'review', 'review-feather': 'review',
};
export const storylineNodes = implementedNodes.filter(node => !detailParents[node.id]).map((node, row) => {
  const details = implementedNodes.filter(detail => detailParents[detail.id] === node.id);
  return { ...node, row, column: 0, details,
    dialogueIds: [...node.dialogueIds, ...details.flatMap(detail => detail.dialogueIds)] };
});
export const storylineEdges = storylineNodes.slice(1).map((node, index) => [storylineNodes[index].id, node.id]);

const dialogueLabels = new Map();
for (const [id, rows] of Object.entries(dialogues)) rows.forEach(([speaker, text], line) => {
  for (const clueIds of [[], ['old-photo']]) {
    const variant = lineFor({ dialogue: { id, line }, clues: clueIds })[1];
    const label = speaker ? `${speaker}：「${variant}」` : variant;
    const ids = dialogueLabels.get(label) ?? new Set();
    ids.add(id);
    dialogueLabels.set(label, ids);
  }
});

function factsFrom(game, includeArchive = true) {
  const states = includeArchive ? [game.progress, ...(game.past ?? []), ...(game.future ?? []),
    ...(game.history ?? []).map(row => row.checkpoint).filter(Boolean)] : [game.progress];
  const facts = { dialogues: new Set(), scenes: new Set(), clues: new Set(), flags: new Set(), finished: false };
  for (const state of states) {
    if (!state) continue;
    if (state.dialogue) facts.dialogues.add(state.dialogue.id);
    facts.scenes.add(state.visiting ?? state.scene);
    for (const id of state.clues ?? []) facts.clues.add(id);
    for (const id of state.reviewedGroups ?? []) facts.dialogues.add(id);
    if (state.searchingJammer) facts.flags.add('searchingJammer');
    facts.finished ||= state.finished === true;
  }
  if (includeArchive) for (const row of game.history ?? []) {
    const ids = dialogueLabels.get(row.label);
    if (ids?.size === 1) facts.dialogues.add([...ids][0]);
    for (const id of Object.keys(clues)) {
      if (row.label === `已记录 · ${clues[id].label}` || row.label === `已记录：${clues[id].label}`) facts.clues.add(id);
    }
    for (const scene of Object.keys(scenes)) {
      const room = scenes[scene];
      if ([room.label, `前往 · ${scenes[scene].label}`, `已检查 · ${room.label}`].includes(row.label)) facts.scenes.add(scene);
    }
    if (row.label === '关闭屏蔽器，手机恢复信号') facts.flags.add('searchingJammer');
    if (row.label === '剧情结束') facts.finished = true;
  }
  return facts;
}
const reached = (node, facts) => node.dialogueIds.some(id => facts.dialogues.has(id)) ||
  node.sceneIds?.some(id => facts.scenes.has(id)) || node.clueIds?.some(id => facts.clues.has(id)) ||
  (node.flag && facts.flags.has(node.flag)) || (node.ending && facts.finished);

function currentId(progress) {
  if (progress.finished) return 'ending';
  const dialogue = progress.dialogue?.id;
  const exact = storylineNodes.find(node => node.dialogueIds.includes(dialogue));
  if (exact) return exact.id;
  const location = progress.visiting ?? progress.scene;
  if (progress.searchingJammer) {
    if (progress.policeCalled) return 'signal';
    return progress.jammer === 'found' ? 'signal' : 'jammer-search';
  }
  if (location === 'yard') return progress.danzaiReturned ? 'rescue' : progress.clues.includes('drink') ? 'search' : 'backyard';
  const ids = { wake: 'hallway', landing: 'hallway', arthur: 'body', tony: 'tony', 'tony-memory': 'pillow',
    lili: 'backyard', 'bedroom-hall': 'search', 'band-bedroom': 'shared-room', 'miko-lili-bedroom': 'miko-room',
    'tony-car': 'car', 'tony-tire-tracks': 'car', cornfield: 'rescue', 'danzai-statement': 'witness',
    police: 'police', 'clip-detail': 'police', 'group-photo': 'photo', 'old-photo': 'old-photo',
    'willy-crash': 'news', hospital: 'hospital', 'police-conclusion': 'theory', 'fall-reconstruction': 'theory',
    review: 'review', rehearsal: 'confrontation', 'final-reconstruction': 'reconstruction', sunset: 'sunset', 'hospital-ending': 'private' };
  return ids[location] ?? null;
}

export function storylineFor(game) {
  const known = factsFrom(game);
  const present = factsFrom(game, false);
  const location = currentId(game.progress);
  const active = detailParents[location] ?? location;
  const nodes = storylineNodes.map(node => {
    const unlocked = Boolean(reached(node, known) || node.details.some(detail => reached(detail, known)) || node.id === active);
    const checkpointIndex = unlocked ? (game.history ?? []).findIndex(row => node.dialogueIds.includes(row.checkpoint?.dialogue?.id)) : -1;
    // The returned model contains no titles or descriptions for undiscovered nodes.
    return { id: node.id, row: node.row, column: node.column, unlocked, current: node.id === active,
      title: unlocked ? node.title : null, optional: unlocked && Boolean(node.optional),
      chosen: Boolean(node.optional && node.clueIds?.some(id => present.clues.has(id))), review: unlocked && Boolean(node.review),
      details: unlocked ? node.details.map(detail => {
        const revealed = Boolean(reached(detail, known));
        return { id: detail.id, title: revealed ? detail.title : null, unlocked: revealed,
          recorded: Boolean(detail.clueIds?.some(id => present.clues.has(id))) };
      }) : [],
      checkpointIndex, ending: unlocked && Boolean(node.ending) };
  });
  const byId = new Map(nodes.map(node => [node.id, node]));
  const edges = storylineEdges.map(([from, to]) => ({ from, to, unlocked: byId.get(from).unlocked && byId.get(to).unlocked }));
  return { nodes, edges, currentId: active, unlockedCount: nodes.filter(node => node.unlocked).length };
}
