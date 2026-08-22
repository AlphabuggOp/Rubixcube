import { FACE_ORDER } from './constants.js';
import { Cube, faceletsToFaces } from './engine.js';

export function countColors(facelets) {
  const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
  for (const ch of facelets) {
    if (counts[ch] !== undefined) counts[ch] += 1;
  }
  return counts;
}

export function centersValid(facelets) {
  const faces = faceletsToFaces(facelets);
  return FACE_ORDER.every((f) => faces[f][4] === f);
}

export function describeInvalid(facelets) {
  if (!facelets || facelets.length !== 54) {
    return 'A cube needs 54 stickers — 9 on each face.';
  }
  if (![...facelets].every((ch) => FACE_ORDER.includes(ch))) {
    return 'Every sticker has to be one of the six face colors.';
  }
  const counts = countColors(facelets);
  const bad = FACE_ORDER.filter((f) => counts[f] !== 9);
  if (bad.length) {
    const parts = FACE_ORDER.map((f) => `${counts[f]} ${f}`).join(', ');
    return `Each color must appear 9 times. Current mix: ${parts}.`;
  }
  if (!centersValid(facelets)) {
    return 'Centers define the cube. Paint each face with its own center color in the middle.';
  }
  return null;
}

const EDGES = [
  ['U', 'R'], ['U', 'F'], ['U', 'L'], ['U', 'B'],
  ['D', 'R'], ['D', 'F'], ['D', 'L'], ['D', 'B'],
  ['F', 'R'], ['F', 'L'], ['B', 'L'], ['B', 'R'],
];
const CORNERS = [
  ['U', 'R', 'F'], ['U', 'F', 'L'], ['U', 'L', 'B'], ['U', 'B', 'R'],
  ['D', 'F', 'R'], ['D', 'L', 'F'], ['D', 'B', 'L'], ['D', 'R', 'B'],
];

export function isReachableFaceletString(facelets) {
  const basic = describeInvalid(facelets);
  if (basic) return { ok: false, reason: basic };
  try {
    const cube = new Cube(facelets);
    const rebuilt = cube.facelets();
    if (rebuilt !== facelets) {
      return { ok: false, reason: 'Those stickers do not sit on legal cubies.' };
    }
    for (const [a, b] of EDGES) {
      if (!cube.edge(a, b)) {
        return { ok: false, reason: 'An edge piece is duplicated or missing — check the colors you painted.' };
      }
    }
    for (const [a, b, c] of CORNERS) {
      if (!cube.corner(a, b, c)) {
        return { ok: false, reason: 'A corner piece is duplicated or missing — check the colors you painted.' };
      }
    }
  } catch {
    return { ok: false, reason: 'That color arrangement cannot form real cubies.' };
  }
  return { ok: true, reason: null };
}

export function checkWithCubejs(facelets, Cubejs) {
  const basic = isReachableFaceletString(facelets);
  if (!basic.ok) return basic;
  try {
    const cube = Cubejs.fromString(facelets);
    if (cube.asString() !== facelets) {
      return {
        ok: false,
        reason: 'This state is not reachable on a real cube — an edge is flipped, a corner is twisted, or the permutation is odd.',
      };
    }
    return { ok: true, reason: null };
  } catch {
    return { ok: false, reason: 'The solver could not read that cube state.' };
  }
}
