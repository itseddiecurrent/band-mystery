import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import { clues, dialogues, lineFor, pendingArtwork, portrait, portraitFor, profiles, purseHotspots, purseImages, reviewGroups, scenes } from '../src/content.mjs';
import { dispatch, newGame, parseSave, visitDestinations } from '../src/game.mjs';

const step = (game, type) => dispatch(game, { type }).game;
function visitWithoutAdvancing(game, type, destination) {
  const response = dispatch(game, { type });
  assert.equal(response.effect, null);
  assert.deepEqual(response.game.progress, { ...game.progress, visiting: destination });
  return response.game;
}
function finishDialogue(game) {
  for (let i = 0; (game.progress.dialogue || game.progress.sodaChoicePending) && i < 40; i++) {
    game = game.progress.sodaChoicePending ? dispatch(game, { type: 'choose-soda', id: 'fridge' }).game : step(game, 'advance');
  }
  assert.equal(game.progress.dialogue, null);
  return game;
}
function opening() {
  let game = step(finishDialogue(newGame()), 'dismiss-profiles');
  game = finishDialogue(step(game, 'phone'));
  return step(game, 'flashlight');
}

test('opening gates must be met and clues only enter the notebook once', () => {
  let game = newGame();
  assert.equal(step(game, 'phone'), game);
  game = opening();
  assert.equal(game.progress.scene, 'landing');
  visitWithoutAdvancing(game, 'stairs', 'arthur');
  game = step(game, 'glass');
  assert.equal(step(game, 'glass'), game);
  const discovery = step(game, 'stairs');
  assert.equal(discovery.progress.dialogue.id, 'discovery');
  assert.equal(discovery.progress.profilesPending, undefined);
  game = finishDialogue(discovery);
  assert.equal(game.progress.profilesPending, 'arthur-profile');
  assert.equal(step(game, 'body'), game);
  game = parseSave(JSON.stringify(game));
  assert.equal(game.progress.profilesPending, 'arthur-profile');
  game = step(game, 'dismiss-profiles');
  assert.equal(game.progress.profilesPending, undefined);
  assert.equal(game.history.at(-1).label, '查看亚瑟的人物档案');
  assert.equal(step(game, 'dismiss-profiles'), game);
  assert.equal(step(step(game, 'back'), 'forward').progress.profilesPending, undefined);
  const earlyHand = dispatch(game, { type: 'hand' });
  assert.equal(earlyHand.effect.panel, 'hand');
  assert.equal(earlyHand.game.progress.dialogue, null);
  assert.ok(earlyHand.game.progress.clues.includes('hand'));
  assert.deepEqual(dispatch(earlyHand.game, { type: 'hand' }), { game: earlyHand.game, effect: { panel: 'hand' } });
  visitWithoutAdvancing(game, 'tony', 'tony');
  game = finishDialogue(step(game, 'body'));
  game = finishDialogue(step(game, 'hand'));
  assert.deepEqual(game.progress.clues, ['glass', 'hand']);
  assert.equal(step(game, 'hand'), game);
  assert.equal(step(game, 'tony').progress.scene, 'tony');
});

test('Arthur’s phone is an optional pocket clue available after the body examination', () => {
  const landing = step(opening(), 'glass');
  assert.equal(step(landing, 'arthur-phone'), landing);

  const body = step(finishDialogue(step(landing, 'stairs')), 'dismiss-profiles');
  assert.equal(step(body, 'arthur-phone'), body);

  const examined = finishDialogue(step(body, 'body'));
  const found = dispatch(examined, { type: 'arthur-phone' });
  assert.equal(found.effect.panel, 'arthur-phone');
  assert.deepEqual(found.game.progress.clues, ['glass', 'arthur-phone']);
  assert.equal(dispatch(found.game, { type: 'arthur-phone' }).game, found.game);
  assert.deepEqual(step(found.game, 'back').progress.clues, ['glass']);
  assert.deepEqual(parseSave(JSON.stringify(found.game)).progress.clues, found.game.progress.clues);

  const tony = step(finishDialogue(step(finishDialogue(step(examined, 'hand')), 'tony')), 'dismiss-profiles');
  const revisit = dispatch(tony, { type: 'visit', scene: 'arthur' }).game;
  assert.equal(dispatch(revisit, { type: 'arthur-phone' }).effect.panel, 'arthur-phone');
});

