import { PHASE_COPY } from './constants.js';
import {
  Cube,
  compactMoves,
  cornerInSlot,
  cornerSolved,
  edgeSolved,
  f2lSolved,
  firstLayerSolved,
  parseAlg,
  parseMove,
  pieceKey,
  SLOT_POS,
  whiteCrossSolved,
  yellowCrossSolved,
  yellowFaceSolved,
} from './engine.js';

const ALL_MOVES = [
  'U', "U'", 'U2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'B', "B'", 'B2',
];

const COLOR_WORD = {
  U: 'white',
  D: 'yellow',
  F: 'green',
  B: 'blue',
  R: 'red',
  L: 'orange',
};

const RIGHT_OF = { F: 'R', R: 'B', B: 'L', L: 'F' };
const LEFT_OF = { F: 'L', L: 'B', B: 'R', R: 'F' };

const INSERT = {
  F: {
    right: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'],
    left: ["U'", "L'", 'U', 'L', 'U', 'F', "U'", "F'"],
  },
  R: {
    right: ['U', 'B', "U'", "B'", "U'", "R'", 'U', 'R'],
    left: ["U'", "F'", 'U', 'F', 'U', 'R', "U'", "R'"],
  },
  B: {
    right: ['U', 'L', "U'", "L'", "U'", "B'", 'U', 'B'],
    left: ["U'", "R'", 'U', 'R', 'U', 'B', "U'", "B'"],
  },
  L: {
    right: ['U', 'F', "U'", "F'", "U'", "L'", 'U', 'L'],
    left: ["U'", "B'", 'U', 'B', 'U', 'L', "U'", "L'"],
  },
};

const EXTRACT_SLOT = {
  FR: INSERT.F.right,
  FL: INSERT.F.left,
  BR: INSERT.R.right,
  BL: INSERT.B.right,
};

const CORNER_SLOTS = [
  {
    name: 'DFR',
    colors: ['D', 'F', 'R'],
    above: SLOT_POS.UFR,
    insert: ['R', 'U', "R'", "U'"],
    extract: ['R', 'U', "R'"],
  },
  {
    name: 'DFL',
    colors: ['D', 'F', 'L'],
    above: SLOT_POS.UFL,
    insert: ["L'", "U'", 'L', 'U'],
    extract: ["L'", "U'", 'L'],
  },
  {
    name: 'DBR',
    colors: ['D', 'B', 'R'],
    above: SLOT_POS.UBR,
    insert: ["R'", "U'", 'R', 'U'],
    extract: ["R'", "U'", 'R'],
  },
  {
    name: 'DBL',
    colors: ['D', 'B', 'L'],
    above: SLOT_POS.UBL,
    insert: ['L', 'U', "L'", "U'"],
    extract: ['L', 'U', "L'"],
  },
];

const U_CORNERS = ['UFR', 'UFL', 'UBR', 'UBL'];
const SUNSET = ['F', 'R', 'U', "R'", "U'", "F'"];
const TWIST = ["R'", "D'", 'R', 'D'];

const APERM_KEEP = {
  UFL: ["R'", 'F', "R'", 'B2', 'R', "F'", "R'", 'B2', 'R2'],
  UFR: ["B'", 'R', "B'", 'L2', 'B', "R'", "B'", 'L2', 'B2'],
  UBR: ["L'", 'B', "L'", 'F2', 'L', "B'", "L'", 'F2', 'L2'],
  UBL: ["F'", 'L', "F'", 'R2', 'F', "L'", "F'", 'R2', 'F2'],
};

const TPERM_KEEP = {
  'UFL,UBL': ['R', 'U', "R'", "U'", "R'", 'F', 'R2', "U'", "R'", "U'", 'R', 'U', "R'", "F'"],
  'UFL,UFR': ['B', 'U', "B'", "U'", "B'", 'R', 'B2', "U'", "B'", "U'", 'B', 'U', "B'", "R'"],
  'UFR,UBR': ['L', 'U', "L'", "U'", "L'", 'B', 'L2', "U'", "L'", "U'", 'L', 'U', "L'", "B'"],
  'UBL,UBR': ['F', 'U', "F'", "U'", "F'", 'L', 'F2', "U'", "F'", "U'", 'F', 'U', "F'", "L'"],
};

