'use strict';

// app.js — controller: olaylar, tek state sahibi (bkz. docs/05-architecture.md).
// Board'ın TEK örneği burada tutulur; core/render'a yalnız pure çağrılar yapılır.

const SudokuCore = typeof module !== 'undefined' ? require('./sudoku-core.js') : window.SudokuCore;
const SudokuRender = typeof module !== 'undefined' ? require('./render.js') : window.SudokuRender;

const ARROW_MOVES = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 };

function init(root, pool, rng) {
  const boardEl = root.querySelector('#board');
  const newGameBtn = root.querySelector('#new-game');
  const cellEls = Array.from(boardEl.querySelectorAll('[data-index]')).sort(
    (a, b) => Number(a.dataset.index) - Number(b.dataset.index)
  );

  let board = SudokuCore.getPuzzle(pool, rng);

  function paint() {
    const cellsView = SudokuCore.cells(board);
    const flags = SudokuCore.conflicts(cellsView);
    const solved = SudokuCore.isSolved(cellsView);
    SudokuRender.render(root, board, flags, solved);
  }

  function selectCell(i) {
    if (!Number.isInteger(i) || i < 0 || i > 80) return;
    board = { givens: board.givens, values: board.values, solution: board.solution, selected: i };
    paint();
  }

  function enterDigit(digit) {
    board = SudokuCore.setValue(board, board.selected, digit);
    paint();
  }

  function moveSelection(key) {
    const cur = board.selected;
    const r = Math.floor(cur / 9);
    const c = cur % 9;
    let next = cur;
    if (key === 'ArrowLeft' && c > 0) next = cur - 1;
    else if (key === 'ArrowRight' && c < 8) next = cur + 1;
    else if (key === 'ArrowUp' && r > 0) next = cur - 9;
    else if (key === 'ArrowDown' && r < 8) next = cur + 9;
    selectCell(next);
  }

  function onKeydown(e) {
    const key = e.key;
    if (key >= '1' && key <= '9') {
      enterDigit(Number(key));
      e.preventDefault();
      return;
    }
    if (key === 'Backspace' || key === 'Delete' || key === '0') {
      enterDigit(0);
      e.preventDefault();
      return;
    }
    if (key in ARROW_MOVES) {
      moveSelection(key);
      e.preventDefault();
      return;
    }
    // 1-9/Backspace/Delete/0/ok tuşları dışında: sessiz yoksay (FR-2 kabul kriteri).
  }

  cellEls.forEach((el, i) => {
    el.addEventListener('click', () => selectCell(i));
  });
  boardEl.addEventListener('keydown', onKeydown);

  newGameBtn.addEventListener('click', () => {
    board = SudokuCore.getPuzzle(pool, rng);
    paint();
  });

  paint();
}

const SudokuApp = { init };

if (typeof window !== 'undefined') {
  window.SudokuApp = SudokuApp;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SudokuApp;
}