test('the investigation reaches police arrival with each clue and the device shutdown recorded once', () => {
  let game = step(finishDialogue(step(step(opening(), 'glass'), 'stairs')), 'dismiss-profiles');
  game = finishDialogue(step(game, 'body'));
  game = finishDialogue(step(game, 'hand'));

  game.progress.finished = true;
  game = parseSave(JSON.stringify(game));
  assert.equal(game.progress.finished, false);
  game = finishDialogue(step(game, 'tony'));
  assert.equal(game.progress.profilesPending, 'tony-profile');
  assert.equal(step(game, 'wake-tony'), game);
  const oldSave = structuredClone(game);
  delete oldSave.progress.profilesPending;
  assert.equal(parseSave(JSON.stringify(oldSave)).progress.profilesPending, 'tony-profile');
  game = step(game, 'dismiss-profiles');
  assert.equal(game.history.at(-1).label, '查看托尼的人物档案');
  assert.equal(parseSave(JSON.stringify(game)).progress.profilesPending, undefined);
  assert.equal(step(game, 'milk'), game);
  assert.deepEqual(visitDestinations(game.progress), ['landing', 'arthur', 'yard']);
  const upstairs = dispatch(game, { type: 'visit', scene: 'landing' }).game;
  assert.equal(upstairs.progress.visiting, 'landing');
  const arthur = dispatch(upstairs, { type: 'visit', scene: 'arthur' }).game;
  assert.deepEqual(dispatch(arthur, { type: 'hand' }), { game: arthur, effect: { panel: 'hand' } });
  const reexamination = step(arthur, 'body');
  assert.equal(reexamination.progress.dialogue.id, 'examination');
  assert.deepEqual(finishDialogue(reexamination).progress, arthur.progress);
  assert.deepEqual(dispatch(arthur, { type: 'visit', scene: 'tony' }).game.progress, game.progress);
  const scouting = visitWithoutAdvancing(game, 'backdoor', 'yard');
  const restoredVisit = parseSave(JSON.stringify(scouting));
  assert.deepEqual(visitDestinations(restoredVisit.progress), ['tony']);
  assert.equal(step(restoredVisit, 'lili-testimony'), restoredVisit);
  const drinkInspection = dispatch(restoredVisit, { type: 'drink' });
  assert.equal(drinkInspection.game, restoredVisit);
  assert.deepEqual(drinkInspection.effect, { notice: '喝了一半的饮料，没什么特别' });
  assert.equal(dispatch(restoredVisit, { type: 'visit', scene: 'cornfield' }).game, restoredVisit);
  const returnedToTony = dispatch(restoredVisit, { type: 'visit', scene: 'tony' }).game;
  assert.deepEqual(returnedToTony.progress, game.progress);
  game = returnedToTony;
  game = step(step(game, 'wake-tony'), 'forward');
  assert.deepEqual(game.progress.dialogue, { id: 'wake-tony', line: 1 });
  game = step(parseSave(JSON.stringify(game)), 'forward');
  assert.equal(game.progress.dialogue, null);
  assert.equal(game.progress.tonyAwake, true);
  assert.deepEqual(visitDestinations(game.progress), ['landing', 'arthur', 'yard']);
  const awakeScouting = visitWithoutAdvancing(game, 'backdoor', 'yard');
  assert.deepEqual(visitDestinations(awakeScouting.progress), ['tony']);
  assert.equal(step(awakeScouting, 'drink'), awakeScouting);
  game = dispatch(awakeScouting, { type: 'visit', scene: 'tony' }).game;
  assert.equal(step(game, 'forward'), game);
  game = step(game, 'milk');
  game = step(game, 'advance');
  assert.equal(game.progress.dialogue.line, 1);
  game = step(game, 'advance');
  assert.equal(game.progress.scene, 'tony-memory');
  assert.equal(game.progress.clues.includes('tony-pillow'), false);
  assert.equal(step(game, 'advance'), game);
  assert.equal(step(game, 'backdoor'), game);
  game = parseSave(JSON.stringify(game));
  game = step(game, 'tony-pillow');
  assert.equal(game.progress.dialogue.id, 'pillow-observation');
  assert.equal(game.progress.clues.at(-1), 'tony-pillow');
  game = step(parseSave(JSON.stringify(game)), 'advance');
  assert.equal(game.progress.scene, 'tony');
  assert.equal(game.progress.dialogue.id, 'milk');
  assert.equal(game.progress.dialogue.line, 4);
  while (game.progress.dialogue.line < dialogues.milk.length - 1) game = step(game, 'advance');
  const milk = dispatch(game, { type: 'advance' });
  assert.deepEqual(milk.effect, { notice: '已记录：托尼的牛奶', panel: 'milk' });
  game = milk.game;
  assert.deepEqual(dispatch(game, { type: 'milk' }), { game, effect: { panel: 'milk' } });

  game = finishDialogue(step(game, 'backdoor'));
  assert.equal(game.progress.scene, 'lili');
  game = finishDialogue(step(game, 'lili-testimony'));
  assert.equal(game.progress.scene, 'yard');
  assert.equal(step(game, 'cornfield'), game);
  assert.equal(step(game, 'tony-car'), game);
  const yardReport = step(step(step(game, 'drink'), 'advance'), 'advance');
  assert.equal(yardReport.progress.dialogue.id, 'yard-report');
  assert.equal(step(yardReport, 'tony-car'), yardReport);
  game = finishDialogue(yardReport);
  assert.equal(step(game, 'drink'), game);
  assert.equal(step(game, 'cornfield'), game);
  assert.equal(step(game, 'tony-tire-tracks'), game);
  const car = step(game, 'tony-car');
  assert.equal(car.progress.scene, 'tony-car');
  assert.equal(scenes[car.progress.scene].hotspots[0].id, 'tony-tire-tracks');
  const tracks = step(car, 'tony-tire-tracks');
  assert.equal(tracks.progress.scene, 'tony-tire-tracks');
  assert.deepEqual(parseSave(JSON.stringify(tracks)), tracks);
  assert.equal(step(tracks, 'tony-car').progress.scene, 'tony-car');
  assert.deepEqual(step(car, 'return-yard').progress, game.progress);
  game = step(tracks, 'return-yard');
  assert.equal(game.progress.scene, 'yard');
  assert.equal(game.progress.dialogue, null);
  const savedBeforeCarGate = structuredClone(game);
  for (const progress of [savedBeforeCarGate.progress, ...savedBeforeCarGate.past]) {
    delete progress.sawTireTracks;
  }
  assert.deepEqual(parseSave(JSON.stringify(savedBeforeCarGate)), game);
  assert.deepEqual(step(tracks, 'back').progress, car.progress);
  const enterBedroom = (current, scene) => dispatch(current, { type: 'enter-bedroom', scene }).game;
  game = step(game, 'search-rooms');
  assert.equal(game.progress.scene, 'bedroom-hall');
  game = enterBedroom(game, 'band-bedroom');
  game = step(game, 'search-bedroom');
  assert.equal(step(game, 'search-bedroom'), game);
  game = step(step(game, 'return-bedroom-hall'), 'return-yard');
  assert.equal(game.progress.dialogue, null);
  assert.equal(step(game, 'cornfield'), game);
  game = enterBedroom(step(game, 'search-rooms'), 'miko-lili-bedroom');
  assert.deepEqual(dispatch(game, { type: 'miko-purse' }), { game, effect: { panel: 'miko-purse' } });
  assert.ok(purseHotspots.some(({ id }) => id === 'miko-diagnosis-prescription'));
  const checkedRoom = step(game, 'search-bedroom');
  assert.equal(step(step(checkedRoom, 'return-bedroom-hall'), 'return-yard').progress.dialogue, null);
  for (const { id: type } of purseHotspots) {
    const record = dispatch(game, { type });
    assert.equal(record.effect.panel, type);
    assert.equal(record.game.progress.clues.at(-1), type);
    assert.deepEqual(dispatch(record.game, { type }), { game: record.game, effect: { panel: type } });
    game = record.game;
  }
  assert.equal(step(step(game, 'return-bedroom-hall'), 'return-yard').progress.dialogue, null);
  game = step(game, 'search-bedroom');
  assert.deepEqual(parseSave(JSON.stringify(game)), game);
  game = step(game, 'return-bedroom-hall');
  const roomsFirst = structuredClone(game);
  delete roomsFirst.progress.sawTireTracks;
  for (const { id } of purseHotspots) {
    const missingClue = structuredClone(game);
    missingClue.progress.clues = game.progress.clues.filter(clue => clue !== id);
    assert.equal(step(missingClue, 'return-yard').progress.dialogue, null);
  }
  const yardBeforeCar = step(roomsFirst, 'return-yard');
  assert.equal(yardBeforeCar.progress.dialogue, null);
  const windowOnly = step(yardBeforeCar, 'tony-car');
  assert.equal(step(windowOnly, 'return-yard').progress.dialogue, null);
  const tireTracksLast = step(windowOnly, 'tony-tire-tracks');
  assert.equal(tireTracksLast.progress.dialogue, null);
  for (const path of [tireTracksLast, step(tireTracksLast, 'tony-car')]) {
    assert.deepEqual(step(path, 'return-yard').progress.dialogue, { id: 'danzai-return', line: 0 });
  }
  const danzaiReturn = step(game, 'return-yard');
  assert.equal(danzaiReturn.progress.scene, 'yard');
  assert.deepEqual(danzaiReturn.progress.dialogue, { id: 'danzai-return', line: 0 });
  assert.equal(step(danzaiReturn, 'cornfield'), danzaiReturn);
  game = finishDialogue(danzaiReturn);
  assert.equal(step(game, 'search-rooms'), game);

  const oldReport = structuredClone(danzaiReturn);
  oldReport.version = 2;
  oldReport.progress.dialogue = { id: 'yard-report', line: 4 };
  const restoredReport = parseSave(JSON.stringify(oldReport));
  assert.deepEqual(restoredReport.progress.dialogue, { id: 'danzai-return', line: 1 });
  assert.equal(step(finishDialogue(restoredReport), 'cornfield').progress.scene, 'cornfield');
  const cornfieldClues = ['miko-knife', 'miko-wrist', 'miko-breathing', 'miko-missing-shoe'];
  for (const id of cornfieldClues) assert.equal(step(game, id), game);
  game = finishDialogue(step(game, 'cornfield'));
  assert.equal(step(game, 'search-jammer').progress.scene, 'yard');
  for (const id of cornfieldClues) {
    const inspection = dispatch(game, { type: id });
    assert.deepEqual(inspection.effect, { panel: id });
    game = inspection.game;
    assert.equal(game.progress.clues.at(-1), id);
    assert.deepEqual(dispatch(game, { type: id }), { game, effect: { panel: id } });
  }
  game = step(game, 'search-jammer');
  assert.equal(game.progress.searchingJammer, true);
  game = dispatch(game, { type: 'visit', scene: 'fireplace' }).game;
  assert.equal(step(game, 'disable-jammer'), game);
  assert.equal(step(game, 'danzai-statement'), game);
  game = finishDialogue(step(game, 'jammer'));

  game = parseSave(JSON.stringify(game));
  assert.equal(game.progress.jammer, 'found');
  game = step(game, 'disable-jammer');
  assert.equal(game.progress.jammer, 'off');
  assert.deepEqual(parseSave(JSON.stringify(game)), game);
  game = step(game, 'advance');
  assert.deepEqual(game.progress.dialogue, { id: 'call-police', line: 1 });
  assert.equal(step(game, 'danzai-statement'), game);
  game = finishDialogue(parseSave(JSON.stringify(game)));
  assert.equal(game.progress.policeCalled, true);
  assert.equal(step(game, 'disable-jammer'), game);
  assert.equal(game.history.filter(row => row.label === '关闭屏蔽器，手机恢复信号').length, 1);

  game = dispatch(game, { type: 'visit', scene: 'yard' }).game;
  game = finishDialogue(step(game, 'danzai-statement'));
  assert.equal(game.progress.searchingJammer, undefined);
  game = finishDialogue(step(game, 'danzai-testimony'));
  assert.equal(game.progress.scene, 'police');
  assert.deepEqual(game.progress.clues, [
    'glass', 'hand', 'tony-pillow', 'milk', 'lili-testimony', 'drink',
    ...purseHotspots.map(({ id }) => id), ...cornfieldClues, 'danzai-testimony',
  ]);
  assert.equal(game.history.filter(row => row.label.startsWith('已记录 · ')).length, game.progress.clues.length);
  assert.equal(step(game, 'danzai-testimony'), game);

  assert.equal(step(game, 'ask-tony-photo'), game);
  game = finishDialogue(step(game, 'inspect-clip'));
  game = finishDialogue(step(parseSave(JSON.stringify(game)), 'ask-tony-photo'));
  assert.equal(game.progress.scene, 'group-photo');
  assert.equal(step(game, 'hospital'), game);
  assert.equal(step(game, 'open-old-photo'), game);
  game = finishDialogue(step(game, 'compare-clip'));
  assert.equal(game.progress.clues.at(-1), 'tie-clip');
  assert.equal(step(game, 'compare-clip'), game);
  const skippedPhoto = finishDialogue(step(game, 'hospital'));
  assert.equal(skippedPhoto.progress.scene, 'willy-crash');
  assert.ok(skippedPhoto.progress.clues.includes('willy-crash'));
  assert.ok(skippedPhoto.progress.clues.includes('willy-phone'));
  assert.deepEqual(parseSave(JSON.stringify(skippedPhoto)), skippedPhoto);
  const skippedHospital = finishDialogue(step(skippedPhoto, 'hospital'));
  assert.equal(skippedHospital.progress.scene, 'hospital');
  assertEndingFromHospital(skippedHospital);
  assert.equal(skippedPhoto.progress.clues.includes('old-photo'), false);
  game = step(game, 'open-old-photo');
  assert.equal(game.progress.scene, 'old-photo');
  game = step(game, 'record-old-photo');
  assert.equal(step(game, 'record-old-photo'), game);
  assert.equal(game.progress.clues.at(-1), 'old-photo');
  game = step(game, 'hospital');
  assert.equal(game.progress.scene, 'willy-crash');
  assert.equal(game.progress.clues.includes('willy-phone'), false);
  game = finishDialogue(game);
  const hospital = finishDialogue(step(game, 'hospital'));
  assert.equal(hospital.progress.scene, 'hospital');
  assertEndingFromHospital(hospital);
});

