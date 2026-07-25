'use strict';

// tests/helpers/solver.js — TEST-ONLY backtracking solver.
// SEC-9: bu dosya runtime'a ASLA girmez (index.html yüklemez, src/ içinden require
// edilmez). Yalnız havuzdaki bulmacaların tekil-çözümlü olduğunu doğrulamak için
// Faz 9 testlerinden çağrılır.

function candidateDigits(grid, pos) {
  const r = Math.floor(pos / 9);
  const c = pos % 9;
  const used = new Set();
  for (let k = 0; k < 9; k++) {
    used.add(grid[r * 9 + k]);
    used.add(grid[k * 9 + c]);
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) used.add(grid[(br + dr) * 9 + (bc + dc)]);
  }
  const out = [];
  for (let d = 1; d <= 9; d++) {
    if (!used.has(d)) out.push(d);
  }
  return out;
}

// countSolutions: `cap`'e kadar çözüm sayar (varsayılan 2 — tekillik testi için yeterli,
// erken durur; performans için tam sayım YAPMAZ).
function countSolutions(cellsArr, cap = 2) {
  const grid = Array.from(cellsArr);
  let count = 0;
  function backtrack(pos) {
    if (count >= cap) return;
    if (pos === 81) {
      count++;
      return;
    }
    if (grid[pos] !== 0) {
      backtrack(pos + 1);
      return;
    }
    for (const d of candidateDigits(grid, pos)) {
      grid[pos] = d;
      backtrack(pos + 1);
      if (count >= cap) {
        grid[pos] = 0;
        return;
      }
    }
    grid[pos] = 0;
  }
  backtrack(0);
  return count;
}

// solve: ilk bulunan tam çözümü döner (yoksa null).
function solve(cellsArr) {
  const grid = Array.from(cellsArr);
  let solved = null;
  function backtrack(pos) {
    if (solved) return;
    if (pos === 81) {
      solved = grid.slice();
      return;
    }
    if (grid[pos] !== 0) {
      backtrack(pos + 1);
      return;
    }
    for (const d of candidateDigits(grid, pos)) {
      grid[pos] = d;
      backtrack(pos + 1);
      if (solved) return;
    }
    grid[pos] = 0;
  }
  backtrack(0);
  return solved ? Uint8Array.from(solved) : null;
}

function isUnique(cellsArr) {
  return countSolutions(cellsArr, 2) === 1;
}

module.exports = { solve, countSolutions, isUnique };
