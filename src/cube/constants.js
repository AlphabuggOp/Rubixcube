export const FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'];

export const FACE_AXIS = {
  U: { axis: 'y', sign: 1, cwRh: -1 },
  D: { axis: 'y', sign: -1, cwRh: 1 },
  R: { axis: 'x', sign: 1, cwRh: -1 },
  L: { axis: 'x', sign: -1, cwRh: 1 },
  F: { axis: 'z', sign: 1, cwRh: -1 },
  B: { axis: 'z', sign: -1, cwRh: 1 },
  M: { axis: 'x', sign: 0, cwRh: 1 },
  E: { axis: 'y', sign: 0, cwRh: 1 },
  S: { axis: 'z', sign: 0, cwRh: -1 },
};

export const FACE_NORMAL = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

export const COLOR_META = {
  U: {
    id: 'U',
    name: 'White',
    hex: '#f4efe4',
    ink: '#2a261c',
    sticker: '#f3efe6',
  },
  R: {
    id: 'R',
    name: 'Red',
    hex: '#e24538',
    ink: '#fff6f4',
    sticker: '#de3d32',
  },
  F: {
    id: 'F',
    name: 'Green',
    hex: '#27b36a',
    ink: '#042214',
    sticker: '#1fa85f',
  },
  D: {
    id: 'D',
    name: 'Yellow',
    hex: '#f0c430',
    ink: '#2a2204',
    sticker: '#f0c22e',
  },
  L: {
    id: 'L',
    name: 'Orange',
    hex: '#ef7d2e',
    ink: '#2a1404',
    sticker: '#ef7a28',
  },
  B: {
    id: 'B',
    name: 'Blue',
    hex: '#3b6ef0',
    ink: '#f3f6ff',
    sticker: '#3568ea',
  },
};

export const OPPOSITE = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };

export const ADJACENT = {
  U: ['F', 'R', 'B', 'L'],
  D: ['F', 'L', 'B', 'R'],
  F: ['U', 'R', 'D', 'L'],
  B: ['U', 'L', 'D', 'R'],
  R: ['U', 'B', 'D', 'F'],
  L: ['U', 'F', 'D', 'B'],
};

export const MOVES = [
  'U', "U'", 'U2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'B', "B'", 'B2',
];

export const SLICE_MOVES = [
  'M', "M'", 'M2',
  'E', "E'", 'E2',
  'S', "S'", 'S2',
];

export const BASIC_FACES = ['U', 'R', 'F', 'D', 'L', 'B'];

export const PAINT_SEQUENCE = ['U', 'R', 'F', 'D', 'L', 'B'];

export const PAINT_HINTS = {
  U: 'Hold the cube so this face is on top. Color every sticker you see, including the center.',
  R: 'Turn the cube so the right face looks at you, top color still up. Paint what you see.',
  F: 'Front face toward you, same top color. This is the face you will watch during most turns.',
  D: 'Flip the cube to show the bottom. Keep the original front pointing away from you, then paint.',
  L: 'Left face toward you, original top still up. Mirror of the right face.',
  B: 'Back face toward you — the original top stays up, the front now points away.',
};

export const PHASE_COPY = {
  daisy: {
    title: 'Daisy',
    kicker: 'Phase 1',
    blurb: 'Park four yellow edge stickers around the white center. The daisy is a staging area — nothing is committed yet.',
  },
  cross: {
    title: 'Yellow Cross',
    kicker: 'Phase 2',
    blurb: 'Match each daisy petal to its center, then turn that face twice. Yellow sits on the bottom from here on.',
  },
  corners: {
    title: 'Yellow Corners',
    kicker: 'Phase 3',
    blurb: 'Drop each yellow corner into the first layer with the right-hand trigger until the whole face is locked.',
  },
  middle: {
    title: 'Middle Layer',
    kicker: 'Phase 4',
    blurb: 'The four belt edges go in next. Align a non-white edge with its center, then send it left or right.',
  },
  yellowCross: {
    title: 'White Cross',
    kicker: 'Phase 5',
    blurb: 'Read the white face: dot, L-shape, or line. One short algorithm walks those shapes up to a cross.',
  },
  yellowFace: {
    title: 'White Face',
    kicker: 'Phase 6',
    blurb: 'Twist the last-layer corners in place until white is a solid face. The rest of the cube is restored as you finish.',
  },
  lastLayer: {
    title: 'Last Layer',
    kicker: 'Phase 7',
    blurb: 'Cycle the remaining corners and edges into their homes. When the last piece sits, the cube is solved.',
  },
};

export const CAMERA_PRESETS = {
  play: [4.35, 3.25, 5.35],
  U: [0.15, 7.2, 0.35],
  D: [0.15, -7.2, 0.35],
  F: [0.2, 1.4, 7.1],
  B: [0.2, 1.4, -7.1],
  R: [7.1, 1.4, 0.2],
  L: [-7.1, 1.4, 0.2],
};

export const SOLVED_FACELETS = FACE_ORDER.map((f) => f.repeat(9)).join('');
