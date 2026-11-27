import { english, englishDialogueOverrides } from './locales/en.mjs?v=party-fork-1';
import { dialogues, lineFor } from './content.mjs?v=party-fork-1';

export const LANGUAGE_KEY = 'band-mystery.language.v1';
export const languages = ['zh', 'en'];
let language = 'zh';
export const getLanguage = () => language;
export const hasEnglish = source => Object.hasOwn(english, source);

export function readLanguage(storage) {
  try {
    const value = (storage ?? globalThis.localStorage)?.getItem(LANGUAGE_KEY);
    return languages.includes(value) ? value : 'zh';
  } catch { return 'zh'; }
}
export function setLanguage(value, storage) {
  language = languages.includes(value) ? value : 'zh';
  try { (storage ?? globalThis.localStorage)?.setItem(LANGUAGE_KEY, language); } catch {}
  return language;
}

// Save files and logic retain canonical Chinese names/IDs. Only presentation is translated.
// These adapters also translate existing history labels saved before i18n was introduced.
const historyPrefixes = [
  ['对话 · ', '对话 · {scene}', 'scene'],
  ['已记录 · ', '已记录 · {clue}', 'clue'],
  ['前往 · ', '前往 · {scene}', 'scene'],
  ['从此处继续 · ', '从此处继续 · {scene}', 'scene'],
  ['已检查 · ', '已检查 · {scene}', 'scene'],
];
export function t(source, values = {}, locale = language) {
  if (source == null) return '';
  if (typeof source !== 'string') return String(source);
  let result = source;
  if (locale === 'en') {
    if (hasEnglish(source)) result = english[source];
    else {
      const spoken = source.match(/^(.+?)：「([\s\S]*)」$/u);
      if (spoken) return `${t(spoken[1], {}, locale)}: “${t(spoken[2], {}, locale)}”`;
      for (const [prefix, key, variable] of historyPrefixes) {
        if (source.startsWith(prefix)) return t(key, { [variable]: source.slice(prefix.length) }, locale);
      }
      if (source.startsWith('已记录：')) {
        const list = source.slice('已记录：'.length).split('、').map(clue => t(clue, {}, locale)).join(', ');
        return t('已记录：{clues}', { clues: list }, locale);
      }
      const profile = source.match(/^查看(.+)的人物档案$/u);
      if (profile) return t('查看{name}的人物档案', { name: profile[1] }, locale);
      // Unknown text from old saves remains readable. New untranslated source fails CI coverage checks.
    }
  }
  return result.replace(/\{([a-zA-Z]+)\}/g, (placeholder, key) =>
    Object.hasOwn(values, key) ? t(values[key], {}, locale) : placeholder);
}

// Presentation may turn an ellipsis into silent action. Never change canonical speakers in saves.
export function localizedLine(progress, locale = language) {
  const row = lineFor(progress);
  if (locale !== 'en') return row;
  const { id, line } = progress.dialogue;
  const override = englishDialogueOverrides[id]?.[line];
  return [override ? override.speaker : row[0], override?.text ?? t(row[1], {}, locale), ...row.slice(2)];
}

// Checkpoints identify the context of old Chinese history labels, including optional photo state.
export function localizedHistory(history, locale = language) {
  let cursor = null;
  return history.map(row => {
    if (row.checkpoint) cursor = structuredClone(row.checkpoint);
    else if (cursor?.dialogue) {
      const { id, line } = cursor.dialogue;
      if (dialogues[id]?.[line]) {
        const [speaker, message] = lineFor(cursor);
        const canonicalLabel = speaker ? `${speaker}：「${message}」` : message;
        if (row.label === canonicalLabel) {
          const [displaySpeaker, displayText] = localizedLine(cursor, locale);
          cursor.dialogue.line++;
          if (locale !== 'en') return row.label;
          return displaySpeaker ? `${t(displaySpeaker, {}, locale)}: “${displayText}”` : displayText;
        }
      }
    }
    return t(row.label, {}, locale);
  });
}

export function applyPageLanguage(doc) {
  doc.documentElement.lang = language === 'en' ? 'en' : 'zh-Hans';
  for (const element of doc.querySelectorAll('[data-i18n]')) {
    const value = t(element.dataset.i18n);
    if (element.id === 'cover-title' && language === 'zh') {
      element.replaceChildren(doc.createTextNode(value.slice(0, 4)), doc.createElement('wbr'), doc.createTextNode(value.slice(4)));
    } else element.textContent = value;
  }
  for (const element of doc.querySelectorAll('[data-i18n-aria-label]')) element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  const select = doc.getElementById('language');
  if (select) select.value = language;
}