test('refresh resumes the exact line and rewind keeps history without future clues', () => {
  let game = step(newGame(), 'advance');
  assert.deepEqual(parseSave(JSON.stringify(game)), game);
  assert.equal(parseSave('{'), null);
  game = finishDialogue(step(opening(), 'glass'));
  game = step(finishDialogue(step(game, 'stairs')), 'dismiss-profiles');
  game = finishDialogue(step(game, 'body'));
  game = finishDialogue(step(game, 'hand'));
  const previousHistory = structuredClone(game.history);
  const index = game.history.findIndex(row => row.checkpoint?.dialogue.id === 'opening');
  const restored = dispatch(game, { type: 'rewind', index }).game;
  assert.equal(restored.progress.dialogue.id, 'opening');
  assert.deepEqual(restored.progress.clues, []);
  assert.deepEqual(restored.history.slice(0, previousHistory.length), previousHistory);
  assert.deepEqual(parseSave(JSON.stringify(restored)), restored);
});

test('investigation artwork resolves on disk', async () => {
  const clueImages = Object.values(clues).map(clue => clue.image).filter(Boolean);
  const dialogueImages = Object.values(dialogues).flat().map(([, , artwork]) => artwork?.image).filter(Boolean);
  const filenames = [...Object.values(scenes).map(scene => scene.image), scenes.tony.emptyImage, scenes.fireplace.closeup.image, scenes.wake.backstageImage, ...clueImages,
    ...Object.values(portrait), ...Object.values(purseImages), ...dialogueImages];
  await Promise.all(filenames.map(name => access(new URL('../assets/' + name, import.meta.url))));
});

