import { COLOR_META, FACE_ORDER } from '../cube/constants.js';
import { useStore } from '../store/useStore.js';

export function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return null;
  return <div className="toast">{toast.text}</div>;
}

export function HelpModal() {
  const open = useStore((s) => s.helpOpen);
  const setHelpOpen = useStore((s) => s.setHelpOpen);
  if (!open) return null;
  return (
    <div className="modal" onClick={() => setHelpOpen(false)} role="presentation">
      <div className="card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2>Studio notes</h2>
        <p className="lede">
          The cube is a real 3×3. Drag stickers to turn layers. The solver never asks for the
          whole state at once — it wants one face, then the next phase.
        </p>
        <ul>
          <li><strong>U R F D L B</strong> — turn that face clockwise</li>
          <li><strong>M E S</strong> — middle slices (or drag a center sticker)</li>
          <li><strong>Shift + key</strong> — prime (counter-clockwise)</li>
          <li><strong>2 after a face</strong> — a half turn, or use the pad</li>
          <li><strong>Z</strong> — undo · <strong>Space</strong> — scramble</li>
          <li><strong>Esc</strong> — close this, or return the camera</li>
        </ul>
      </div>
    </div>
  );
}

export function Confetti() {
  const celebrate = useStore((s) => s.celebrate);
  if (!celebrate) return null;
  const bits = Array.from({ length: 48 }, (_, i) => {
    const color = COLOR_META[FACE_ORDER[i % 6]].sticker;
    return {
      id: i,
      left: `${(i * 17) % 100}%`,
      delay: `${(i % 12) * 0.04}s`,
      color,
    };
  });
  return (
    <div className="confetti">
      {bits.map((b) => (
        <i key={b.id} style={{ left: b.left, background: b.color, animationDelay: b.delay }} />
      ))}
    </div>
  );
}
