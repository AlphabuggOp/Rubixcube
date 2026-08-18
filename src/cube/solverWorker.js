import Cube from 'cubejs';

self.onmessage = (event) => {
  const data = event.data || {};
  if (data.type === 'init') {
    Cube.initSolver();
    self.postMessage({ type: 'ready' });
    return;
  }
  if (data.type === 'solve') {
    try {
      const cube = Cube.fromString(data.facelets);
      if (cube.asString() !== data.facelets) {
        self.postMessage({
          type: 'invalid',
          reason: 'This state is not reachable on a real cube — an edge is flipped, a corner is twisted, or the permutation is odd.',
        });
        return;
      }
      const alg = cube.solve();
      self.postMessage({ type: 'solution', alg });
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message || 'Solve failed' });
    }
  }
};
