import { useStore } from '../store/useStore.js';
import FacePainter from './FacePainter.jsx';
import SolutionPlayer from './SolutionPlayer.jsx';

export default function SolverPanel() {
  const mode = useStore((s) => s.mode);
  const stage = useStore((s) => s.solverStage);
  const openPlay = useStore((s) => s.openPlay);
  const startPaint = useStore((s) => s.startPaint);
  const solveOnScreen = useStore((s) => s.solveOnScreen);

  if (mode !== 'solver') return null;

  return (
    <aside className="sheet">
      <div className="sheet-body">
        {stage === 'intro' && (
          <>
            <p className="kicker">Solver</p>
            <h2>Read the cube one face at a time</h2>
            <p className="lede">
              Don’t dump the whole puzzle in at once. Choose a face, lock its colors, and we’ll
              advance the next phase — then walk a beginner solution, or a short computer path.
            </p>
            <div className="choices">
              <button type="button" className="choice" onClick={startPaint}>
                <strong>Paint a physical cube</strong>
                <span>
                  Hold white on top and green toward you. We’ll ask for up, right, front, down,
                  left, then back.
                </span>
              </button>
              <button type="button" className="choice" onClick={solveOnScreen}>
                <strong>Solve the cube on screen</strong>
                <span>
                  Use whatever scramble is already sitting in the studio. No painting required.
                </span>
              </button>
            </div>
          </>
        )}
        {stage === 'paint' && <FacePainter />}
        {stage === 'solution' && <SolutionPlayer />}
      </div>
      {stage === 'intro' && (
        <div className="sheet-foot">
          <button type="button" className="ghost" onClick={openPlay}>
            Back to play
          </button>
        </div>
      )}
    </aside>
  );
}