const YPERM_KEEP = {
  'UFL,UBR': ['F', 'R', "U'", "R'", "U'", 'R', 'U', "R'", "F'", 'R', 'U', "R'", "U'", "R'", 'F', 'R', "F'"],
  'UFR,UBL': ['R', 'B', "U'", "B'", "U'", 'B', 'U', "B'", "R'", 'B', 'U', "B'", "U'", "B'", 'R', 'B', "R'"],
};

const UPERM_KEEP = {
  B: ['R', "U'", 'R', 'U', 'R', 'U', 'R', "U'", "R'", "U'", 'R2'],
  L: ['B', "U'", 'B', 'U', 'B', 'U', 'B', "U'", "B'", "U'", 'B2'],
  F: ['L', "U'", 'L', 'U', 'L', 'U', 'L', "U'", "L'", "U'", 'L2'],
  R: ['F', "U'", 'F', 'U', 'F', 'U', 'F', "U'", "F'", "U'", 'F2'],
};

const HPERM = ['R2', 'U2', 'R', 'U2', 'R2', 'U2', 'R2', 'U2', 'R', 'U2', 'R2'];
const ZPERM = ['U', "R'", "U'", 'R', "U'", 'R', 'U', 'R', "U'", "R'", 'U', 'R', 'U', 'R2', "U'", "R'", 'U'];
const ZPERM_Y = ['U', "B'", "U'", 'B', "U'", 'B', 'U', 'B', "U'", "B'", 'U', 'B', 'U', 'B2', "U'", "B'", 'U'];

function sameFace(a, b) {
  return a && b && parseMove(a).face === parseMove(b).face;
}

function bfs(start, goal, hash, maxDepth = 9, moves = ALL_MOVES) {
  if (goal(start)) return [];
  const queue = [{ cube: start, path: [] }];
  const seen = new Set([hash(start)]);
  let head = 0;
  while (head < queue.length) {
    const { cube, path } = queue[head];
    head += 1;
    if (path.length >= maxDepth) continue;
    for (const move of moves) {
      if (sameFace(path[path.length - 1], move)) continue;
      const next = cube.clone().apply(move);
      const key = hash(next);
      if (seen.has(key)) continue;
      if (goal(next)) return [...path, move];
      seen.add(key);
      queue.push({ cube: next, path: [...path, move] });
    }
  }
  return null;
}

function applyAndLog(cube, moves, log, note) {
  const list = parseAlg(moves);
  if (!list.length) return;
  cube.apply(list);
  for (const move of list) log.push({ move, note });
}

function onlyMoves(log) {
  return log.map((item) => item.move);
}

function isPetal(cube, side) {
  const e = cube.edge('D', side);
  return Boolean(e && e.y === 1 && e.colors['+y'] === 'D');
}

function daisyHash(cube, placed, target) {
  const parts = placed.map((side) => `${side}:${pieceKey(cube.edge('D', side), 'D')}`);
  parts.push(`t:${pieceKey(cube.edge('D', target), 'D')}`);
  return parts.join('|');
}

function solveDaisy(cube, log) {
  const sides = ['F', 'R', 'B', 'L'];
  const placed = [];
  for (const side of sides) {
    if (isPetal(cube, side)) {
      placed.push(side);
      continue;
    }
    const path = bfs(
      cube,
      (c) => isPetal(c, side) && placed.every((s) => isPetal(c, s)),
      (c) => daisyHash(c, placed, side),
      8,
    );
    if (!path) throw new Error(`Could not place daisy petal ${side}`);
    applyAndLog(cube, path, log, `Park the white-${COLOR_WORD[side]} edge on the daisy`);
    placed.push(side);
  }
}

function petalAbove(cube, side) {
  const e = cube.edge('D', side);
  if (!e || e.y !== 1 || e.colors['+y'] !== 'D') return false;
  if (side === 'F') return e.x === 0 && e.z === 1;
  if (side === 'R') return e.x === 1 && e.z === 0;
  if (side === 'B') return e.x === 0 && e.z === -1;
  return e.x === -1 && e.z === 0;
}

function solveCrossFromDaisy(cube, log) {
  for (const side of ['F', 'R', 'B', 'L']) {
    if (edgeSolved(cube, 'D', side)) continue;
    let guard = 0;
    while (!petalAbove(cube, side) && guard < 4) {
      applyAndLog(cube, 'U', log, 'Align a daisy petal with its center');
      guard += 1;
    }
    applyAndLog(cube, `${side}2`, log, `Drop the ${COLOR_WORD[side]}-white edge into the cross`);
  }
}

