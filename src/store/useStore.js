import { create } from 'zustand';
import {
  CAMERA_PRESETS,
  FACE_ORDER,
  PAINT_SEQUENCE,
  SOLVED_FACELETS,
} from '../cube/constants.js';
import {
  Cube,
  applyMoves,
  compactMoves,
  parseAlg,
  randomScramble,
} from '../cube/engine.js';
import { solveBeginner } from '../cube/solver.js';
import { describeInvalid, isReachableFaceletString } from '../cube/validate.js';
import {
  allFacesPainted,
  blankPainted,
  composePreview,
  emptyFace,
  faceComplete,
  setCell,
} from '../cube/preview.js';
import { playSolved, playTick, unlockAudio } from '../audio/ticks.js';
import { speedSolve, warmupSpeedSolver } from '../cube/speedSolver.js';

function flattenSolution(solution) {
  if (!solution) return [];
  return solution.phases.flatMap((phase) => phase.moves);
}

function stateAfter(origin, moves, count) {
  return applyMoves(origin, moves.slice(0, count));
}

function isSolvedString(facelets) {
  return facelets === SOLVED_FACELETS;
}

export const useStore = create((set, get) => ({
  facelets: SOLVED_FACELETS,
  history: [],
  queue: [],
  animating: false,
  lastMove: null,
  moveCount: 0,
  timerMs: 0,
  timerOn: false,
  scrambleId: 0,
  celebrate: false,
  ignoreMoves: false,
  sound: true,
  helpOpen: false,
  toast: null,

  mode: 'play',
  cameraPreset: 'play',
  inspectFace: null,

  solverStage: 'intro',
  paintIndex: 0,
  painted: blankPainted(),
  paintBrush: 'U',
  paintDraft: emptyFace('U').join(''),

  solution: null,
  solutionOrigin: null,
  solutionCursor: 0,
  solutionPlaying: false,
  solutionMethod: 'beginner',
  speedReady: false,
  speedWarming: false,
  solving: false,



  setToast: (toast) => {
    set({ toast });
    if (toast) {
      window.clearTimeout(get()._toastTimer);
      const timer = window.setTimeout(() => set({ toast: null }), 4200);
      set({ _toastTimer: timer });
    }
  },

  setSound: (sound) => set({ sound }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setCameraPreset: (cameraPreset) => set({ cameraPreset }),

  enqueue: (moves, { fast = false } = {}) => {
    const list = parseAlg(moves);
    if (!list.length) return;
    set((s) => ({
      queue: [...s.queue, ...list.map((move) => ({ move, fast }))],
      celebrate: false,
    }));
  },

  shiftQueue: () => {
    const { queue } = get();
    if (!queue.length) return null;
    const [next, ...rest] = queue;
    set({ queue: rest, animating: true });
    return next;
  },

  finishMove: (move) => {
    const s = get();
    const next = applyMoves(s.facelets, move);
    const solved = isSolvedString(next);
    const justSolved = solved && !isSolvedString(s.facelets);
    if (s.sound) playTick(justSolved);
    if (justSolved && s.sound) playSolved();

    if (s.ignoreMoves) {
      const remaining = s.queue.length;
      set({
        facelets: next,
        lastMove: move,
        animating: false,
        ignoreMoves: remaining > 0,
        history: remaining > 0 ? s.history : [],
        moveCount: remaining > 0 ? s.moveCount : 0,
        timerMs: remaining > 0 ? s.timerMs : 0,
        timerOn: false,
        celebrate: false,
      });
      return;
    }

    const countPlay = s.mode === 'play';
    set({
      facelets: next,
      history: [...s.history, move],
      lastMove: move,
      moveCount: countPlay ? s.moveCount + 1 : s.moveCount,
      animating: false,
      timerOn: countPlay ? (solved ? false : s.timerOn || s.moveCount === 0) : false,
      celebrate: justSolved && countPlay,
    });
    if (justSolved && countPlay) {
      window.setTimeout(() => {
        if (useStore.getState().celebrate) set({ celebrate: false });
      }, 2200);
    }
    if (s.solution && s.solutionPlaying) {
      get().nudgeSolutionCursor();
    }
  },

  applyInstant: (moves) => {
    const list = parseAlg(moves);
    if (!list.length) return;
    const next = applyMoves(get().facelets, list);
    set((s) => ({
      facelets: next,
      history: [...s.history, ...list],
      lastMove: list[list.length - 1],
      moveCount: s.moveCount + list.length,
      queue: [],
      animating: false,
    }));
  },

  undo: () => {
    const s = get();
    if (s.animating || s.queue.length || !s.history.length) return;
    const history = s.history.slice(0, -1);
    const cube = new Cube();
    cube.apply(history);
    set({
      facelets: cube.facelets(),
      history,
      lastMove: history[history.length - 1] || null,
      moveCount: Math.max(0, s.moveCount - 1),
      celebrate: false,
    });
  },

  reset: () => {
    set({
      facelets: SOLVED_FACELETS,
      history: [],
      queue: [],
      animating: false,
      lastMove: null,
      moveCount: 0,
      timerMs: 0,
      timerOn: false,
      celebrate: false,
      solutionPlaying: false,
    });
  },

  scramble: () => {
    unlockAudio();
    const moves = randomScramble(24);
    set({
      facelets: SOLVED_FACELETS,
      history: [],
      queue: [],
      moveCount: 0,
      timerMs: 0,
      timerOn: false,
      celebrate: false,
      scrambleId: get().scrambleId + 1,
      solution: null,
      solutionPlaying: false,
      ignoreMoves: true,
    });
    get().enqueue(moves, { fast: true });
  },

  tickTimer: (dt) => {
    const s = get();
    if (!s.timerOn) return;
    set({ timerMs: s.timerMs + dt });
  },

  openPlay: () => {
    set({
      mode: 'play',
      solverStage: 'intro',
      cameraPreset: 'play',
      inspectFace: null,
      solutionPlaying: false,
    });
  },

  openSolver: () => {
    set({
      mode: 'solver',
      solverStage: 'intro',
      cameraPreset: 'play',
      inspectFace: null,
      solutionPlaying: false,
    });
  },

  startPaint: () => {
    const first = PAINT_SEQUENCE[0];
    set({
      solverStage: 'paint',
      paintIndex: 0,
      painted: blankPainted(),
      paintDraft: emptyFace(first).join(''),
      paintBrush: first,
      cameraPreset: first,
      inspectFace: first,
      solution: null,
      solutionPlaying: false,
    });
  },

  solveOnScreen: async () => {
    const { facelets } = get();
    if (isSolvedString(facelets)) {
      get().setToast({ tone: 'ok', text: 'This cube is already solved.' });
      return;
    }
    await get().buildSolution(facelets);
  },

  setPaintBrush: (paintBrush) => set({ paintBrush }),

  paintCell: (index) => {
    if (index === 4) return;
    const s = get();
    set({ paintDraft: setCell(s.paintDraft, index, s.paintBrush) });
  },

  fillFace: () => {
    const s = get();
    const face = PAINT_SEQUENCE[s.paintIndex];
    set({ paintDraft: (s.paintBrush.repeat(9).slice(0, 4) + face + s.paintBrush.repeat(4)) });
  },

  lockFace: () => {
    const s = get();
    const face = PAINT_SEQUENCE[s.paintIndex];
    if (!faceComplete(s.paintDraft)) {
      get().setToast({ tone: 'warn', text: 'Color every sticker on this face before locking it.' });
      return;
    }
    const painted = { ...s.painted, [face]: s.paintDraft };
    if (s.paintIndex >= PAINT_SEQUENCE.length - 1) {
      const facelets = composePreview(painted);
      const basic = describeInvalid(facelets);
      if (basic) {
        get().setToast({ tone: 'warn', text: basic });
        return;
      }
      const legal = isReachableFaceletString(facelets);
      if (!legal.ok) {
        get().setToast({ tone: 'warn', text: legal.reason });
        return;
      }
      set({ painted, facelets, solverStage: 'solution', cameraPreset: 'play', inspectFace: null });
      get().buildSolution(facelets);
      return;
    }
    const nextIndex = s.paintIndex + 1;
    const nextFace = PAINT_SEQUENCE[nextIndex];
    set({
      painted,
      paintIndex: nextIndex,
      paintDraft: painted[nextFace] || emptyFace(nextFace).join(''),
      paintBrush: nextFace,
      cameraPreset: nextFace,
      inspectFace: nextFace,
    });
  },

  backFace: () => {
    const s = get();
    if (s.paintIndex === 0) {
      set({ solverStage: 'intro', cameraPreset: 'play', inspectFace: null });
      return;
    }
    const painted = { ...s.painted };
    const current = PAINT_SEQUENCE[s.paintIndex];
    painted[current] = null;
    const prevIndex = s.paintIndex - 1;
    const prevFace = PAINT_SEQUENCE[prevIndex];
    set({
      painted,
      paintIndex: prevIndex,
      paintDraft: painted[prevFace] || emptyFace(prevFace).join(''),
      paintBrush: prevFace,
      cameraPreset: prevFace,
      inspectFace: prevFace,
    });
  },

  jumpPaintFace: (index) => {
    const s = get();
    if (index > 0 && !s.painted[PAINT_SEQUENCE[index - 1]] && index > s.paintIndex) return;
    const face = PAINT_SEQUENCE[index];
    set({
      paintIndex: index,
      paintDraft: s.painted[face] || emptyFace(face).join(''),
      paintBrush: face,
      cameraPreset: face,
      inspectFace: face,
    });
  },

  buildSolution: async (facelets) => {
    const method = get().solutionMethod;
    set({ solving: true, solverStage: 'solution', solutionPlaying: false });
    try {
      let solution;
      if (method === 'kociemba') {
        try {
          await get().ensureSpeedSolver();
          solution = await speedSolve(facelets);
        } catch (err) {
          get().setToast({ tone: 'warn', text: `${err.message} Falling back to the guided method.` });
          solution = solveBeginner(facelets);
        }
      } else {
        solution = solveBeginner(facelets);
      }
      solution.moves = compactMoves(solution.moves);
      set({
        solution,
        solutionOrigin: facelets,
        solutionCursor: 0,
        facelets,
        history: [],
        queue: [],
        moveCount: 0,
        timerOn: false,
        solving: false,
        mode: 'solver',
      });
    } catch (err) {
      set({ solving: false });
      get().setToast({ tone: 'warn', text: err.message || 'Could not solve that cube.' });
    }
  },

  setSolutionMethod: (solutionMethod) => set({ solutionMethod }),

  ensureSpeedSolver: async () => {
    if (get().speedReady) return true;
    set({ speedWarming: true });
    try {
      await warmupSpeedSolver();
      set({ speedReady: true, speedWarming: false });
      return true;
    } catch {
      set({ speedWarming: false });
      return false;
    }
  },

  nudgeSolutionCursor: () => {
    const s = get();
    if (!s.solution) return;
    const moves = flattenSolution(s.solution);
    const next = Math.min(s.solutionCursor + 1, moves.length);
    set({
      solutionCursor: next,
      solutionPlaying: s.solutionPlaying && next < moves.length,
    });
  },

  stepForward: () => {
    const s = get();
    if (!s.solution || s.animating || s.queue.length) return;
    const moves = flattenSolution(s.solution);
    if (s.solutionCursor >= moves.length) return;
    get().enqueue([moves[s.solutionCursor]]);
  },

  stepBack: () => {
    const s = get();
    if (!s.solution || s.animating || s.queue.length) return;
    const moves = flattenSolution(s.solution);
    const next = Math.max(0, s.solutionCursor - 1);
    set({
      facelets: stateAfter(s.solutionOrigin, moves, next),
      solutionCursor: next,
      solutionPlaying: false,
      history: moves.slice(0, next),
      lastMove: moves[next - 1] || null,
    });
  },

  jumpToPhase: (phaseIndex) => {
    const s = get();
    if (!s.solution) return;
    const offset = s.solution.phases.slice(0, phaseIndex).reduce((n, p) => n + p.moves.length, 0);
    const moves = flattenSolution(s.solution);
    set({
      facelets: stateAfter(s.solutionOrigin, moves, offset),
      solutionCursor: offset,
      solutionPlaying: false,
      queue: [],
      history: moves.slice(0, offset),
      lastMove: moves[offset - 1] || null,
    });
  },

  playSolution: () => {
    const s = get();
    if (!s.solution) return;
    const moves = flattenSolution(s.solution).slice(s.solutionCursor);
    if (!moves.length) return;
    set({ solutionPlaying: true });
    get().enqueue(moves);
  },

  pauseSolution: () => {
    set({ solutionPlaying: false, queue: [] });
  },

  resetSolution: () => {
    const s = get();
    if (!s.solution) return;
    set({
      facelets: s.solutionOrigin,
      solutionCursor: 0,
      solutionPlaying: false,
      queue: [],
      history: [],
      lastMove: null,
    });
  },

  currentPhaseIndex: () => {
    const s = get();
    if (!s.solution) return 0;
    let acc = 0;
    for (let i = 0; i < s.solution.phases.length; i += 1) {
      acc += s.solution.phases[i].moves.length;
      if (s.solutionCursor < acc || i === s.solution.phases.length - 1) return i;
    }
    return 0;
  },
}));

export function selectDisplayFacelets(s) {
  if (s.mode === 'solver' && s.solverStage === 'paint') {
    const painted = { ...s.painted, [PAINT_SEQUENCE[s.paintIndex]]: s.paintDraft };
    return composePreview(painted);
  }
  return s.facelets;
}

export { flattenSolution, CAMERA_PRESETS, FACE_ORDER };