test('back and forward restore story steps and clue state without duplicating the archive', () => {
  const initial = newGame();
  assert.equal(step(initial, 'back'), initial);
  const lineTwo = step(initial, 'forward');
  assert.equal(lineTwo.progress.dialogue.line, 1);
  const lineOne = step(lineTwo, 'back');
  assert.deepEqual(lineOne.progress, initial.progress);
  assert.deepEqual(step(lineOne, 'forward').history, lineTwo.history);

  const landing = opening();
  assert.equal(step(landing, 'forward'), landing);
  const glass = step(landing, 'glass');
  const beforeGlass = step(glass, 'back');
  assert.deepEqual(beforeGlass.progress.clues, []);
  const restored = step(parseSave(JSON.stringify(beforeGlass)), 'forward');
  assert.deepEqual(restored.progress.clues, ['glass']);
  assert.deepEqual(restored.history, glass.history);
  assert.deepEqual(step(beforeGlass, 'glass').future, []);
});


test('the opening moves from the memory back to the present before opening the cast page', () => {
  let game = newGame();
  for (const _ of dialogues.opening) game = step(game, 'advance');
  assert.deepEqual(game.progress.dialogue, { id: 'opening-backstage', line: 0 });
  for (const _ of dialogues['opening-backstage']) game = step(game, 'advance');
  assert.deepEqual(game.progress.dialogue, { id: 'party-soda', line: 0 });
  for (const _ of dialogues['party-soda']) game = step(game, 'advance');
  assert.equal(game.progress.sodaChoicePending, true);
  game = dispatch(game, { type: 'choose-soda', id: 'fridge' }).game;
  for (const _ of dialogues['party-soda-fridge']) game = step(game, 'advance');
  assert.deepEqual(game.progress.dialogue, { id: 'opening-memory', line: 0 });
  assert.equal(step(game, 'phone'), game);
  game = step(game, 'advance');
  assert.deepEqual(parseSave(JSON.stringify(game)).progress.dialogue, { id: 'opening-memory', line: 1 });
  for (const _ of dialogues['opening-memory'].slice(1)) game = step(game, 'advance');
  assert.deepEqual(game.progress.dialogue, { id: 'opening-return', line: 0 });
  assert.equal(step(game, 'back').progress.dialogue.id, 'opening-memory');
  game = finishDialogue(game);
  assert.equal(game.progress.profilesPending, true);
  assert.equal(step(game, 'phone'), game);
  assert.equal(parseSave(JSON.stringify(game)).progress.profilesPending, true);
  const ready = step(game, 'dismiss-profiles');
  assert.equal(step(ready, 'phone').progress.dialogue.id, 'phone');
  assert.deepEqual(profiles.map(([name]) => name), ['洛克', '托尼', '小莉', '亚瑟', '蛋仔', '小柔', '威利', '凯特医生']);
  assert.ok(profiles.every(([name]) => Object.hasOwn(portrait, name)));
});

