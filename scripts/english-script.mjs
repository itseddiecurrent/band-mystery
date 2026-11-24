// Parse the approved reading script without changing canonical story rows or IDs.
const separator = '='.repeat(72);
const names = new Map([
  ['LOCKE', '洛克'], ['TONY', '托尼'], ['LILI', '小莉'], ['ARTHUR', '亚瑟'],
  ['ADAM', '蛋仔'], ['MIKO', '小柔'], ['WILLY', '威利'], ['DR. KATE', '凯特医生'],
]);
export const normalizeScriptText = text => text.trim().replace(/\s+/gu, ' ');
const paragraphs = text => text.trim().split(/\n\s*\n/u).filter(Boolean);
function requireThat(condition, message) {
  if (!condition) throw new Error(`English script: ${message}`);
}
function unitsFor(body) {
  const blocks = paragraphs(body);
  const units = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const [heading, ...speech] = block.split('\n');
    const speaker = names.get(heading.trim());
    if (speaker) {
      const text = speech.length ? speech.join('\n') : blocks[++i];
      requireThat(text && !names.has(text.trim()), `missing speech after ${block}`);
      units.push({ speaker, text: normalizeScriptText(text) });
    } else units.push({ speaker: null, text: normalizeScriptText(block) });
  }
  return units;
}
function mergeUnits(units, start, count) {
  const group = units.slice(start, start + count);
  requireThat(group.length === count, 'missing paragraph in a merged passage');
  requireThat(group.slice(1).every(unit => unit.speaker === null), 'unexpected speaker in a merged passage');
  units.splice(start, count, { speaker: group[0].speaker, text: group.map(unit => unit.text).join(' ') });
}
function mappedUnits(id, body) {
  let alternate = null;
  if (id === 'sunset') {
    const parts = body.split('ALTERNATE FIRST SPEECH — NO OLD PHOTO COLLECTED');
    requireThat(parts.length === 2, 'sunset needs both photo variants');
    body = parts[0];
    const variants = unitsFor(parts[1]);
    requireThat(variants.length === 2 && variants[0].speaker === '洛克', 'invalid alternate sunset speech');
    mergeUnits(variants, 0, 2);
    alternate = variants[0].text;
  }
  const units = unitsFor(body);
  // The reading copy has paragraph breaks inside existing cards. Keep those cards intact.
  if (['pillow-observation', 'miko-text', 'rehearsal-arrival'].includes(id)) mergeUnits(units, 0, 2);
  if (id === 'cornfield') mergeUnits(units, 0, 2);
  if (id === 'final-reconstruction') mergeUnits(units, 1, 2);
  if (id === 'arrest') { mergeUnits(units, 0, 2); mergeUnits(units, 2, 2); }
  if (id === 'sunset') { mergeUnits(units, 1, 2); mergeUnits(units, 9, 2); }
  if (id === 'kat-miko-private') {
    const end = units.pop();
    requireThat(end?.speaker === null && end.text === 'End.', 'missing final End cue');
  }
  if (id === 'solve-success') units[0].text = units[0].text.replace(/^Game prompt: /u, '');
  return { units, alternate };
}
function referenceEntries(body) {
  const entries = new Map();
  const matcher = /^(.+) \[([^\]]+)\]\n([\s\S]*?)(?=\n[^\n]+ \[[^\]]+\]\n|(?![\s\S]))/gmu;
  for (const match of body.trim().matchAll(matcher)) {
    requireThat(!entries.has(match[2]), `duplicate reference ${match[2]}`);
    entries.set(match[2], { label: match[1], text: normalizeScriptText(match[3]) });
  }
  return entries;
}
export function compileEnglishScript(document, content) {
  const sections = document.split(`${separator}\n`).slice(1);
  requireThat(sections.length % 2 === 0, 'unpaired section separator');
  const scenes = new Map();
  const references = new Map();
  for (let i = 0; i < sections.length; i += 2) {
    const heading = sections[i].trim();
    const body = sections[i + 1].trim();
    const id = heading.match(/\[([^\]]+)\]$/u)?.[1];
    const target = id ? scenes : references;
    const key = id ?? heading.split(' — ')[0];
    requireThat(!target.has(key), `duplicate section ${key}`);
    target.set(key, body);
  }
  requireThat(scenes.size === Object.keys(content.dialogues).length, 'dialogue scene coverage changed');
  const translations = new Map();
  const dialogueOverrides = {};
  const expectedRows = {};
  function assign(source, target) {
    requireThat(typeof source === 'string', 'missing Chinese source');
    const text = normalizeScriptText(target);
    requireThat(text.length > 0, `empty text for ${source}`);
    requireThat(!translations.has(source) || translations.get(source) === text, `conflicting shared source: ${source}`);
    translations.set(source, text);
  }
  // These canonical strings are shared with the notebook, which has different approved prose.
  const notebookShared = new Set([content.clues.hand.detail, content.clues['tony-pillow'].detail]);
  for (const [id, rows] of Object.entries(content.dialogues)) {
    requireThat(scenes.has(id), `missing scene ${id}`);
    const { units, alternate } = mappedUnits(id, scenes.get(id));
    requireThat(units.length === rows.length, `${id}: expected ${rows.length} cards, found ${units.length}`);
    expectedRows[id] = units;
    rows.forEach(([speaker, source], line) => {
      const unit = units[line];
      const silentAction = id === 'kat-miko-private' && [8, 23].includes(line);
      requireThat(unit.speaker === (silentAction ? null : speaker), `${id}:${line}: speaker/order mismatch`);
      if (silentAction || notebookShared.has(source)) {
        (dialogueOverrides[id] ??= {})[line] = unit;
        // Context-free history from very old saves still needs a neutral ellipsis.
        if (silentAction) assign(source, '…');
        else if (!translations.has(source)) assign(source, unit.text);
      } else assign(source, unit.text);
    });
    if (alternate) {
      const variant = content.lineFor({ dialogue: { id, line: 1 }, clues: [] });
      assign(variant[1], alternate);
    }
  }
  const notebook = referenceEntries(references.get('CLUE NOTEBOOK') ?? '');
  requireThat(notebook.size === Object.keys(content.clues).length, 'clue coverage changed');
  for (const [id, clue] of Object.entries(content.clues)) {
    const entry = notebook.get(id);
    requireThat(entry, `missing clue ${id}`);
    assign(clue.label, entry.label);
    if (notebookShared.has(clue.detail)) translations.set(clue.detail, entry.text);
    else assign(clue.detail, entry.text);
  }
  const cast = references.get('CAST') ?? '';
  for (const [speaker, role, detail, age] of content.profiles) {
    const display = [...names].find(([, canonical]) => canonical === speaker)?.[0];
    const match = cast.match(new RegExp(`^${display.replace('.', '\\.')} — ${age} — ([^\\n]+)\\n([^\\n]+)`, 'mu'));
    requireThat(match, `missing cast entry ${display}`);
    assign(role, match[1]);
    assign(detail, match[2]);
  }
  const relationships = cast.split("ARTHUR'S RELATIONSHIPS\n")[1]?.trim();
  requireThat(relationships, 'missing Arthur relationships');
  const relationshipSentences = relationships.match(/[^.!?]+[.!?]/gu)?.map(text => text.trim());
  requireThat(relationshipSentences?.length === 3, 'expected three relationship sentences');
  assign(content.arthurRelationships[0], 'Acoustic guitar'); // Role already supplied by the cast heading.
  assign(content.arthurRelationships[1], relationshipSentences.slice(0, 2).join(' '));
  assign(content.arthurRelationships[2], relationshipSentences[2]);
  const observations = referenceEntries(references.get('SEARCH OBSERVATIONS') ?? '');
  for (const [id, scene] of Object.entries(content.scenes)) {
    const field = scene.description ? 'description' : scene.inspection ? 'inspection' : null;
    if (field) {
      requireThat(observations.has(id), `missing observation ${id}`);
      assign(scene[field], observations.get(id).text);
    }
  }
  const artwork = references.get('ARTWORK / ACCESSIBILITY DESCRIPTIONS') ?? '';
  const alt = new Map([...artwork.matchAll(/^\[([^\]]+)\]\n([\s\S]*?)(?=\n\[[^\]]+\]\n|(?![\s\S]))/gmu)]
    .map(match => [match[1], normalizeScriptText(match[2])]));
  const altLocations = [
    ['fall-reconstruction', 0, 'fall-reconstruction'], ['review-feather', 0, 'review-feather'],
    ['review-feather', 1, 'review-feather'], ['final-reconstruction', 1, 'final-reconstruction'],
    ['milk', 2, 'milk — before'], ['milk', 3, 'milk — now'],
    ['inspect-clip', 0, 'inspect-clip'], ['inspect-clip', 1, 'inspect-clip'], ['inspect-clip', 2, 'inspect-clip'],
    ['willy-crash', 1, 'willy-crash — car'], ['willy-crash', 2, 'willy-crash — recovered phone'],
    ['willy-crash', 3, 'willy-crash — phone detail'], ['hospital-followup', 20, 'hospital-followup'],
  ];
  // The artwork appendix distinguishes two review-feather captions with the same scene ID.
  const featherCaptions = [...artwork.matchAll(/^\[review-feather\]\n([^\n]+)/gmu)].map(match => match[1]);
  requireThat(featherCaptions.length === 2, 'missing feather artwork captions');
  for (const [id, line, key] of altLocations) {
    const value = id === 'review-feather' ? featherCaptions[line] : alt.get(key);
    requireThat(value, `missing artwork caption ${key}`);
    assign(content.dialogues[id][line][2].alt, value);
  }
  requireThat(alt.has('open bag'), 'missing open bag description');
  assign('打开的挎包，里面有药盒、诊断书和处方、泛黄的检查记录和一个未拆封的盒子', alt.get('open bag'));
  return { translations, dialogueOverrides, expectedRows, sceneIds: [...scenes.keys()] };
}
