'use strict';

// tests/integration.test.js — Entegrasyon + NFR doğrulama (TASK-006).
// Bkz. docs/05-architecture.md NFR-1/NFR-2 satırları + docs/08-plan.md TASK-006 kabul kriteri.

const test = require('node:test');
const assert = require('node:assert/strict');
const SudokuCore = require('../src/sudoku-core.js');
const POOL = require('../src/puzzles.js');
const { solve, isUnique } = require('./helpers/solver.js');

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// NFR-2: 200 rastgele T için solve(applyTransform(givens,T)) === applyTransform(solution,T)
// ve çözüm sayısı = 1 (tekillik korunumu — bkz. mimari NFR-2 satırı).
test('NFR-2: 200 rastgele izomorfizm çözüm korunumunu ve tekilliği bozmaz', () => {
  const rng = makeRng(20260726);
  for (let i = 0; i < 200; i++) {
    const base = POOL[i % POOL.length];
    const givens = Uint8Array.from(base.givens.split('').map(Number));
    const solution = Uint8Array.from(base.solution.split('').map(Number));
    const T = SudokuCore.randomTransform(rng);
    const tGivens = SudokuCore.applyTransform(givens, T);
    const tSolution = SudokuCore.applyTransform(solution, T);

    assert.ok(isUnique(tGivens), `iterasyon ${i}: dönüştürülmüş bulmaca tekil-çözümlü değil`);
    const solved = solve(tGivens);
    assert.ok(solved, `iterasyon ${i}: solver çözüm bulamadı`);
    assert.deepEqual(Array.from(solved), Array.from(tSolution), `iterasyon ${i}: solver sonucu applyTransform(solution,T) ile eşleşmiyor`);
  }
});

// NFR-1: hücre girişinden ihlal vurgusuna ≤200ms. conflicts() bu yolun tek hesaplama
// adımıdır (render DOM'u kurmaz, yalnız diff yazar) — bkz. mimari NFR-1 satırı.
// 10k çağrı bütçesi: tek çağrı payı cömert biçimde ~0.5ms altında kalmalı.
test('NFR-1: conflicts() 10k çağrı performans bütçesi altında', () => {
  const base = POOL[0];
  const cellsArr = Uint8Array.from(base.solution.split('').map(Number));
  cellsArr[0] = 0; // en az bir boş hücre — tipik oyun-içi durumu yansıtır

  const N = 10000;
  const BUDGET_MS = 500; // 10k çağrı için cömert tavan (≈0.05ms/çağrı hedef, NFR-1 200ms'in çok altında)
  const start = process.hrtime.bigint();
  for (let i = 0; i < N; i++) {
    SudokuCore.conflicts(cellsArr);
  }
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;

  assert.ok(elapsedMs < BUDGET_MS, `${N} conflicts() çağrısı ${elapsedMs.toFixed(2)}ms sürdü, bütçe ${BUDGET_MS}ms`);
});
