import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as content from '../src/content.mjs';
import { english } from '../src/locales/en.mjs';
import { compileEnglishScript } from './english-script.mjs';

const root = new URL('../', import.meta.url);
const document = await readFile(new URL('docs/english-script.txt', root), 'utf8');
const { translations, dialogueOverrides } = compileEnglishScript(document, content);
for (const source of translations.keys()) {
  if (!Object.hasOwn(english, source)) throw new Error(`Unregistered Chinese key: ${source}`);
}
const updated = { ...english, ...Object.fromEntries(translations) };
const catalog = '// Chinese source strings are the lookup keys. Generated story text comes from docs/english-script.txt.\n' +
  '// Run node scripts/sync-english-script.mjs after editing the approved document.\n' +
  'export const english = {\n' + Object.entries(updated).map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`).join('\n') + '\n};\n\n' +
  '// Context-specific prose and silent actions; canonical story rows and saves remain Chinese.\n' +
  'export const englishDialogueOverrides = ' + JSON.stringify(dialogueOverrides, null, 2) + ';\n';
const path = new URL('src/locales/en.mjs', root);
if (process.argv.includes('--check')) {
  if (await readFile(path, 'utf8') !== catalog) throw new Error('English catalog is out of sync. Run node scripts/sync-english-script.mjs.');
} else await writeFile(path, catalog);
console.log(`${process.argv.includes('--check') ? 'Verified' : 'Synced'} ${translations.size} document entries in ${fileURLToPath(path)}.`);
