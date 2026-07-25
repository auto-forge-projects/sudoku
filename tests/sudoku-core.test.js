'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getPuzzle,
  randomTransform,
  applyTransform,
  setValue,
  cells,
  conflicts,
  isSolved,
} = require('../src/sudoku-core.js');

// Deterministic seeded RNG for tests (mulberry32) — no dependency on Math.random.
function makeRng(seed) {
  let s = seed;
  return function rng() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SOLVED_GRID =
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

function toDigits(str) {
  return Uint8Array.from(str.split('').map(Number));
}

function makeBoard({ givens, values, solution, selected = 0 }) {
  return { givens, values, solution, selected };
}

test('cells() merges givens over values (given wins, else value)', () => {
  const givens = new Uint8Array(81);
  const values = new Uint8Array(81);
  givens[0] = 5;
  values[1] = 3;
  const board = makeBoard({ givens, values, solution: new Uint8Array(81) });
  const c = cells(board);
  assert.equal(c[0], 5);
  assert.equal(c[1], 3);
  assert.equal(c[2], 0);
});

test('setValue writes digit into an empty non-given cell (pure, new Board)', () => {
  const givens = new Uint8Array(81);
  const values = new Uint8Array(81);
  const board = makeBoard({ givens, values, solution: new Uint8Array(81) });
  const next = setValue(board, 4, 7);
  assert.notEqual(next, board);
  assert.equal(next.values[4], 7);
  assert.equal(board.values[4], 0, 'original board must not mutate');
});

test('setValue ignores a given (read-only) cell', () => {
  const givens = new Uint8Array(81);
  givens[10] = 9;
  const values = new Uint8Array(81);
  const board = makeBoard({ givens, values, solution: new Uint8Array(81) });
  const next = setValue(board, 10, 5);
  assert.equal(next.values[10], 0);
});

test('setValue clears a cell with 0/Backspace-equivalent digit', () => {
  const givens = new Uint8Array(81);
  const values = new Uint8Array(81);
  values[20] = 6;
  const board = makeBoard({ givens, values, solution: new Uint8Array(81) });
  const next = setValue(board, 20, 0);
  assert.equal(next.values[20], 0);
});

test('setValue rejects invalid index/digit inputs without throwing (SEC-3)', () => {
  const givens = new Uint8Array(81);
  const values = new Uint8Array(81);
  const board = makeBoard({ givens, values, solution: new Uint8Array(81) });
  const badInputs = [
    [-1, 5],
    [81, 5],
    [10, 10],
    [10, -1],
    [NaN, 5],
    [undefined, 5],
    ['7', 5],
    [10, '7'],
    ['__proto__', 5],
    [10, NaN],
    [10, undefined],
  ];
  for (const [i, digit] of badInputs) {
    assert.doesNotThrow(() => setValue(board, i, digit));
    const result = setValue(board, i, digit);
    assert.deepEqual(result.values, board.values, `input (${i}, ${digit}) must not change board`);
  }
});

test('conflicts() flags duplicate digits within a row', () => {
  const c = new Uint8Array(81);
  c[0] = 5;
  c[3] = 5;
  const flags = conflicts(c);
  assert.equal(flags[0], 1);
  assert.equal(flags[3], 1);
  assert.equal(flags[1], 0);
});

test('conflicts() flags duplicate digits within a column', () => {
  const c = new Uint8Array(81);
  c[0] = 4;
  c[9] = 4; // same column (col 0, row 1)
  const flags = conflicts(c);
  assert.equal(flags[0], 1);
  assert.equal(flags[9], 1);
});

test('conflicts() flags duplicate digits within a 3x3 box', () => {
  const c = new Uint8Array(81);
  c[0] = 7; // box 0
  c[10] = 7; // r1c1, box 0
  const flags = conflicts(c);
  assert.equal(flags[0], 1);
  assert.equal(flags[10], 1);
});

test('conflicts() returns all-zero flags for a valid solved grid', () => {
  const c = toDigits(SOLVED_GRID);
  const flags = conflicts(c);
  assert.ok(flags.every((f) => f === 0));
});

test('conflicts() ignores empty cells (0) when comparing', () => {
  const c = new Uint8Array(81);
  const flags = conflicts(c);
  assert.ok(flags.every((f) => f === 0));
});

test('isSolved() is true for a full valid grid', () => {
  const c = toDigits(SOLVED_GRID);
  assert.equal(isSolved(c), true);
});

test('isSolved() is false when a cell is empty', () => {
  const c = toDigits(SOLVED_GRID);
  c[0] = 0;
  assert.equal(isSolved(c), false);
});

test('isSolved() is false when full but has a conflict', () => {
  const c = toDigits(SOLVED_GRID);
  c[1] = c[0]; // introduce a row conflict, grid stays full
  assert.equal(isSolved(c), false);
});

test('randomTransform() produces well-formed T (digitMap/rowPerm/colPerm/transpose)', () => {
  const rng = makeRng(42);
  const T = randomTransform(rng);
  assert.equal(T.digitMap.length, 10);
  assert.equal(T.digitMap[0], 0);
  const digitsUsed = new Set(Array.from(T.digitMap).slice(1));
  assert.equal(digitsUsed.size, 9);
  for (let d = 1; d <= 9; d++) assert.ok(digitsUsed.has(d));

  assert.equal(T.rowPerm.length, 9);
  assert.equal(T.colPerm.length, 9);
  assert.equal(new Set(Array.from(T.rowPerm)).size, 9);
  assert.equal(new Set(Array.from(T.colPerm)).size, 9);
  assert.equal(typeof T.transpose, 'boolean');
});

test('applyTransform() with identity T returns an equal (copied) grid', () => {
  const identity = {
    digitMap: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    rowPerm: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
    colPerm: Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
    transpose: false,
  };
  const c = toDigits(SOLVED_GRID);
  const out = applyTransform(c, identity);
  assert.deepEqual(Array.from(out), Array.from(c));
  assert.notEqual(out, c, 'must return a new array, not the same reference');
});

test('applyTransform() preserves sudoku validity for a random T on a solved grid', () => {
  const rng = makeRng(7);
  const T = randomTransform(rng);
  const c = toDigits(SOLVED_GRID);
  const out = applyTransform(c, T);
  assert.equal(out.length, 81);
  const flags = conflicts(out);
  assert.ok(flags.every((f) => f === 0), 'transformed full grid must remain conflict-free');
  assert.ok(isSolved(out));
});

test('getPuzzle() returns a Board with all-zero values and consistent givens/solution', () => {
  const solution = SOLVED_GRID;
  const givens = SOLVED_GRID.split('').map((d, i) => (i % 3 === 0 ? d : '0')).join('');
  const pool = [{ givens, solution }];
  const rng = makeRng(99);
  const board = getPuzzle(pool, rng);
  assert.equal(board.givens.length, 81);
  assert.equal(board.solution.length, 81);
  assert.equal(board.values.length, 81);
  assert.ok(board.values.every((v) => v === 0));
  assert.equal(board.selected, 0);
  for (let i = 0; i < 81; i++) {
    if (board.givens[i] !== 0) {
      assert.equal(board.givens[i], board.solution[i], `given at ${i} must match solution`);
    }
  }
});

test('getPuzzle() throws a clear error when no pool entry is valid (SEC-4 fail-closed)', () => {
  const pool = [{ givens: 'not-a-valid-81-digit-string', solution: SOLVED_GRID }];
  const rng = makeRng(1);
  assert.throws(() => getPuzzle(pool, rng));
});
