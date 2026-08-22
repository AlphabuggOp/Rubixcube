import { useStore } from '../store/useStore.js';

export default function Header() {
  const mode = useStore((s) => s.mode);
  const openPlay = useStore((s) => s.openPlay);
  const openSolver = useStore((s) => s.openSolver);
  const setHelpOpen = useStore((s) => s.setHelpOpen);

  return (
    <header className="topbar">
      <div className="brand">
        <svg className="mark" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M20 4 L34 12 L20 20 L6 12 Z" fill="#f3efe6" />
          <path d="M6 12 L20 20 L20 36 L6 28 Z" fill="#1fa85f" />
          <path d="M20 20 L34 12 L34 28 L20 36 Z" fill="#de3d32" />
        </svg>
        <div>
          <h1>RUBIX</h1>
          <p>One face at a time</p>
        </div>
      </div>
      <nav className="nav">
        <button className={mode === 'play' ? 'active' : ''} onClick={openPlay} type="button">
          Play
        </button>
        <button className={mode === 'solver' ? 'active' : ''} onClick={openSolver} type="button">
          Solver
        </button>
      </nav>
      <button className="icon-btn" type="button" onClick={() => setHelpOpen(true)} aria-label="Help">
        ?
      </button>
    </header>
  );
}
