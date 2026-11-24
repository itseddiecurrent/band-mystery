# English script: visual novel localization brief

## Source and scope

Translate the implemented Chinese in [src/content.mjs](../src/content.mjs) into English. Read complete connected scenes, including [lineFor()](../src/content.mjs) with and without the optional old photo. [场景.txt](../场景.txt) supplies context, but contains unimplemented material and older wording; the playable Chinese governs this translation. The authoring canvas does not define playable routes.

The current English follows the user-approved performance script in [english-script.txt](english-script.txt), revised with `sw-dialogue` after the Chinese-source translation. It uses casual exchanges and short action paragraphs. Canonical Chinese text, speakers, row positions, artwork associations and save identifiers stay unchanged. English presentation turns two of Miko's ellipses into silent action and preserves the separate story/notebook wording for the shared hand and pillow sources.

## English that works in a dialogue box

Write what this person would say to the other person at this moment. Translate the social action of an idiom, rather than its clause structure. Use contractions, ordinary verbs, and connected spoken beats. Do not turn each Chinese clause into a separate clipped sentence, or make friends explain themselves in formal report language. Short reactions and actual hesitations should still be short.

For example, Adam's backstage line now reads:

> What plotting? We just get together to practice. We leave the personal stuff offstage. Miko and Willy broke up ages ago, and they still play together.

Here 战友 conveys solidarity onstage; 私人恩怨 conveys leaving personal differences out of performing. The line is a familiar, tactless response to teasing, not a military declaration or a formal denial of a grievance. Keep the breakup example and Willy's irritated response together.

Use plain third-person present for immediate on-screen action and past tense for accounts of completed events. Preserve explicit first-person thoughts and notebook observations. Narration may stay close to Locke, but must not invent his feelings or disclose things he cannot know. English punctuation and automatic wrapping replace Chinese surface punctuation; do not add manual line breaks or extra pause effects.

## Voices and relationships

- **Locke:** practical questions, modest about praise, attentive to Miko through ordinary words and small actions. His concern should not sound like therapy or a detective's speech. Later questioning can be firm without becoming an omniscient verdict.
- **Tony:** familiar jokes followed by practical organizing, alarm and concern. Keep his speech direct.
- **Lili:** dry teasing, then a dazed account of limited things she saw and heard. She cannot identify the door-opener.
- **Willy:** contemptuous and crude where the Chinese is crude. Preserve the cabbage insult; do not add extra profanity elsewhere to manufacture attitude.
- **Arthur:** defensive about his work, then angrily returns the insult. Keep his early-hours practice and stuck-tape singing comparison.
- **Adam:** easy banter and a tactless example in company, pointed denials later. His past guitar threat was only for show, not an admitted assault. Do not give him a threatening delivery before the source does.
- **Miko:** warm and familiar early; vulnerable, hesitant and guarded in hospital; increasingly pointed with Kate. Preserve her shame as her own words, not the narrator's judgment. Neither her silence nor an embrace is a confession.
- **Dr. Kate:** clinical brevity, friendly teasing, then personal suspicion. Her medical findings remain precise. Her opinions, report suppression and explicit lack of evidence must remain visible.

Display names are **Miko, Willy, Adam, Arthur, Lili, Locke, Tony, Dr. Kate**. Do not alter Chinese canonical identities. Miko and Willy are exes; Locke is not established as her boyfriend. No invented dialects, habitual nicknames, relationships or motives.

## Evidence and knowledge boundaries

Use **tie clip**, **spare pillow**, **black feathers**, and **signal jammer** consistently. Distinguish colloquial **suffocation** from the report's **mechanical asphyxia**. Reserve the explicit smothering method for its reveal. Preserve Arthur's left hand, three diagonal grooves, nonfatal fall, later murder, feather residue and the switched-back tie clip.

Keep testimony, suspicion and established findings separate. Early powder is unidentified; sleeping pills are only suspected then. Adam's initial account says Arthur was lying below, not that Adam established death. Miko's account supports Locke's question about Willy taking the jammer; it is not independent proof. The early wheel failure remains under investigation until later evidence establishes tampering.

