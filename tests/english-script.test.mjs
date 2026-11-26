import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import * as content from '../src/content.mjs';
import { english } from '../src/locales/en.mjs';
import { localizedHistory, localizedLine, t } from '../src/i18n.mjs';
import { compileEnglishScript } from '../scripts/english-script.mjs';

const document = await readFile(new URL('../docs/english-script.txt', import.meta.url), 'utf8');
const compiled = compileEnglishScript(document, content);
const progressAt = (id, line, clues = []) => ({ dialogue: { id, line }, clues });

test('all approved script cards, notebook entries and reference text stay synced without changing Chinese rows', () => {
  assert.equal(compiled.sceneIds.length, 46);
  let cards = 0;
  for (const [id, rows] of Object.entries(content.dialogues)) {
    for (let line = 0; line < rows.length; line++) {
      const progress = progressAt(id, line, ['old-photo']);
      const original = content.lineFor(progress);
      assert.deepEqual(localizedLine(progress, 'zh'), original);
      assert.deepEqual(localizedLine(progress, 'en').slice(0, 2), [compiled.expectedRows[id][line].speaker, compiled.expectedRows[id][line].text]);
      assert.deepEqual(localizedLine(progress, 'en')[2], original[2], 'Artwork metadata must remain unchanged.');
      cards++;
    }
  }
  assert.equal(cards, 222);
  for (const [source, text] of compiled.translations) assert.equal(english[source], text, source);
  assert.equal(Object.keys(english).length, 535);
  execFileSync(process.execPath, ['scripts/sync-english-script.mjs', '--check'], { cwd: new URL('../', import.meta.url) });
});

test('silent actions hide the English speaker while Chinese and canonical history retain Miko', () => {
  for (const [line, expected] of [[8, 'Miko says nothing.'], [23, "Miko doesn't answer."]]) {
    const progress = progressAt('kat-miko-private', line);
    const source = content.lineFor(progress);
    const history = [{ label: '对话 · 医院病房', checkpoint: progress }, { label: `小柔：「${source[1]}」` }];
    const before = JSON.stringify(history);
    assert.deepEqual(localizedLine(progress, 'en').slice(0, 2), [null, expected]);
    assert.deepEqual(localizedLine(progress, 'zh').slice(0, 2), ['小柔', '。。。']);
    assert.equal(localizedHistory(history, 'en')[1], expected);
    assert.equal(localizedHistory(history, 'zh')[1], '小柔：「。。。」');
    assert.equal(JSON.stringify(history), before);
  }
  assert.equal(localizedHistory([{ label: '小柔：「。。。」' }], 'en')[0], 'Miko: “…”', 'Old labels without checkpoints remain readable.');
});

test('shared hand and pillow source strings keep the separate approved story and notebook wording', () => {
  const hand = localizedLine(progressAt('hand', 0), 'en')[1];
  const notebook = t(content.clues.hand.detail, {}, 'en');
  assert.ok(hand.startsWith('Arthur clutches something silvery'));
  assert.ok(notebook.startsWith('Something silvery, possibly metal'));
  assert.notEqual(hand, notebook);
  assert.notEqual(localizedLine(progressAt('pillow-observation', 0), 'en')[1], t(content.clues['tony-pillow'].detail, {}, 'en'));
});

test('history and both optional-photo speeches match display text after a save is restored', () => {
  for (const clues of [[], ['old-photo']]) {
    const progress = progressAt('sunset', 1, clues);
    const [speaker, source] = content.lineFor(progress);
    const oldHistory = JSON.parse(JSON.stringify([
      { label: '对话 · 日落', checkpoint: progress },
      { label: `${speaker}：「${source}」` },
    ]));
    const line = localizedLine(progress, 'en')[1];
    assert.equal(localizedHistory(oldHistory, 'en')[1], `Locke: “${line}”`);
    assert.equal(localizedHistory(oldHistory, 'zh')[1], oldHistory[1].label);
    if (clues.length) assert.ok(line.includes("last summer's photo"));
    else { assert.ok(line.includes("At last summer's show")); assert.ok(!line.includes("last summer's photo")); }
  }
});

test('script sync rejects missing scenes, speaker changes and missing alternate-route text', () => {
  assert.throws(() => compileEnglishScript(document.replace('[opening-backstage]', '[unknown-scene]'), content), /missing scene/);
  assert.throws(() => compileEnglishScript(document.replace('ARTHUR\nDo you have', 'TONY\nDo you have'), content), /speaker\/order mismatch/);
  assert.throws(() => compileEnglishScript(document.replace('ALTERNATE FIRST SPEECH — NO OLD PHOTO COLLECTED', 'REMOVED ALTERNATE'), content), /sunset needs both photo variants/);
});


test('multiline notebook testimony and artwork descriptions are not truncated at paragraph breaks', () => {
  const expected = document.split("Miko's statement [miko-testimony]\n")[1].split('='.repeat(72))[0].trim().replace(/\s+/gu, ' ');
  assert.equal(t(content.clues['miko-testimony'].detail, {}, 'en'), expected);
  assert.ok(expected.includes('Locke stopped asking when she became unwell.'));
  const caption = document.split('[open bag]\n')[1].trim().replace(/\s+/gu, ' ');
  assert.ok(Object.values(english).includes(caption));
  assert.ok(caption.endsWith("and an unopened box inside Miko's shoulder bag."));
});
