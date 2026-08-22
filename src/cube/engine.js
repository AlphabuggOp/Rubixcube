import { FACE_ORDER, SOLVED_FACELETS } from './constants.js';

const DIRS = {
  '+x': [1, 0, 0],
  '-x': [-1, 0, 0],
  '+y': [0, 1, 0],
  '-y': [0, -1, 0],
  '+z': [0, 0, 1],
  '-z': [0, 0, -1],
};

const DIR_KEYS = Object.keys(DIRS);

const ROT = {
  U: { pred: (c) => c.y === 1, map: ([x, y, z]) => [-z, y, x] },
  D: { pred: (c) => c.y === -1, map: ([x, y, z]) => [z, y, -x] },
  R: { pred: (c) => c.x === 1, map: ([x, y, z]) => [x, z, -y] },
  L: { pred: (c) => c.x === -1, map: ([x, y, z]) => [x, -z, y] },
  F: { pred: (c) => c.z === 1, map: ([x, y, z]) => [y, -x, z] },
  B: { pred: (c) => c.z === -1, map: ([x, y, z]) => [-y, x, z] },
  // Slices: M follows L, E follows D, S follows F
  M: { pred: (c) => c.x === 0, map: ([x, y, z]) => [x, -z, y] },
  E: { pred: (c) => c.y === 0, map: ([x, y, z]) => [z, y, -x] },
  S: { pred: (c) => c.z === 0, map: ([x, y, z]) => [y, -x, z] },
};

const FACE_DIR = {
  U: '+y',
  D: '-y',
  R: '+x',
  L: '-x',
  F: '+z',
  B: '-z',
};

export const SLOT_POS = {
  UF: { x: 0, y: 1, z: 1 },
  UR: { x: 1, y: 1, z: 0 },
  UB: { x: 0, y: 1, z: -1 },
  UL: { x: -1, y: 1, z: 0 },
  DF: { x: 0, y: -1, z: 1 },
  DR: { x: 1, y: -1, z: 0 },
  DB: { x: 0, y: -1, z: -1 },
  DL: { x: -1, y: -1, z: 0 },
  FR: { x: 1, y: 0, z: 1 },
  FL: { x: -1, y: 0, z: 1 },
  BR: { x: 1, y: 0, z: -1 },
  BL: { x: -1, y: 0, z: -1 },
  UFR: { x: 1, y: 1, z: 1 },
  UFL: { x: -1, y: 1, z: 1 },
  UBR: { x: 1, y: 1, z: -1 },
  UBL: { x: -1, y: 1, z: -1 },
  DFR: { x: 1, y: -1, z: 1 },
  DFL: { x: -1, y: -1, z: 1 },
  DBR: { x: 1, y: -1, z: -1 },
  DBL: { x: -1, y: -1, z: -1 },
};

function emptyColors() {
  return { '+x': null, '-x': null, '+y': null, '-y': null, '+z': null, '-z': null };
}

function vecToDir(v) {
  const x = Math.round(v[0]);
  const y = Math.round(v[1]);
  const z = Math.round(v[2]);
  if (x === 1) return '+x';
  if (x === -1) return '-x';
  if (y === 1) return '+y';
  if (y === -1) return '-y';
  if (z === 1) return '+z';
  if (z === -1) return '-z';
  throw new Error(`Invalid direction ${v}`);
}

function rotateOnce(cubie, map) {
  const pos = map([cubie.x, cubie.y, cubie.z]);
  const colors = emptyColors();
  for (const dir of DIR_KEYS) {
    const color = cubie.colors[dir];
    if (!color) continue;
    colors[vecToDir(map(DIRS[dir]))] = color;
  }
  return { x: pos[0], y: pos[1], z: pos[2], colors };
}

