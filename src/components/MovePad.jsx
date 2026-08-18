import { MOVES, SLICE_MOVES } from '../cube/constants.js';
import { useStore } from '../store/useStore.js';

export default function MovePad() {
  const enqueue = useStore((s) => s.enqueue);
  const mode = useStore((s) => s.mode);
  if (mode === 'solver') return null;

  return (
    <aside className="pad">
      <header>
        <h2>Turns</h2>
        <span>U R F D L B · M E S</span>
      </header>
      <div className="moves">
        {MOVES.map((move) => (
          <button
            key={move}
            type="button"
            className={`move ${move[0]}`}
            onClick={() => enqueue([move])}
          >
            {move}
          </button>
        ))}
      </div>
      <div className="moves slices">
        {SLICE_MOVES.map((move) => (
          <button
            key={move}
            type="button"
            className={`move ${move[0]}`}
            onClick={() => enqueue([move])}
          >
            {move}
          </button>
        ))}
      </div>
    </aside>
  );
}