test('hospital visit completes through companionship and keeps the text message optional', () => {
  let game = newGame();
  game.progress = { ...game.progress, scene: 'hospital', dialogue: { id: 'hospital-arrival', line: 0 } };
  assert.equal(step(game, 'hospital-followup'), game);
  assert.equal(step(game, 'miko-text'), game);
  game = finishDialogue(game);
  assert.equal(game.progress.clues.includes('miko-testimony'), false);
  game = step(game, 'hospital-followup');
  game = step(game, 'advance');
  game = parseSave(JSON.stringify(game));
  assert.equal(game.progress.dialogue.id, 'hospital-followup');
  assert.equal(step(game, 'miko-text'), game);
  game = finishDialogue(game);
  assert.equal(game.progress.hospitalFollowupDone, true);
  assert.deepEqual(game.progress.clues, ['miko-testimony']);
  assert.equal(step(game, 'hospital-followup'), game);
  const visitHistory = game.history.map(row => row.label).join('\n');
  assert.ok(visitHistory.includes('洛克留在床边，没有再问。'));
  assert.ok(!visitHistory.includes('电话是怎么断的'));
  game = finishDialogue(step(game, 'miko-text'));
  assert.deepEqual(game.progress.clues, ['miko-testimony', 'miko-text']);
  assert.equal(game.history.some(row => row.checkpoint?.dialogue.id === 'miko-memory'), false);
  game = finishDialogue(step(game, 'miko-text'));
  assert.equal(game.progress.clues.filter(id => id === 'miko-testimony').length, 1);
  assert.equal(game.progress.clues.filter(id => id === 'miko-text').length, 1);
});


