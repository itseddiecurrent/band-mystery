import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import * as content from '../src/content.mjs';
import { english } from '../src/locales/en.mjs';
import { LANGUAGE_KEY, applyPageLanguage, getLanguage, hasEnglish, readLanguage, setLanguage, t } from '../src/i18n.mjs';
import { dispatch, newGame, parseSave } from '../src/game.mjs';
import { canSolve } from '../src/evidence_list.mjs';

const han = /\p{Script=Han}/u;
const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

// Inspect quoted source without requiring a build step or test-only parser package.
// Ignore comments and preserve template bodies so canonical history templates are explicit.
function sourceStrings(source) {
  const found = [];
  for (let i = 0; i < source.length; i++) {
    if (source.slice(i, i + 2) === '//') { i = source.indexOf('\n', i); if (i < 0) break; continue; }
    if (source.slice(i, i + 2) === '/*') { const next = source.indexOf('*/', i + 2); if (next < 0) break; i = next + 1; continue; }
    const quote = source[i];
    if (!['"', "'", '`'].includes(quote)) continue;
    let value = '';
    for (i++; i < source.length; i++) {
      if (source[i] === '\\') {
        i++;
        value += ({ n: '\n', r: '\r', t: '\t' })[source[i]] ?? source[i];
      } else if (source[i] === quote) break;
      else value += source[i];
    }
    found.push({ value, template: quote === '`' });
  }
  return found;
}
const canonicalHistoryTemplates = new Set([
  '对话 · ${scenes[game.progress.scene].label}',
  '已记录 · ${clues[id].label}',
  '已记录：${clues[id].label}',
  '前往 · ${scenes[scene].label}',
  '从此处继续 · ${scenes[checkpoint.scene].label}',
  '查看${name}的人物档案',
  '已检查 · ${room.label}',
]);

function collectText(value, result = new Set(), key = '') {
  if (typeof value === 'string' && han.test(value) && !/\.(png|webp|jpg)$/.test(value) && key !== 'brief') result.add(value);
  else if (Array.isArray(value)) value.forEach(item => collectText(item, result));
  else if (value && typeof value === 'object') for (const [name, child] of Object.entries(value)) collectText(child, result, name);
  return result;
}

test('all story dialogue, clues, names, locations, hotspots, profiles and accessibility text have English', () => {
  const required = collectText(content);
  for (const [id, lines] of Object.entries(content.dialogues)) {
    for (let line = 0; line < lines.length; line++) {
      collectText(content.lineFor({ dialogue: { id, line }, clues: [] }), required);
      collectText(content.lineFor({ dialogue: { id, line }, clues: ['old-photo'] }), required);
    }
  }
  const missing = [...required].filter(source => !hasEnglish(source));
  assert.deepEqual(missing, [], 'Add English translations in src/locales/en.mjs for every new or changed source string.');
  for (const source of required) assert.equal(han.test(t(source, {}, 'en')), false, source);
});

test('both sides of every translation preserve placeholders, with no Chinese-only English entries', () => {
  const placeholders = value => [...value.matchAll(/\{([a-zA-Z]+)\}/g)].map(match => match[1]).sort();
  for (const [source, translated] of Object.entries(english)) {
    assert.equal(typeof translated, 'string', source);
    assert.ok(translated.trim(), source);
    assert.equal(han.test(translated), false, source);
    assert.deepEqual(placeholders(translated), placeholders(source), source);
    assert.doesNotMatch(translated, /\b(Danzai|Lily|Xiaorou)\b/, source);
  }
});

