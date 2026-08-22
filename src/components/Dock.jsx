import { useStore } from '../store/useStore.js';

export default function Dock() {
  const scramble = useStore((s) => s.scramble);
  const reset = useStore((s) => s.reset);
  const undo = useStore((s) => s.undo);
  const openSolver = useStore((s) => s.openSolver);
  const solveOnScreen = useStore((s) => s.solveOnScreen);
  const mode = useStore((s) => s.mode);

  return (
    <div className="dock">
      <button type="button" onClick={scramble}>
        Scramble
      </button>
      <button type="button" onClick={reset}>
        Reset
      </button>
      <button type="button" onClick={undo}>
        Undo
      </button>
      {mode === 'play' ? (
        <button type="button" className="primary" onClick={() => { openSolver(); solveOnScreen(); }}>
          Solve this
        </button>
      ) : (
        <button type="button" className="primary" onClick={solveOnScreen}>
          Solve this
        </button>
      )}
    </div>
  );
}
