import { Cube, compactMoves, randomScramble, applyMoves } from './engine.js';
import { SOLVED_FACELETS } from './constants.js';
import { solveBeginner } from './solver.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function testIdentities() {
  const faces = ['U', 'R', 'F', 'D', 'L', 'B', 'M', 'E', 'S'];
  for (const f of faces) {
    const c = new Cube().apply([f, f, f, f]);
    assert(c.isSolved(), `${f}4 should be identity`);
    assert(new Cube().apply([f, `${f}'`]).isSolved(), `${f} ${f}' should be identity`);
    assert(new Cube().apply([`${f}2`, `${f}2`]).isSolved(), `${f}2 ${f}2 should be identity`);
  }

  const sexy = ['R', 'U', "R'", "U'"];
  const six = [];
  for (let i = 0; i < 6; i += 1) six.push(...sexy);
  assert(new Cube().apply(six).isSolved(), 'sexy move x6 is identity');

  const tperm = "R U R' U' R' F R2 U' R' U' R U R' F'".split(' ');
  assert(new Cube().apply([...tperm, ...tperm]).isSolved(), 'T-perm x2 is identity');

  const sune = "R U R' U R U2 R'".split(' ');
  assert(new Cube().apply([...sune, ...sune, ...sune, ...sune, ...sune, ...sune]).isSolved(), 'sune x6');
}

function testFaceletRoundtrip() {
  const solved = new Cube();
  assert(solved.facelets() === SOLVED_FACELETS, 'solved facelets');
  const scrambled = new Cube().apply(randomScramble(20));
  const again = new Cube(scrambled.facelets());
  assert(again.facelets() === scrambled.facelets(), 'facelet roundtrip');
}

function testKnownPattern() {
  const superflip = "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2".split(' ');
  const cube = new Cube().apply(superflip);
  assert(!cube.isSolved(), 'superflip is not solved');
  assert(new Cube(cube.facelets()).apply(superflip).isSolved(), 'superflip is an involution');
}

function testSolver() {
  const n = 30;
  let maxMoves = 0;
  for (let i = 0; i < n; i += 1) {
    const scramble = randomScramble(25);
    const cube = new Cube().apply(scramble);
    const start = cube.facelets();
    let result;
    try {
      result = solveBeginner(start);
    } catch (err) {
      throw new Error(`solver failed on scramble ${scramble.join(' ')}: ${err.message}`);
    }
    const solved = applyMoves(start, result.moves);
    assert(solved === SOLVED_FACELETS, `did not solve scramble ${scramble.join(' ')}`);
    maxMoves = Math.max(maxMoves, result.moves.length);
  }
  return { n, maxMoves };
}

function testCompact() {
  assert(compactMoves(['U', 'U']).join(' ') === 'U2', 'U U -> U2');
  assert(compactMoves(['U', "U'"]).join(' ') === '', "U U' -> empty");
  assert(compactMoves(['R', 'R', 'R']).join(' ') === "R'", 'R R R -> R\'');
}

try {
  testIdentities();
  testFaceletRoundtrip();
  testKnownPattern();
  testCompact();
  const stats = testSolver();
  console.log(`ok — engine identities + ${stats.n} solves (longest ${stats.maxMoves} moves)`);
} catch (err) {
  console.error('FAIL', err);
  process.exit(1);
}
