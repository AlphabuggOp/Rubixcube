import { useEffect } from 'react';
import { SOLVED_FACELETS } from '../cube/constants.js';
import { useStore } from '../store/useStore.js';

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export default function HUD() {
  const moveCount = useStore((s) => s.moveCount);
  const timerMs = useStore((s) => s.timerMs);
  const lastMove = useStore((s) => s.lastMove);
  const tickTimer = useStore((s) => s.tickTimer);
  const mode = useStore((s) => s.mode);
  const facelets = useStore((s) => s.facelets);
  const solved = facelets === SOLVED_FACELETS;

  useEffect(() => {
    let last = performance.now();
    let raf = 0;
    const loop = (now) => {
      tickTimer(now - last);
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tickTimer]);

  if (mode === 'solver') return null;

  return (
    <aside className="hud">
      <div className="stat">
        <span>Time</span>
        <strong>{formatTime(timerMs)}</strong>
      </div>
      <div className="stat">
        <span>Turns</span>
        <strong>{moveCount}</strong>
      </div>
      <div className="stat">
        <span>Last</span>
        <strong>{lastMove || '—'}</strong>
      </div>
      {solved && (
        <div className="stat">
          <span>State</span>
          <strong>Solved</strong>
        </div>
      )}
    </aside>
  );
}
