# Repository instructions

## Bilingual game text

The playable game supports Chinese (`zh`, default) and English (`en`). Every new or changed player-visible game string must work in both languages in the same change.

- Keep Chinese source text in `src/content.mjs`, HTML `data-i18n` attributes, or translation-aware UI helpers. Add/update its English counterpart in `src/locales/en.mjs` at the same time.
- Use `t(source, values)` from `src/i18n.mjs` for presentation. UI button, notification and paragraph helpers already translate their input. Use named placeholders for dynamic text; do not concatenate translated sentence fragments.
- Keep story IDs, canonical Chinese character identifiers, asset filenames, evidence IDs, analytics values and save data language-independent. Translate them only when displayed. A locale switch must not reset progress or change decisions.
- Required name mapping: 小柔 → Miko; 威利 → Willy; 蛋仔 → Adam; 亚瑟 → Arthur; 小莉 → Lili; 洛克 → Locke; 托尼 → Tony; 凯特医生 → Dr. Kate. Do not show Danzai, Lily or Xiaorou in English game text.
- Include dialogue, narration, clues, scene/hotspot labels, profiles, notices, confirmations, history and accessible labels. For new artwork with important written clues, supply readable information in both languages.
- For English story prose, follow `docs/translation-brief.md`: read connected scenes against the Chinese, preserve each character's voice and the evidence's degree of certainty, and review for natural spoken rhythm. Keep technical reports precise; do not add explanatory clues or villainous gestures to make a scene more dramatic.
- Run `node --test` before submitting runtime changes. Translation tests must pass; do not remove or weaken coverage checks to bypass a missing translation. Manually verify affected screens in both languages, including a narrow layout when UI changes.

See `docs/i18n.md` for the authoring workflow and `CONTRIBUTING.md` for branches, review and merge cleanup. Keep unrelated local dashboard work out of game changes.
