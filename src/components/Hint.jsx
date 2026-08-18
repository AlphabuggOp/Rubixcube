import { useStore } from '../store/useStore.js';

export default function Hint() {
  const mode = useStore((s) => s.mode);
  if (mode !== 'play') return null;
  return (
    <p className="hint">
      Drag a sticker to turn a layer. Orbit the void around the cube.
      Keys: <kbd>U</kbd> <kbd>R</kbd> <kbd>F</kbd> <kbd>D</kbd> <kbd>L</kbd> <kbd>B</kbd>
      , shift for prime.
    </p>
  );
}
