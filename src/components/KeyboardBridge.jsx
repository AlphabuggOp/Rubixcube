import { useEffect } from 'react';
import { unlockAudio } from '../audio/ticks.js';
import { useStore } from '../store/useStore.js';

const FACE_KEYS = {
  u: 'U',
  r: 'R',
  f: 'F',
  d: 'D',
  l: 'L',
  b: 'B',
  m: 'M',
  e: 'E',
  s: 'S',
};

export default function KeyboardBridge() {
  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      unlockAudio();
      const store = useStore.getState();
      if (event.key === 'Escape') {
        store.setHelpOpen(false);
        store.setCameraPreset('play');
        return;
      }
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        store.setHelpOpen(!store.helpOpen);
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        store.scramble();
        return;
      }
      if (event.key === 'z' && !event.metaKey && !event.ctrlKey) {
        store.undo();
        return;
      }
      const face = FACE_KEYS[event.key.toLowerCase()];
      if (!face) return;
      if (store.mode === 'solver' && store.solverStage === 'paint') return;
      const move = event.shiftKey ? `${face}'` : face;
      store.enqueue([move]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return null;
}
