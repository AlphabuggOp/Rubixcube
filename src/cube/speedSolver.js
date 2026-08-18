import { parseAlg, compactMoves } from './engine.js';

let worker = null;
let ready = false;
let readyPromise = null;
let Cubejs = null;
let mode = 'none';

function packageSolution(alg) {
  const moves = compactMoves(parseAlg(alg));
  return {
    method: 'kociemba',
    phases: [
      {
        id: 'speed',
        title: 'Shortest path',
        kicker: 'Kociemba',
        blurb: 'A two-phase computer solve. Fewer turns, less teaching — play it or step through each move.',
        moves,
      },
    ],
    moves,
  };
}

function createWorker() {
  return new Worker(new URL('./solverWorker.js', import.meta.url), { type: 'module' });
}

export function isSpeedReady() {
  return ready;
}

export function warmupSpeedSolver() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    try {
      worker = createWorker();
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), 18000);
        worker.onmessage = (event) => {
          if (event.data?.type === 'ready') {
            clearTimeout(timer);
            resolve();
          }
        };
        worker.onerror = (err) => {
          clearTimeout(timer);
          reject(err);
        };
        worker.postMessage({ type: 'init' });
      });
      mode = 'worker';
      ready = true;
      return true;
    } catch {
      const mod = await import('cubejs');
      Cubejs = mod.default || mod;
      await new Promise((resolve) => {
        setTimeout(() => {
          Cubejs.initSolver();
          resolve();
        }, 20);
      });
      mode = 'main';
      ready = true;
      return true;
    }
  })();
  return readyPromise;
}

export function speedSolve(facelets) {
  if (!ready) {
    return Promise.reject(new Error('Speed solver is still warming up'));
  }
  if (mode === 'main') {
    const cube = Cubejs.fromString(facelets);
    if (cube.asString() !== facelets) {
      return Promise.reject(new Error('This state is not reachable on a real cube.'));
    }
    return Promise.resolve(packageSolution(cube.solve()));
  }
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const data = event.data || {};
      if (data.type === 'solution') {
        worker.removeEventListener('message', onMessage);
        resolve(packageSolution(data.alg));
      } else if (data.type === 'invalid') {
        worker.removeEventListener('message', onMessage);
        reject(new Error(data.reason || 'That cube state is not reachable.'));
      } else if (data.type === 'error') {
        worker.removeEventListener('message', onMessage);
        reject(new Error(data.message || 'Speed solver failed'));
      }
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ type: 'solve', facelets });
  });
}
