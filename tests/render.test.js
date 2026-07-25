'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { render } = require('../src/render.js');

// Minimal fake DOM — bağımlılık eklemeden (jsdom yok) render.js'in diff davranışını
// test etmek için. Her yazma operasyonu sayılır ki "yalnız değişen hücrelerde
// classList.toggle/textContent" iddiası (TASK-003 kabul kriteri) doğrulanabilsin.

class FakeClassList {
  constructor(cell) {
    this._set = new Set();
    this._cell = cell;
  }
  add(c) {
    this._cell.classListWrites++;
    this._set.add(c);
  }
  remove(c) {
    this._cell.classListWrites++;
    this._set.delete(c);
  }
  toggle(c, force) {
    this._cell.classListWrites++;
    if (force) this._set.add(c);
    else this._set.delete(c);
    return force;
  }
  contains(c) {
    return this._set.has(c);
  }
}

class FakeCell {
  constructor(index) {
    this.dataset = { index: String(index) };
    this._text = '';
    this.classList = new FakeClassList(this);
    this._attrs = new Map();
    this.classListWrites = 0;
    this.textWrites = 0;
    this.attrWrites = 0;
  }
  get textContent() {
    return this._text;
  }
  set textContent(v) {
    this.textWrites++;
    this._text = v;
  }
  setAttribute(k, v) {
    this.attrWrites++;
    this._attrs.set(k, v);
  }
  removeAttribute(k) {
    this.attrWrites++;
    this._attrs.delete(k);
  }
  getAttribute(k) {
    return this._attrs.has(k) ? this._attrs.get(k) : null;
  }
}

class FakeStatus {
  constructor() {
    this._text = '';
    this.textWrites = 0;
  }
  get textContent() {
    return this._text;
  }
  set textContent(v) {
    this.textWrites++;
    this._text = v;
  }
}

function makeFakeRoot() {
  const cells = [];
  for (let i = 0; i < 81; i++) cells.push(new FakeCell(i));
  const status = new FakeStatus();
  const boardEl = { querySelectorAll: () => cells.slice() };
  return {
    cells,
    status,
    querySelector(sel) {
      if (sel === '#board') return boardEl;
      if (sel === '#status') return status;
      return null;
    },
  };
}

function makeBoard() {
  const givens = new Uint8Array(81);
  givens[0] = 5;
  const values = new Uint8Array(81);
  const solution = new Uint8Array(81);
  return { givens, values, solution, selected: 0 };
}

test('render() ilk çağrıda ipuçlarını .given ile, boş hücreleri boş textContent ile işaretler', () => {
  const root = makeFakeRoot();
  const board = makeBoard();
  const flags = new Uint8Array(81);
  render(root, board, flags, false);
  assert.equal(root.cells[0].textContent, '5');
  assert.ok(root.cells[0].classList.contains('given'));
  assert.equal(root.cells[0].getAttribute('aria-readonly'), 'true');
  assert.equal(root.cells[1].textContent, '');
  assert.ok(!root.cells[1].classList.contains('given'));
});

test('render() aynı state ile ikinci çağrıda HİÇBİR hücreye ek yazım yapmaz', () => {
  const root = makeFakeRoot();
  const board = makeBoard();
  const flags = new Uint8Array(81);
  render(root, board, flags, false);
  const before = root.cells.map((c) => c.textWrites + c.classListWrites + c.attrWrites);

  // Aynı mantıksal state, farklı (kopya) referanslarla — gerçek kullanımda her
  // setValue/conflicts çağrısı yeni dizi döner.
  const board2 = { givens: board.givens.slice(), values: board.values.slice(), solution: board.solution.slice(), selected: 0 };
  render(root, board2, flags.slice(), false);
  const after = root.cells.map((c) => c.textWrites + c.classListWrites + c.attrWrites);
  assert.deepEqual(after, before, 'değişmeyen state ikinci render sonrası hiçbir hücreyi tekrar yazmamalı');
});

test('render() yalnız DEĞİŞEN hücrelerde yazım yapar (diğerleri dokunulmaz)', () => {
  const root = makeFakeRoot();
  const board = makeBoard();
  const flags = new Uint8Array(81);
  render(root, board, flags, false);
  const before = root.cells.map((c) => c.textWrites + c.classListWrites + c.attrWrites);

  const board2 = { givens: board.givens.slice(), values: board.values.slice(), solution: board.solution.slice(), selected: 0 };
  board2.values[5] = 7;
  const flags2 = flags.slice();
  flags2[5] = 1;
  flags2[9] = 1; // aynı sütunda çakışan diğer hücre
  render(root, board2, flags2, false);
  const after = root.cells.map((c) => c.textWrites + c.classListWrites + c.attrWrites);

  for (let i = 0; i < 81; i++) {
    if (i === 5 || i === 9) {
      assert.ok(after[i] > before[i], `hücre ${i} güncellenmiş olmalı`);
    } else {
      assert.equal(after[i], before[i], `hücre ${i} DEĞİŞMEMİŞ olmalı (dokunulmadı)`);
    }
  }
  assert.equal(root.cells[5].textContent, '7');
  assert.ok(root.cells[5].classList.contains('conflict'));
  assert.ok(root.cells[9].classList.contains('conflict'));
});

test('render() çözüldüğünde #status metnini günceller, aksi halde boşaltır', () => {
  const root = makeFakeRoot();
  const board = makeBoard();
  const flags = new Uint8Array(81);
  render(root, board, flags, false);
  assert.equal(root.status.textContent, '');
  render(root, board, flags, true);
  assert.match(root.status.textContent, /Çözüldü/);
});

test('render() seçili hücreyi .selected + roving tabindex ile işaretler', () => {
  const root = makeFakeRoot();
  const board = makeBoard();
  board.selected = 3;
  const flags = new Uint8Array(81);
  render(root, board, flags, false);
  assert.ok(root.cells[3].classList.contains('selected'));
  assert.equal(root.cells[3].getAttribute('tabindex'), '0');
  assert.equal(root.cells[0].getAttribute('tabindex'), '-1');
});
