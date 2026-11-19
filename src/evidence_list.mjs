import { clues } from './content.mjs';

// Add or remove IDs here when the final evidence requirements are decided.
export const evidence_list = [
  'willy-crash',
  'willy-phone',
  'miko-pill-box',
  'miko-diagnosis-prescription',
  'miko-injury-record',
  'miko-pregnancy-test',
  'miko-knife',
  'miko-wrist',
  'miko-breathing',
  'miko-missing-shoe',
  'tie-clip',
  'old-photo',
  'glass',
  'hand',
  'arthur-phone',
  'milk',
  'lili-testimony',
  'drink',
  'danzai-testimony',
  'miko-testimony',
];

// Derive status from the current progress so saves and rewinds stay consistent.
export function getEvidenceList(progress) {
  return evidence_list.map(id => ({
    id,
    label: clues[id].label,
    status: progress.clues.includes(id) ? 'found' : 'missing',
  }));
}

export function canSolve(progress, suspect) {
  return suspect === '蛋仔' && getEvidenceList(progress).every(item => item.status === 'found');
}
