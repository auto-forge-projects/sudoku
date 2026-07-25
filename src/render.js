'use strict';

// render.js — view: DOM'a yazan TEK yer. Mantık içermez (bkz. docs/05-architecture.md).
// SEC-1/SEC-2: yalnız textContent + classList + setAttribute/removeAttribute kullanılır;
// innerHTML/outerHTML/insertAdjacentHTML/eval/document.write ASLA kullanılmaz.

// Önceki boyama durumu kök eleman başına saklanır ki her çağrı yalnız DEĞİŞEN
// hücrelere dokunsun (NFR-1). render() dışarıya karşı yine de saf bir "state -> DOM"
// prosedürü gibi davranır — çağıran hiçbir ek state taşımaz.
const prevRenderByRoot = new WeakMap();

function getCellElements(boardEl) {
  const cells = Array.from(boardEl.querySelectorAll('[data-index]'));
  cells.sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));
  return cells;
}

function render(root, board, flags, solved) {
  const boardEl = root.querySelector('#board');
  const statusEl = root.querySelector('#status');
  const cellEls = getCellElements(boardEl);

  const prev = prevRenderByRoot.get(root);
  const values = new Uint8Array(81);
  const given = new Uint8Array(81);
  const conflict = new Uint8Array(81);

  for (let i = 0; i < 81; i++) {
    const el = cellEls[i];
    const isGiven = board.givens[i] !== 0;
    const value = isGiven ? board.givens[i] : board.values[i];
    const isConflict = flags[i] ? 1 : 0;

    values[i] = value;
    given[i] = isGiven ? 1 : 0;
    conflict[i] = isConflict;

    if (!prev || prev.values[i] !== value) {
      el.textContent = value === 0 ? '' : String(value);
    }
    if (!prev || prev.given[i] !== given[i]) {
      el.classList.toggle('given', isGiven);
      if (isGiven) el.setAttribute('aria-readonly', 'true');
      else el.removeAttribute('aria-readonly');
    }
    if (!prev || prev.conflict[i] !== isConflict) {
      el.classList.toggle('conflict', !!isConflict);
      if (isConflict) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    }
  }

  // Roving tabindex (NFR-4): yalnız seçim DEĞİŞTİYSE dokunulur — eski seçili
  // hücreden .selected/tabindex kaldırılır, yeni seçiliye eklenir. İlk boyamada
  // (prev yok) tüm hücreler -1'e, seçili olan 0'a ayarlanır.
  const prevSelected = prev ? prev.selected : -1;
  if (!prev) {
    for (let i = 0; i < 81; i++) {
      const isSelected = i === board.selected;
      cellEls[i].classList.toggle('selected', isSelected);
      cellEls[i].setAttribute('tabindex', isSelected ? '0' : '-1');
    }
  } else if (prevSelected !== board.selected) {
    cellEls[prevSelected].classList.toggle('selected', false);
    cellEls[prevSelected].setAttribute('tabindex', '-1');
    cellEls[board.selected].classList.toggle('selected', true);
    cellEls[board.selected].setAttribute('tabindex', '0');
  }

  if (!prev || prev.solved !== solved) {
    statusEl.textContent = solved ? '🎉 Çözüldü!' : '';
  }

  prevRenderByRoot.set(root, { values, given, conflict, selected: board.selected, solved });
}

const SudokuRender = { render };

if (typeof window !== 'undefined') {
  window.SudokuRender = SudokuRender;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SudokuRender;
}
