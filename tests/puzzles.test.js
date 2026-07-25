'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { solve, isUnique } = require('./helpers/solver.js');
const pool = require('../src/puzzles.js');

const ROW_PATTERN = /^[0-9]{81}$/;

test('havuzda en az 5 farklı bulmaca var', () => {
  assert.ok(Array.isArray(pool));
  assert.ok(pool.length >= 5, `pool.length=${pool.length}`);
  const givensSet = new Set(pool.map((p) => p.givens));
  assert.equal(givensSet.size, pool.length, 'bulmacalar birbirinden farklı olmalı');
});

test('her havuz satırı 81 haneli geçerli bir şema izler (SEC-4)', () => {
  for (const row of pool) {
    assert.match(row.givens, ROW_PATTERN, `givens: ${row.givens}`);
    assert.match(row.solution, ROW_PATTERN, `solution: ${row.solution}`);
  }
});

test('her havuz satırı tekil-çözümlüdür ve saklanan solution ile eşleşir (NFR-2)', () => {
  for (const row of pool) {
    const cells = Uint8Array.from(row.givens.split('').map(Number));
    assert.ok(isUnique(cells), `givens tekil çözümlü olmalı: ${row.givens}`);
    const solved = solve(cells);
    assert.ok(solved, 'çözüm bulunmalı');
    assert.equal(solved.join(''), row.solution, 'çözüm, saklanan solution ile eşleşmeli');
  }
});

test('her verilen (given) hücre, saklanan solution ile tutarlıdır', () => {
  for (const row of pool) {
    for (let i = 0; i < 81; i++) {
      const g = row.givens[i];
      if (g !== '0') {
        assert.equal(g, row.solution[i], `index ${i} given/solution uyuşmalı`);
      }
    }
  }
});
