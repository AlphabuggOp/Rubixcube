import { useStore } from '../store/useStore.js';

export default function Hint() {
  const mode = useStore((s) => s.mode);
  if (mode !== 'play') return null;
  return (
    <p className="hint">
      Drag any sticker — including a center — to turn that layer.
      Orbit the empty space around the cube.
      Keys: <kbd>U</kbd> <kbd>R</kbd> <kbd>F</kbd> <kbd>D</kbd> <kbd>L</kbd> <kbd>B</kbd>
      {' '}and <kbd>M</kbd> <kbd>E</kbd> <kbd>S</kbd> for the middle slices.
    </p>
  );
}