function assertEndingFromHospital(game) {
  game = finishDialogue(step(game, 'hospital-followup'));
  game = finishDialogue(step(game, 'continue-investigation'));
  assert.equal(game.progress.scene, 'review');
  assert.equal(step(game, 'solve'), game);
  for (const group of Object.keys(reviewGroups)) {
    game = dispatch(game, { type: 'review-group', group }).game;
    game = finishDialogue(parseSave(JSON.stringify(game)));
    assert.equal(dispatch(game, { type: 'review-group', group }).game, game);
  }
  assert.equal(dispatch(game, { type: 'solve', suspect: '威利' }).game, game);
  game = dispatch(game, { type: 'solve', suspect: '蛋仔' }).game;
  const order = [];
  let sawFinalSilence = false;
  for (let n = 0; n < 180 && !game.progress.finished; n++) {
    assert.ok(game.progress.dialogue, 'the main story must never stall after accusation');
    const { id, line } = game.progress.dialogue;
    if (order.at(-1) !== id) {
      order.push(id);
      game = parseSave(JSON.stringify(game));
      assert.ok(game);
    }
    if (id === 'sunset') {
      assert.equal(game.progress.finished, false);
      const words = lineFor(game.progress)[1];
      if (!game.progress.clues.includes('old-photo')) assert.equal(words.includes('合照里我们都穿'), false);
    }
    if (id === 'kat-miko-private' && line === dialogues[id].length - 1) {
      assert.equal(lineFor(game.progress)[1], '。。。');
      assert.equal(game.progress.finished, false);
      sawFinalSilence = true;
    }
    game = step(game, 'advance');
  }
  assert.equal(game.progress.finished, true);
  assert.equal(sawFinalSilence, true);
  assert.deepEqual(order, ['solve-success', 'rehearsal-arrival', 'confrontation', 'final-reconstruction', 'arrest', 'sunset', 'kat-miko-private']);
  const restored = parseSave(JSON.stringify(game));
  assert.equal(restored.progress.finished, true);
  const previous = step(restored, 'back');
  assert.equal(previous.progress.finished, false);
  assert.equal(previous.progress.dialogue.id, 'kat-miko-private');
  assert.equal(step(previous, 'forward').progress.finished, true);
}

