import { flattenSolution, useStore } from '../store/useStore.js';

export default function SolutionPlayer() {
  const solution = useStore((s) => s.solution);
  const cursor = useStore((s) => s.solutionCursor);
  const playing = useStore((s) => s.solutionPlaying);
  const solving = useStore((s) => s.solving);
  const method = useStore((s) => s.solutionMethod);
  const setSolutionMethod = useStore((s) => s.setSolutionMethod);
  const buildSolution = useStore((s) => s.buildSolution);
  const origin = useStore((s) => s.solutionOrigin);
  const jumpToPhase = useStore((s) => s.jumpToPhase);
  const stepForward = useStore((s) => s.stepForward);
  const stepBack = useStore((s) => s.stepBack);
  const playSolution = useStore((s) => s.playSolution);
  const pauseSolution = useStore((s) => s.pauseSolution);
  const resetSolution = useStore((s) => s.resetSolution);
  const speedReady = useStore((s) => s.speedReady);
  const speedWarming = useStore((s) => s.speedWarming);

  if (solving) {
    return (
      <div className="busy">
        <i className="spin" /> Reading the cube and writing a path…
      </div>
    );
  }

  if (!solution) {
    return (
      <p className="lede">
        Lock every face, or solve the cube already on screen, and the walkthrough will land here.
      </p>
    );
  }

  const flat = flattenSolution(solution);
  let offset = 0;
  const phases = solution.phases.map((phase) => {
    const start = offset;
    offset += phase.moves.length;
    return { ...phase, start, end: offset };
  });
  const active = phases.findIndex((p) => cursor < p.end || p.end === flat.length);
  const phaseIndex = Math.max(0, active);

  return (
    <div>
      <p className="kicker">
        {flat.length} moves · {solution.phases.length} phase{solution.phases.length === 1 ? '' : 's'}
      </p>
      <h2>Walk the solution</h2>
      <p className="lede">
        Play the whole path, or step a turn at a time. Click a phase to jump there.
      </p>

      <div className="methods">
        <button
          type="button"
          className={`chip ${method === 'beginner' ? 'on' : ''}`}
          onClick={() => {
            setSolutionMethod('beginner');
            if (origin) buildSolution(origin);
          }}
        >
          Guided
        </button>
        <button
          type="button"
          className={`chip ${method === 'kociemba' ? 'on' : ''}`}
          onClick={() => {
            setSolutionMethod('kociemba');
            if (origin) buildSolution(origin);
          }}
        >
          {speedWarming ? 'Warming…' : speedReady ? 'Short path' : 'Short path'}
        </button>
      </div>

      <div className="phase-list">
        {phases.map((phase, i) => {
          const local = cursor - phase.start;
          return (
            <button
              key={phase.id}
              type="button"
              className={`phase ${i === phaseIndex ? 'on' : ''}`}
              onClick={() => jumpToPhase(i)}
            >
              <div className="row">
                <strong>{phase.title}</strong>
                <span className="kicker">{phase.kicker} · {phase.moves.length}</span>
              </div>
              <p>{phase.blurb}</p>
              <div className="alg">
                {phase.moves.map((move, mi) => (
                  <i
                    key={`${move}-${mi}`}
                    className={mi < local ? 'done' : mi === local && i === phaseIndex ? 'now' : ''}
                  >
                    {move}
                  </i>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="player">
        <button type="button" className="ghost" onClick={resetSolution}>
          Start
        </button>
        <button type="button" className="ghost" onClick={stepBack}>
          Back
        </button>
        {playing ? (
          <button type="button" className="solid" onClick={pauseSolution}>
            Pause
          </button>
        ) : (
          <button type="button" className="solid" onClick={playSolution}>
            Play
          </button>
        )}
        <button type="button" className="ghost" onClick={stepForward}>
          Step
        </button>
      </div>
    </div>
  );
}
