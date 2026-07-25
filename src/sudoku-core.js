'use strict';

// sudoku-core.js — saf mantık (DOM'suz). Bkz. docs/05-architecture.md "Public arayüzler".
// Güvenlik notu (SEC-5): Math.random()/rng yalnız bulmaca seçimi ve izomorfizmi için
// kullanılır; hiçbir güvenlik/kimlik kararında rastgelelik KULLANILMAZ.

const POOL_ROW_PATTERN = /^[0-9]{81}$/;

// 27 grup (9 satır + 9 sütun + 9 kutu), modül yüklenirken bir kez hesaplanır.
const GROUPS = buildGroups();

function buildGroups() {
  const groups = [];
  for (let r = 0; r < 9; r++) {
    const g = [];
    for (let c = 0; c < 9; c++) g.push(r * 9 + c);
    groups.push(g);
  }
  for (let c = 0; c < 9; c++) {
    const g = [];
    for (let r = 0; r < 9; r++) g.push(r * 9 + c);
    groups.push(g);
  }
  for (let b = 0; b < 9; b++) {
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    const g = [];
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) g.push((br + dr) * 9 + (bc + dc));
    }
    groups.push(g);
  }
  return groups;
}

function cells(board) {
  const out = new Uint8Array(81);
  for (let i = 0; i < 81; i++) out[i] = board.givens[i] || board.values[i];
  return out;
}

function conflicts(cellsArr) {
  const flags = new Uint8Array(81);
  for (const group of GROUPS) {
    const firstSeenAt = new Map(); // digit -> ilk görüldüğü index
    for (const idx of group) {
      const v = cellsArr[idx];
      if (v === 0) continue;
      if (firstSeenAt.has(v)) {
        flags[idx] = 1;
        flags[firstSeenAt.get(v)] = 1;
      } else {
        firstSeenAt.set(v, idx);
      }
    }
  }
  return flags;
}

function isSolved(cellsArr) {
  for (let i = 0; i < 81; i++) {
    if (cellsArr[i] === 0) return false;
  }
  const flags = conflicts(cellsArr);
  for (let i = 0; i < 81; i++) {
    if (flags[i]) return false;
  }
  return true;
}

function setValue(board, i, digit) {
  if (!Number.isInteger(i) || i < 0 || i > 80) return board;
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) return board;
  if (board.givens[i] !== 0) return board; // salt-okunur ipucu hücresi (FR-1)
  if (board.values[i] === digit) return board;
  const values = board.values.slice();
  values[i] = digit;
  return { givens: board.givens, values, solution: board.solution, selected: board.selected };
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

// Band-koruyan satır/sütun permütasyonu: 3 bandı (blok) rastgele sırala, her bandın
// içindeki 3 satırı/sütunu rastgele sırala. Bu, kutu (3x3) yapısını bozmayan tek
// permütasyon ailesidir (bkz. docs/05-architecture.md NFR-2 satırı).
function bandPreservingPermutation(rng) {
  const bands = shuffle([0, 1, 2], rng);
  const perm = new Uint8Array(9);
  let pos = 0;
  for (const band of bands) {
    const rowsInBand = shuffle([0, 1, 2], rng);
    for (const r of rowsInBand) {
      perm[pos] = band * 3 + r;
      pos++;
    }
  }
  return perm;
}

function randomTransform(rng) {
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  const digitMap = Uint8Array.from([0, ...digits]);
  const rowPerm = bandPreservingPermutation(rng);
  const colPerm = bandPreservingPermutation(rng);
  const transpose = rng() < 0.5;
  return { digitMap, rowPerm, colPerm, transpose };
}

function applyTransform(cellsArr, T) {
  const out = new Uint8Array(81);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      let sr = T.transpose ? c : r;
      let sc = T.transpose ? r : c;
      sr = T.rowPerm[sr];
      sc = T.colPerm[sc];
      out[r * 9 + c] = T.digitMap[cellsArr[sr * 9 + sc]];
    }
  }
  return out;
}

function parsePoolRow(row) {
  if (!POOL_ROW_PATTERN.test(row.givens) || !POOL_ROW_PATTERN.test(row.solution)) return null;
  return {
    givens: Uint8Array.from(row.givens.split('').map(Number)),
    solution: Uint8Array.from(row.solution.split('').map(Number)),
  };
}

// getPuzzle: havuzdan geçerli bir satır seçer (SEC-4 fail-closed: şema ihlali eden
// satırlar elenir) ve randomTransform ile izomorfik bir varyant üretir.
function getPuzzle(pool, rng) {
  const valid = [];
  for (const row of pool) {
    const parsed = parsePoolRow(row);
    if (parsed) valid.push(parsed);
  }
  if (valid.length === 0) {
    throw new Error('getPuzzle: havuzda geçerli (81 haneli) bulmaca yok');
  }
  const idx = Math.min(valid.length - 1, Math.floor(rng() * valid.length));
  const chosen = valid[idx];
  const T = randomTransform(rng);
  const givens = applyTransform(chosen.givens, T);
  const solution = applyTransform(chosen.solution, T);
  return { givens, values: new Uint8Array(81), solution, selected: 0 };
}

const SudokuCore = {
  getPuzzle,
  randomTransform,
  applyTransform,
  setValue,
  cells,
  conflicts,
  isSolved,
};

if (typeof window !== 'undefined') {
  window.SudokuCore = SudokuCore;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SudokuCore;
}