test('all report orders unlock accusation without optional clues', () => {
  const permutations = values => values.length ? values.flatMap((value, i) => permutations(values.filter((_, j) => j !== i)).map(rest => [value, ...rest])) : [[]];
  for (const order of permutations(Object.keys(reviewGroups))) {
    let game = newGame();
    game.progress = { ...game.progress, scene: 'review', dialogue: null, clues: ['tony-pillow', 'miko-testimony', 'tie-clip', 'danzai-testimony'] };
    for (const group of order) game = finishDialogue(dispatch(game, { type: 'review-group', group }).game);
    const result = dispatch(game, { type: 'solve', suspect: '蛋仔' }).game;
    assert.equal(result.progress.dialogue.id, 'solve-success');
    assert.equal(result.progress.clues.includes('old-photo'), false);
    assert.equal(result.progress.clues.includes('arthur-phone'), false);
  }
});

test('flashbacks reserve pending images and Danzai changes clothes after the murder', async () => {
  assert.equal(Object.keys(pendingArtwork).length, 3);
  for (const shot of Object.values(pendingArtwork)) {
    assert.ok(['pending', 'generated'].includes(shot.status));
    if (shot.status === 'pending') assert.notEqual(shot.image, shot.target);
    else assert.equal(shot.image, shot.target);
    await access(new URL('../assets/' + shot.image, import.meta.url));
  }
  assert.equal(portraitFor('蛋仔', 'opening-backstage'), '蛋仔.png');
  assert.equal(portraitFor('蛋仔', 'final-reconstruction'), '蛋仔.png');
  for (const id of ['danzai-return', 'danzai-testimony', 'confrontation', 'arrest']) {
    assert.equal(portraitFor('蛋仔', id), '蛋仔-便装.png');
  }
  assert.ok(dialogues.milk.some(row => row[2]?.target === pendingArtwork['tony-before-sleep'].target && row[2].memory));
  assert.ok(dialogues['hospital-followup'].some(row => row[2]?.target === pendingArtwork['arthur-fall'].target && row[2].memory));
  assert.ok(dialogues['final-reconstruction'].some(row => row[2]?.pendingAsset === 'danzai-pillow-murder'));
});