function solveWhiteCross(cube, log) {
  if (whiteCrossSolved(cube)) return;
  if (!['F', 'R', 'B', 'L'].every((s) => isPetal(cube, s))) {
    solveDaisy(cube, log);
  }
  solveCrossFromDaisy(cube, log);
  if (!whiteCrossSolved(cube)) {
    const path = bfs(
      cube,
      whiteCrossSolved,
      (c) => ['F', 'R', 'B', 'L'].map((s) => pieceKey(c.edge('D', s), 'D')).join('|'),
      10,
    );
    if (!path) throw new Error('White cross failed');
    applyAndLog(cube, path, log, 'Finish the white cross');
  }
}

function downSlotOf(piece) {
  return CORNER_SLOTS.find((s) => {
    const p = SLOT_POS[s.name];
    return piece.y === -1 && piece.x === p.x && piece.z === p.z;
  });
}

function solveWhiteCorners(cube, log) {
  for (const slot of CORNER_SLOTS) {
    if (cornerSolved(cube, ...slot.colors)) continue;
    const piece = () => cube.corner(...slot.colors);

    if (piece().y === -1) {
      const occupant = downSlotOf(piece());
      applyAndLog(
        cube,
        occupant?.extract ?? slot.extract,
        log,
        'Lift a misplaced white corner to the top layer',
      );
    }

    let guard = 0;
    while (
      !(piece().x === slot.above.x && piece().y === 1 && piece().z === slot.above.z) &&
      guard < 4
    ) {
      applyAndLog(cube, 'U', log, 'Bring the white corner above its slot');
      guard += 1;
    }

    guard = 0;
    while (!cornerSolved(cube, ...slot.colors) && guard < 6) {
      applyAndLog(cube, slot.insert, log, 'Insert the white corner with the trigger');
      guard += 1;
    }

    if (!cornerSolved(cube, ...slot.colors)) {
      throw new Error(`Could not insert corner ${slot.name}`);
    }
  }
}

function midSlotName(piece) {
  if (piece.y !== 0) return null;
  if (piece.x === 1 && piece.z === 1) return 'FR';
  if (piece.x === -1 && piece.z === 1) return 'FL';
  if (piece.x === 1 && piece.z === -1) return 'BR';
  if (piece.x === -1 && piece.z === -1) return 'BL';
  return null;
}

function sideOfUEdge(piece) {
  if (piece.y !== 1) return null;
  if (piece.z === 1 && piece.x === 0) return 'F';
  if (piece.x === 1 && piece.z === 0) return 'R';
  if (piece.z === -1 && piece.x === 0) return 'B';
  if (piece.x === -1 && piece.z === 0) return 'L';
  return null;
}

const SIDE_DIR = { F: '+z', R: '+x', B: '-z', L: '-x' };

function solveMiddleLayer(cube, log) {
  const edges = [
    { a: 'F', b: 'R', name: 'FR' },
    { a: 'F', b: 'L', name: 'FL' },
    { a: 'B', b: 'R', name: 'BR' },
    { a: 'B', b: 'L', name: 'BL' },
  ];

  for (const edge of edges) {
    if (edgeSolved(cube, edge.a, edge.b)) continue;
    const piece = () => cube.edge(edge.a, edge.b);

    if (piece().y === 0) {
      const slot = midSlotName(piece());
      applyAndLog(
        cube,
        EXTRACT_SLOT[slot],
        log,
        `Take the ${edge.name} edge out of the ${slot} slot`,
      );
    }

    if (piece().y !== 1) {
      throw new Error(`Middle edge ${edge.name} is not on the top layer`);
    }

    let guard = 0;
    while (guard < 4) {
      const e = piece();
      const side = sideOfUEdge(e);
      const sideColor = e.colors[SIDE_DIR[side]];
      if (side && sideColor === side) break;
      applyAndLog(cube, 'U', log, 'Match the belt edge to its center');
      guard += 1;
    }

    const e = piece();
    const side = sideOfUEdge(e);
    const topColor = e.colors['+y'];
    if (RIGHT_OF[side] === topColor) {
      applyAndLog(cube, INSERT[side].right, log, `Insert the ${edge.name} edge to the right`);
    } else if (LEFT_OF[side] === topColor) {
      applyAndLog(cube, INSERT[side].left, log, `Insert the ${edge.name} edge to the left`);
    } else {
      throw new Error(`Middle edge ${edge.name} has no insert direction from ${side}`);
    }

    if (!edgeSolved(cube, edge.a, edge.b)) {
      throw new Error(`Middle edge ${edge.name} did not land`);
    }
  }
}