test('future Chinese UI and game messages require a matching English entry', async () => {
  async function modules(directory) {
    const files = [];
    for (const entry of await readdir(new URL(`../${directory}`, import.meta.url), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory() && entry.name !== 'locales') files.push(...await modules(path));
      else if (entry.isFile() && /\.m?js$/.test(path) && !['src/content.mjs', 'src/i18n.mjs'].includes(path)) files.push(path);
    }
    return files;
  }
  for (const file of await modules('src')) {
    const source = await read(file);
    const missing = sourceStrings(source)
      .filter(({ value, template }) => han.test(value) && !/\.(png|webp|jpg)$/.test(value) &&
        !(template && canonicalHistoryTemplates.has(value)) && han.test(t(value, {}, 'en')))
      .map(({ value }) => value);
    assert.deepEqual(missing, [], `${file}: register new text and localize its display path.`);
    for (const match of source.matchAll(/\b(?:t|button)\(\s*(['"])([^'"\n]*)\1/g)) {
      assert.ok(hasEnglish(match[2]), `${file}: missing bilingual UI key: ${match[2]}`);
    }
    for (const match of source.matchAll(/(?:textContent|innerText|innerHTML|\.alt)\s*=\s*(['"`])([^'"`\n]+)\1/g)) {
      assert.equal(han.test(match[2]), false, `${file}: display text must use t(), not a raw Chinese literal.`);
    }
  }
});

test('title-page strings and accessible labels are registered; language selector precedes New Game', async () => {
  const html = await read('index.html');
  for (const match of html.matchAll(/data-i18n(?:-aria-label)?="([^"]+)"/g)) assert.ok(hasEnglish(match[1]), match[1]);
  for (const match of html.matchAll(/<([a-z0-9]+)\b([^>]*)>([^<>]+)<\/\1>/g)) {
    if (match[1] === 'option' || !match[3].trim() || /^\d+\s*\/\s*\d+$/.test(match[3].trim())) continue; // Language autonyms and numeric counters are intentional.
    assert.match(match[2], /data-i18n=/, `Unlocalized HTML text: ${match[3]}`);
  }
  for (const match of html.matchAll(/<[^>]+aria-label="([^"]+)"[^>]*>/g)) {
    assert.ok(match[0].includes(`data-i18n-aria-label="${match[1]}"`), match[1]);
  }
  assert.ok(html.indexOf('id="language"') < html.indexOf('id="new"'));
  assert.match(html, /<option value="zh"/);
  assert.match(html, /<option value="en"/);
});

test('character names use the agreed English spellings, including Dr. Kate', () => {
  const names = { 小柔: 'Miko', 威利: 'Willy', 蛋仔: 'Adam', 亚瑟: 'Arthur', 小莉: 'Lili', 洛克: 'Locke', 托尼: 'Tony', 凯特医生: 'Dr. Kate' };
  for (const [source, name] of Object.entries(names)) assert.equal(t(source, {}, 'en'), name);
});

test('formatting, notices and legacy history render in the selected language without changing stored labels', () => {
  const line = content.dialogues.opening[1][1];
  const labels = [
    `洛克：「${line}」`,
    '对话 · 楼上房间', '前往 · 后院', '已记录 · 碎酒杯', '已检查 · 小柔和小莉的房间',
    '从此处继续 · 医院病房', '查看亚瑟的人物档案', '查看人物档案',
    '已记录：威利的车祸记录、威利手机里的施暴记录',
  ];
  for (const source of labels) {
    assert.equal(t(source, {}, 'zh'), source);
    assert.equal(han.test(t(source, {}, 'en')), false, source);
  }
  assert.equal(t(labels[0], {}, 'en'), 'Locke: “My head\'s spinning. What happened?”');
  assert.equal(t('去{place}{checked}', { place: content.scenes['band-bedroom'].label, checked: '（已检查）' }, 'en'), "Go to Arthur, Willy, and Adam's room (searched)");
  assert.equal(t('{age} 岁 · {role}', { age: 24, role: '调音师' }, 'en'), 'Age 24 · Sound engineer');
});

test('language preference persists independently and blocked storage falls back safely', () => {
  const store = storage();
  assert.equal(readLanguage(store), 'zh');
  setLanguage('en', store);
  assert.equal(store.getItem(LANGUAGE_KEY), 'en');
  assert.equal(readLanguage(store), 'en');
  assert.equal(getLanguage(), 'en');
  const broken = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(readLanguage(broken), 'zh');
  assert.equal(setLanguage('en', broken), 'en');
  assert.equal(t('小莉'), 'Lili');
  assert.equal(setLanguage('unsupported', store), 'zh');
});

test('switching language preserves saves, canonical identities, back/forward and accusation rules', () => {
  const store = storage();
  setLanguage('zh', store);
  let game = newGame();
  for (let i = 0; i < 8; i++) game = dispatch(game, { type: 'forward' }).game;
  const saved = JSON.stringify(game);
  setLanguage('en', store);
  const restored = parseSave(saved);
  assert.deepEqual(restored, game);
  assert.equal(JSON.stringify(restored), saved);
  for (const row of restored.history) assert.equal(han.test(t(row.label)), false, row.label);
  const back = dispatch(restored, { type: 'back' }).game;
  assert.deepEqual(dispatch(back, { type: 'forward' }).game.progress, restored.progress);
  assert.equal(content.portraitFor('蛋仔', 'opening-backstage'), '蛋仔.png');
  const progress = { scene: 'review', dialogue: null, finished: false, clues: Object.keys(content.clues), reviewedGroups: Object.keys(content.reviewGroups) };
  assert.equal(canSolve(progress, '蛋仔'), true);
  assert.equal(canSolve(progress, 'Adam'), false); // English names never replace canonical logic identifiers.
  setLanguage('zh', store);
});