test('old saves can revisit the pillow memory and accusation requires the pillow clue', () => {
  let game = newGame();
  game.progress = { ...game.progress, scene: 'review', dialogue: null,
    clues: ['milk', 'miko-testimony', 'tie-clip', 'danzai-testimony', 'autopsy', 'drink-analysis', 'vehicle', 'extortion', 'feather'],
    reviewedGroups: Object.keys(reviewGroups) };
  assert.equal(dispatch(game, { type: 'solve', suspect: '蛋仔' }).game, game);
  game = step(game, 'recall-pillow');
  assert.equal(game.progress.scene, 'tony-memory');
  assert.equal(step(game, 'forward'), game);
  const before = structuredClone(game.progress);
  game = step(game, 'tony-pillow');
  assert.equal(lineFor(game.progress)[1], '托尼记得当时床上还有一个枕头,现在不知道去哪里了。算了不重要。');
  assert.deepEqual(step(game, 'back').progress, before);
  game = step(game, 'advance');
  assert.equal(game.progress.scene, 'review');
  assert.equal(game.progress.dialogue, null);
  game = finishDialogue(step(step(game, 'recall-pillow'), 'tony-pillow'));
  assert.equal(game.progress.clues.filter(id => id === 'tony-pillow').length, 1);
  assert.equal(dispatch(game, { type: 'solve', suspect: '蛋仔' }).game.progress.dialogue.id, 'solve-success');
});