function uEdgeYellows(cube) {
  const u = cube.faces().U;
  return {
    U: u[1] === 'U',
    R: u[5] === 'U',
    D: u[7] === 'U',
    L: u[3] === 'U',
    count: [u[1], u[3], u[5], u[7]].filter((c) => c === 'U').length,
  };
}

function solveYellowCross(cube, log) {
  let guard = 0;
  while (!yellowCrossSolved(cube) && guard < 8) {
    const y = uEdgeYellows(cube);
    if (y.count === 0) {
      applyAndLog(cube, SUNSET, log, 'Dot case — seed the yellow cross');
    } else if (y.L && y.R && !y.U && !y.D) {
      applyAndLog(cube, SUNSET, log, 'Line case — stand the yellow cross up');
    } else if (y.U && y.D && !y.L && !y.R) {
      applyAndLog(cube, 'U', log, 'Turn the yellow line horizontal');
    } else if (y.count === 2) {
      let spin = 0;
      while (!(cube.faces().U[1] === 'U' && cube.faces().U[3] === 'U') && spin < 4) {
        applyAndLog(cube, 'U', log, 'Hold the yellow L in the back-left');
        spin += 1;
      }
      applyAndLog(cube, SUNSET, log, 'L case — complete the yellow cross');
    } else {
      applyAndLog(cube, SUNSET, log, 'Shape the yellow edges');
    }
    guard += 1;
  }
  if (!yellowCrossSolved(cube)) throw new Error('Yellow cross failed');
}

function solveYellowFace(cube, log) {
  for (let i = 0; i < 4; i += 1) {
    let guard = 0;
    while (cube.at(1, 1, 1).colors['+y'] !== 'U' && guard < 6) {
      applyAndLog(cube, TWIST, log, 'Twist the front-right yellow corner in place');
      guard += 1;
    }
    applyAndLog(cube, 'U', log, 'Move to the next last-layer corner');
  }
  if (!yellowFaceSolved(cube)) throw new Error('Yellow face failed');
}

function lastLayerCornersPlaced(cube) {
  return U_CORNERS.every((name) => cornerInSlot(cube, name));
}

function placedUCorners(cube) {
  return U_CORNERS.filter((name) => cornerInSlot(cube, name));
}

function aufToBestCorners(cube, log) {
  let bestI = 0;
  let bestN = -1;
  const probe = cube.clone();
  for (let i = 0; i < 4; i += 1) {
    const n = placedUCorners(probe).length;
    if (n > bestN) {
      bestN = n;
      bestI = i;
    }
    probe.apply('U');
  }
  const turn = [null, 'U', 'U2', "U'"][bestI];
  if (turn) applyAndLog(cube, turn, log, 'Align the last-layer corners');
  return placedUCorners(cube);
}

function pairKey(names) {
  return [...names].sort().join(',');
}

function solveLastLayerCorners(cube, log) {
  let guard = 0;
  while (!lastLayerCornersPlaced(cube) && guard < 8) {
    const placed = aufToBestCorners(cube, log);
    if (placed.length === 4) break;
    if (placed.length === 1) {
      applyAndLog(cube, APERM_KEEP[placed[0]], log, 'Cycle the other three last-layer corners');
    } else if (placed.length === 2) {
      const key = pairKey(placed);
      if (TPERM_KEEP[key]) {
        applyAndLog(cube, TPERM_KEEP[key], log, 'Swap the remaining last-layer corners');
      } else if (YPERM_KEEP[key]) {
        applyAndLog(cube, YPERM_KEEP[key], log, 'Swap the diagonal last-layer corners');
      } else {
        applyAndLog(cube, APERM_KEEP.UFL, log, 'Reshape the last-layer corners');
      }
    } else {
      applyAndLog(cube, APERM_KEEP.UFL, log, 'Break a stubborn last-layer corner case');
    }
    guard += 1;
  }

  if (!lastLayerCornersPlaced(cube)) {
    throw new Error('Last-layer corners failed');
  }
}

function lastLayerEdgesPlaced(cube) {
  return (
    edgeSolved(cube, 'U', 'F') &&
    edgeSolved(cube, 'U', 'R') &&
    edgeSolved(cube, 'U', 'B') &&
    edgeSolved(cube, 'U', 'L')
  );
}

