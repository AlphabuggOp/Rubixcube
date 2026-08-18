import { FACE_ORDER } from './constants.js';

export function blankPainted() {
  const painted = {};
  for (const face of FACE_ORDER) painted[face] = null;
  return painted;
}

export function emptyFace(face) {
  return Array.from({ length: 9 }, (_, i) => (i === 4 ? face : '?'));
}

export function composePreview(painted) {
  return FACE_ORDER.map((face) => {
    if (painted[face] && painted[face].length === 9) return painted[face];
    return emptyFace(face).join('');
  }).join('');
}

export function paintedCount(painted) {
  return FACE_ORDER.filter((face) => Boolean(painted[face])).length;
}

export function allFacesPainted(painted) {
  return FACE_ORDER.every((face) => Boolean(painted[face]));
}

export function setCell(faceStr, index, color) {
  const cells = faceStr.split('');
  if (index === 4) return faceStr;
  cells[index] = color;
  return cells.join('');
}

export function faceComplete(faceStr) {
  return Boolean(faceStr) && ![...faceStr].includes('?');
}