export function createSolvedCubies() {
  const cubies = [];
  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        if (x === 0 && y === 0 && z === 0) continue;
        const colors = emptyColors();
        if (x === 1) colors['+x'] = 'R';
        if (x === -1) colors['-x'] = 'L';
        if (y === 1) colors['+y'] = 'U';
        if (y === -1) colors['-y'] = 'D';
        if (z === 1) colors['+z'] = 'F';
        if (z === -1) colors['-z'] = 'B';
        cubies.push({ x, y, z, colors });
      }
    }
  }
  return cubies;
}

export function cloneCubies(cubies) {
  return cubies.map((c) => ({
    x: c.x,
    y: c.y,
    z: c.z,
    colors: { ...c.colors },
  }));
}

function applyFaceTurn(cubies, face, times) {
  const rot = ROT[face];
  const n = ((times % 4) + 4) % 4;
  if (n === 0) return cubies;
  return cubies.map((c) => {
    if (!rot.pred(c)) return c;
    let next = c;
    for (let i = 0; i < n; i += 1) next = rotateOnce(next, rot.map);
    return next;
  });
}

export function parseMove(move) {
  const face = move[0];
  if (!ROT[face]) throw new Error(`Unknown move ${move}`);
  if (move.length === 1) return { face, times: 1 };
  if (move[1] === '2') return { face, times: 2 };
  if (move[1] === "'") return { face, times: 3 };
  throw new Error(`Unknown move ${move}`);
}

export function parseAlg(alg) {
  if (!alg) return [];
  if (Array.isArray(alg)) return alg.filter(Boolean);
  return String(alg)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function invertMove(move) {
  const { face, times } = parseMove(move);
  if (times === 1) return `${face}'`;
  if (times === 2) return `${face}2`;
  return face;
}

export function invertAlg(alg) {
  return parseAlg(alg).reverse().map(invertMove);
}

export function movePower(move) {
  return parseMove(move).times % 4;
}

export function formatMove(face, times) {
  const t = ((times % 4) + 4) % 4;
  if (t === 0) return null;
  if (t === 1) return face;
  if (t === 2) return `${face}2`;
  return `${face}'`;
}

export function compactMoves(moves) {
  const out = [];
  for (const move of parseAlg(moves)) {
    if (!out.length) {
      out.push(move);
      continue;
    }
    const prev = out[out.length - 1];
    const a = parseMove(prev);
    const b = parseMove(move);
    if (a.face === b.face) {
      out.pop();
      const merged = formatMove(a.face, a.times + b.times);
      if (merged) out.push(merged);
    } else {
      out.push(move);
    }
  }
  return out;
}

export function cubiesToFacelets(cubies) {
  const faces = {
    U: Array(9).fill(null),
    R: Array(9).fill(null),
    F: Array(9).fill(null),
    D: Array(9).fill(null),
    L: Array(9).fill(null),
    B: Array(9).fill(null),
  };

  for (const c of cubies) {
    if (c.y === 1) faces.U[(c.z + 1) * 3 + (c.x + 1)] = c.colors['+y'];
    if (c.y === -1) faces.D[(1 - c.z) * 3 + (c.x + 1)] = c.colors['-y'];
    if (c.x === 1) faces.R[(1 - c.y) * 3 + (1 - c.z)] = c.colors['+x'];
    if (c.x === -1) faces.L[(1 - c.y) * 3 + (c.z + 1)] = c.colors['-x'];
    if (c.z === 1) faces.F[(1 - c.y) * 3 + (c.x + 1)] = c.colors['+z'];
    if (c.z === -1) faces.B[(1 - c.y) * 3 + (1 - c.x)] = c.colors['-z'];
  }

  return FACE_ORDER.map((f) => faces[f].join('')).join('');
}

export function faceletsToFaces(str) {
  const faces = {};
  FACE_ORDER.forEach((f, i) => {
    faces[f] = str.slice(i * 9, i * 9 + 9).split('');
  });
  return faces;
}

export function facesToFacelets(faces) {
  return FACE_ORDER.map((f) => faces[f].join('')).join('');
}

function faceletIndex(face, x, y, z) {
  if (face === 'U') return (z + 1) * 3 + (x + 1);
  if (face === 'D') return (1 - z) * 3 + (x + 1);
  if (face === 'R') return (1 - y) * 3 + (1 - z);
  if (face === 'L') return (1 - y) * 3 + (z + 1);
  if (face === 'F') return (1 - y) * 3 + (x + 1);
  if (face === 'B') return (1 - y) * 3 + (1 - x);
  return -1;
}

export function faceletsToCubies(str) {
  const faces = faceletsToFaces(str);
  const cubies = [];
  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        if (x === 0 && y === 0 && z === 0) continue;
        const colors = emptyColors();
        if (x === 1) colors['+x'] = faces.R[faceletIndex('R', x, y, z)];
        if (x === -1) colors['-x'] = faces.L[faceletIndex('L', x, y, z)];
        if (y === 1) colors['+y'] = faces.U[faceletIndex('U', x, y, z)];
        if (y === -1) colors['-y'] = faces.D[faceletIndex('D', x, y, z)];
        if (z === 1) colors['+z'] = faces.F[faceletIndex('F', x, y, z)];
        if (z === -1) colors['-z'] = faces.B[faceletIndex('B', x, y, z)];
        cubies.push({ x, y, z, colors });
      }
    }
  }
  return cubies;
}