function solvedUEdges(cube) {
  return ['F', 'R', 'B', 'L'].filter((side) => edgeSolved(cube, 'U', side));
}

function solveLastLayerEdges(cube, log) {
  if (cube.isSolved()) return;

  const solved = solvedUEdges(cube);
  if (solved.length === 1) {
    applyAndLog(cube, UPERM_KEEP[solved[0]], log, 'Cycle the last-layer edges');
    if (!cube.isSolved()) {
      applyAndLog(cube, UPERM_KEEP[solved[0]], log, 'Cycle the last-layer edges the other way');
    }
  } else if (solved.length === 0) {
    const options = [
      [HPERM, 'Swap opposite last-layer edges'],
      [ZPERM, 'Swap adjacent last-layer edges'],
      [ZPERM_Y, 'Swap the other adjacent last-layer edges'],
    ];
    const hit = options.find(([alg]) => cube.clone().apply(alg).isSolved());
    if (!hit) throw new Error('Last-layer edges failed');
    applyAndLog(cube, hit[0], log, hit[1]);
  }

  if (!cube.isSolved()) throw new Error('Last-layer edges failed');
}

function noteToPhase(note = '') {
  const n = note.toLowerCase();
  if (n.includes('daisy') || n.includes('petal')) return 'daisy';
  if (n.includes('yellow cross') || n.includes('yellow line') || n.includes('yellow l') || n.includes('dot case') || n.includes('line case') || n.includes('l case') || n.includes('yellow edges') && n.includes('shape')) {
    return 'yellowCross';
  }
  if (n.includes('cross') || n.includes('daisy petal')) return 'cross';
  if (n.includes('white corner') || n.includes('trigger')) return 'corners';
  if (n.includes('belt') || n.includes('middle') || n.includes(' slot') || n.includes('edge to the')) return 'middle';
  if (n.includes('yellow corner') || n.includes('twist the front-right') || n.includes('next last-layer corner')) {
    return 'yellowFace';
  }
  return 'lastLayer';
}

function splitPhases(rawLog) {
  const buckets = {
    daisy: [],
    cross: [],
    corners: [],
    middle: [],
    yellowCross: [],
    yellowFace: [],
    lastLayer: [],
  };
  let current = 'daisy';
  for (const item of rawLog) {
    current = noteToPhase(item.note) || current;
    buckets[current].push(item.move);
  }

  return ['daisy', 'cross', 'corners', 'middle', 'yellowCross', 'yellowFace', 'lastLayer']
    .map((id) => {
      const moves = compactMoves(buckets[id]);
      if (!moves.length) return null;
      return { id, ...PHASE_COPY[id], moves };
    })
    .filter(Boolean);
}

export function solveBeginner(facelets) {
  const cube = new Cube(facelets);
  if (cube.isSolved()) {
    return { phases: [], moves: [], method: 'beginner' };
  }

  const log = [];
  solveWhiteCross(cube, log);
  if (!whiteCrossSolved(cube)) throw new Error('Cross invariant failed');
  solveWhiteCorners(cube, log);
  if (!firstLayerSolved(cube)) throw new Error('First layer invariant failed');
  solveMiddleLayer(cube, log);
  if (!f2lSolved(cube)) throw new Error('F2L invariant failed');
  solveYellowCross(cube, log);
  solveYellowFace(cube, log);
  solveLastLayerCorners(cube, log);
  solveLastLayerEdges(cube, log);

  if (!cube.isSolved()) {
    throw new Error('Beginner solver did not finish the cube');
  }

  return {
    method: 'beginner',
    phases: splitPhases(log),
    moves: compactMoves(onlyMoves(log)),
  };
}

export function solveWithCubejs(facelets, Cubejs) {
  const cube = Cubejs.fromString(facelets);
  const alg = cube.solve();
  const moves = compactMoves(parseAlg(alg));
  return {
    method: 'kociemba',
    phases: [
      {
        id: 'speed',
        title: 'Shortest path',
        kicker: 'Kociemba',
        blurb: 'A two-phase computer solve. Fewer turns, less teaching — play it or step through each move.',
        moves,
      },
    ],
    moves,
  };
}

export const __debug = {
  solveWhiteCross,
  solveWhiteCorners,
  solveMiddleLayer,
  solveYellowCross,
  solveYellowFace,
  solveLastLayerCorners,
  solveLastLayerEdges,
};
