import { scenes } from '../src/content.mjs';
import { requiresMagnifier } from '../src/magnifier.mjs';

// Integration walks inspect the actual scene target using the lens. Bypass tests use raw dispatch.
export function lensAction(game, action) {
  if (!requiresMagnifier(action.type)) return action;
  const scene = game.progress.visiting ?? game.progress.scene;
  const target = scenes[scene]?.hotspots.find(item => item.id === action.type);
  if (!target) return action;
  const [x, y, width, height] = target.rect;
  return { inspection: { tool: 'magnifier', scene, point: [x + width / 2, y + height / 2] }, ...action };
}