export function cubieAt(cubies, x, y, z) {
  return cubies.find((c) => c.x === x && c.y === y && c.z === z);
}

export function findEdge(cubies, c1, c2) {
  return cubies.find((c) => {
    const cols = DIR_KEYS.map((d) => c.colors[d]).filter(Boolean);
    return cols.length === 2 && cols.includes(c1) && cols.includes(c2);
  });
}

export function findCorner(cubies, c1, c2, c3) {
  const need = new Set([c1, c2, c3]);
  return cubies.find((c) => {
    const cols = DIR_KEYS.map((d) => c.colors[d]).filter(Boolean);
    return cols.length === 3 && cols.every((col) => need.has(col));
  });
}

export function colorOn(cubie, dir) {
  return cubie?.colors[dir] ?? null;
}

export function dirOfColor(cubie, color) {
  return DIR_KEYS.find((d) => cubie.colors[d] === color) ?? null;
}

export function pieceKey(cubie, focusColor) {
  const dir = focusColor ? dirOfColor(cubie, focusColor) : '';
  return `${cubie.x},${cubie.y},${cubie.z}:${dir}`;
}

export function samePos(a, b) {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

export class Cube {
  constructor(source) {
    if (!source) {
      this.cubies = createSolvedCubies();
    } else if (typeof source === 'string') {
      this.cubies = faceletsToCubies(source);
    } else if (source instanceof Cube) {
      this.cubies = cloneCubies(source.cubies);
    } else if (Array.isArray(source)) {
      this.cubies = cloneCubies(source);
    } else {
      this.cubies = createSolvedCubies();
    }
  }

  clone() {
    return new Cube(this.cubies);
  }

  apply(alg) {
    for (const move of parseAlg(alg)) {
      const { face, times } = parseMove(move);
      this.cubies = applyFaceTurn(this.cubies, face, times);
    }
    return this;
  }

  move(alg) {
    return this.apply(alg);
  }

  facelets() {
    return cubiesToFacelets(this.cubies);
  }

  faces() {
    return faceletsToFaces(this.facelets());
  }

  isSolved() {
    return this.facelets() === SOLVED_FACELETS;
  }

  at(x, y, z) {
    return cubieAt(this.cubies, x, y, z);
  }

  edge(c1, c2) {
    return findEdge(this.cubies, c1, c2);
  }

  corner(c1, c2, c3) {
    return findCorner(this.cubies, c1, c2, c3);
  }

  sticker(face, index) {
    return this.faces()[face][index];
  }

  center(face) {
    return this.sticker(face, 4);
  }
}

export function applyMoves(facelets, alg) {
  return new Cube(facelets).apply(alg).facelets();
}

export function randomScramble(length = 24) {
  const faces = ['U', 'R', 'F', 'D', 'L', 'B'];
  const suffixes = ['', "'", '2'];
  const moves = [];
  let last = null;
  let lastAxis = null;
  const axisOf = { U: 'y', D: 'y', R: 'x', L: 'x', F: 'z', B: 'z' };
  while (moves.length < length) {
    const face = faces[Math.floor(Math.random() * faces.length)];
    if (face === last) continue;
    if (lastAxis && axisOf[face] === lastAxis && faces.indexOf(face) < faces.indexOf(last)) {
      continue;
    }
    last = face;
    lastAxis = axisOf[face];
    moves.push(face + suffixes[Math.floor(Math.random() * 3)]);
  }
  return moves;
}

export function edgeSolved(cube, a, b) {
  const e = cube.edge(a, b);
  const slot = SLOT_POS[a + b] || SLOT_POS[b + a];
  if (!e || !slot) return false;
  if (!samePos(e, slot)) return false;
  const dirA = FACE_DIR[a];
  return e.colors[dirA] === a;
}

export function cornerSolved(cube, a, b, c) {
  const piece = cube.corner(a, b, c);
  const name = [a, b, c].sort().join('');
  const lookup = {
    DFR: ['D', 'F', 'R'],
    DFL: ['D', 'F', 'L'],
    DBR: ['D', 'B', 'R'],
    DBL: ['D', 'B', 'L'],
    UFR: ['U', 'F', 'R'],
    UFL: ['U', 'F', 'L'],
    UBR: ['U', 'B', 'R'],
    UBL: ['U', 'B', 'L'],
  };
  let slotName = null;
  for (const [key, cols] of Object.entries(lookup)) {
    if ([...cols].sort().join('') === name) slotName = key;
  }
  const slot = SLOT_POS[slotName];
  if (!piece || !slot) return false;
  if (!samePos(piece, slot)) return false;
  return piece.colors[FACE_DIR[a]] === a && piece.colors[FACE_DIR[b]] === b;
}

export function whiteCrossSolved(cube) {
  return (
    edgeSolved(cube, 'D', 'F') &&
    edgeSolved(cube, 'D', 'R') &&
    edgeSolved(cube, 'D', 'B') &&
    edgeSolved(cube, 'D', 'L')
  );
}

export function firstLayerSolved(cube) {
  return (
    whiteCrossSolved(cube) &&
    cornerSolved(cube, 'D', 'F', 'R') &&
    cornerSolved(cube, 'D', 'F', 'L') &&
    cornerSolved(cube, 'D', 'B', 'R') &&
    cornerSolved(cube, 'D', 'B', 'L')
  );
}

export function f2lSolved(cube) {
  return (
    firstLayerSolved(cube) &&
    edgeSolved(cube, 'F', 'R') &&
    edgeSolved(cube, 'F', 'L') &&
    edgeSolved(cube, 'B', 'R') &&
    edgeSolved(cube, 'B', 'L')
  );
}

export function yellowCrossSolved(cube) {
  const u = cube.faces().U;
  return u[1] === 'U' && u[3] === 'U' && u[5] === 'U' && u[7] === 'U';
}

export function yellowFaceSolved(cube) {
  return cube.faces().U.every((c) => c === 'U');
}

export function cornerInSlot(cube, slotName) {
  const colors = slotName.split('');
  const piece = cube.corner(...colors);
  const slot = SLOT_POS[slotName];
  return piece && slot && samePos(piece, slot);
}

export function mapCoords(x, y, z, face, times) {
  const rot = ROT[face];
  if (!rot) throw new Error(`Unknown move ${face}`);
  const n = ((times % 4) + 4) % 4;
  let p = [x, y, z];
  for (let i = 0; i < n; i += 1) p = rot.map(p);
  return { x: p[0], y: p[1], z: p[2] };
}

export { FACE_DIR, ROT };