The hospital pregnancy disclosure does not yet reveal the late private scene's earlier fetal death or substances in the blood. Kate's IP-leak and mastermind hypotheses remain hypotheses, with no evidence. Locke is absent from that scene. Miko neither confesses nor receives an invented assurance of innocence.

Preserve source discrepancies instead of silently repairing them: the vehicle review gives everyone opportunity; the clue/confrontation also includes Tony's specific Adam sighting. Lili hears a thud before breaking glass. The person opening the door remains unidentified. The missing shoe is not automatically identified at the bedroom doorway.

## Syncing the approved document

Edit the readable script first, keeping the scene IDs and speaker headings. Then run:

```sh
node scripts/sync-english-script.mjs
node --test
```

`node scripts/sync-english-script.mjs --check` verifies that the catalog still matches the document. The test suite runs that check and verifies all 222 story cards, both sunset variants, notebook/reference text and silent actions. New Chinese story content still needs coordinated bilingual editing; this command does not translate it automatically.

Paragraphs inside an existing card are joined with spaces. Document headings, uppercase speaker formatting, and the standalone End cue are editorial formatting, not game dialogue. Canonical source strings remain the catalog keys. Four context overrides preserve the hand/pillow story versions and the two distinct silent beats; Chinese rendering remains canonical. History uses stored checkpoints to recover those contexts, with a readable fallback for ancient labels without checkpoints.

This sync passed 57 workspace tests (52 in the isolated PR snapshot; the extra 5 are unrelated local dashboard tests). Browser checks used disposable local checkpoint fixtures to verify backstage and hospital dialogue, both silent beats, their history, Chinese/English save continuation, both photo variants, notebook testimony, shared clue text, cast profiles, back/forward and the ending. Desktop and 390px portrait checks passed; the longest tested caption did not overflow. See [the current game preview](performance-script-preview.jpg) and [sync QA record](performance-sync-qa.json). No full route playthrough was repeated for this text integration; game progression is covered by the existing tests.

## Previous translation pass (PR #7)

The source was frozen at upstream `412f61e4dcc406dfe100451d43658c1bfb8ac3c9`. A complete native-module extraction/reinsertion round trip was byte-identical and passed all 46 repository tests before translation. Stable IDs, source hashes, scene/speaker metadata, shared locations and the dynamic sunset variant were extracted for 275 units.

The backstage calibration received independent source-based review before the language profile and character/evidence Bible were frozen. Three bounded scene groups were translated, then every entry was reviewed by a different native agent, or by the coordinator for the evidence draft. The coordinator adjudicated 31 sparse revisions for meaning, naturalness and cross-scene consistency. This is AI editorial review, separate from the human PR approval required by the contribution guide. A further review covered all early/hospital entries. Review is an editorial judgment; coverage checks do not prove prose quality.

Automated QA found no missing, duplicate or reordered IDs, altered source hashes, placeholder errors or residual Chinese in target prose. All 46 exact-release tests passed. The existing history-format expectation was updated for the new opening line, with coverage checks retained. The shipped BIZ UDGothic fonts cover all 59 distinct target codepoints and were verified selected/loaded in the browser.

Browser testing exercised the full implemented story through the private ending, both photo/no-photo sunset variants, two report orders, optional messages and bag clues, save recovery, same-checkpoint Chinese/English switching, history rewind, and back/forward. Desktop and 390px portrait checks included Adam's exchange and the longest sunset caption. See [the preview](vn-english-preview.jpg).

Original writing embedded in artwork remains Chinese, with the existing accompanying translated clue prose. Not every optional hotspot was revisited in the browser; Arthur's phone is covered by automated tests. Short landscape and an exhaustive device matrix were not tested. The translation patch does not itself imply a public deployment.

The resumable working project, frozen source, Bible, JSONL jobs/drafts/reviews, build, QA and checksummed replacement patch are stored separately in `band-mystery-localization/vn-en-20261124` beside this repository; source snapshots and tool environments are not shipped with the game.
