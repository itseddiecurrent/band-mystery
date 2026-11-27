import { scenes } from './content.mjs?v=party-fork-1';

// Actions which discover these seven clues require a scene-space lens inspection.
export const magnifierClues = Object.freeze({
  glass: 'glass', hand: 'hand', drink: 'drink',
  'miko-knife': 'miko-knife', 'miko-wrist': 'miko-wrist',
  'miko-missing-shoe': 'miko-missing-shoe', 'compare-clip': 'tie-clip',
});
export const requiresMagnifier = id => Object.hasOwn(magnifierClues, id);
export function pointInHotspot(point, rect) {
  if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) return false;
  const [x, y] = point;
  const [left, top, width, height] = rect;
  return x >= left && x <= left + width && y >= top && y <= top + height;
}
export function validLensInspection(progress, action) {
  const inspection = action.inspection;
  const location = progress.visiting ?? progress.scene;
  const target = scenes[location]?.hotspots.find(item => item.id === action.type);
  return Boolean(inspection?.tool === 'magnifier' && inspection.scene === location && target &&
    !progress.dialogue && !progress.finished && !progress.profilesPending &&
    !progress.sodaChoicePending && !progress.partyRoutePaused &&
    pointInHotspot(inspection.point, target.rect));
}
