'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { init } = require('../src/app.js');

// Minimal fake DOM (bağımlılıksız) — render.js zaten kendi testinde doğrulandı;
// burada app.js'in olay kablolamasını (keydown/click/roving-tabindex/yeni-oyun)
// test ediyoruz. init() içeride gerçek render()'ı çağırır, biz sonucu fake DOM
// üzerinden okuruz.

class FakeClassList {
  constructor() {
    this._set = new Set();
  }
  add(c) {
    this._set.add(c);
  }
  remove(c) {
    this._set.delete(c);
  }
  toggle(c, force) {
    if (force) this._set.add(c);
    else this._set.delete(c);
    return force;
  }
  contains(c) {
    return this._set.has(c);
  }
}

class FakeElement {
  constructor(index) {
    if (index !== undefined) this.dataset = { index: String(index) };
    this._text = '';
    this.classList = new FakeClassList();
    this._attrs = new Map();
    this._listeners = {};
  }
  get textContent() {
    return this._text;
  }
  set textContent(v) {
    this._text = v;
  }
  setAttribute(k, v) {
    this._attrs.set(k, v);
  }
  removeAttribute(k) {
    this._attrs.delete(k);
  }
  getAttribute(k) {
    return this._attrs.has(k) ? this._attrs.get(k) : null;
  }
  addEventListener(type, cb) {
    this._listeners[type] = cb;
  }
  fire(type, evt) {
    if (this._listeners[type]) this._listeners[type](evt || { preventDefault() {} });
  }
}

class FakeBoardEl extends FakeElement {
  constructor(cells) {
    super();
    this._cells = cells;
  }
  querySelectorAll() {
    return this._cells.slice();
  }
}

function makeFakeRoot() {
  const cells = [];
  for (let i = 0; i < 81; i++) cells.push(new FakeElement(i));
  const boardEl = new FakeBoardEl(cells);
  const statusEl = new FakeElement();
  const newGameBtn = new FakeElement();
  return {
    cells,
    boardEl,
    statusEl,
    newGameBtn,
    querySelector(sel) {
      if (sel === '#board') return boardEl;
      if (sel === '#status') return statusEl;
      if (sel === '#new-game') return newGameBtn;
      return null;
    },
  };
}

// Sabit tek-girişli havuz — testlerin bulmaca içeriğine bağımlı olmaması için
// sonuçları render'dan okuyacağız (transform ne olursa olsun tutarlı davranır).
const POOL = [
  {
    givens: '902805040005009000063000005087601004500070080006098073000013000000000731301000052',
    solution: '912865347475329618863147925287631594539472186146598273754213869628954731391786452',
  },
];

function fixedRng() {
  let calls = 0;
  return () => {
    calls++;
    // basit deterministik dizi — 0 ve 0.4 arası dönerek şekli sabitler
    return (calls * 0.37) % 1;
  };
}

function firstNonGivenIndex(root) {
  for (let i = 0; i < 81; i++) {
    if (!root.cells[i].classList.contains('given')) return i;
  }
  throw new Error('tüm hücreler given görünüyor — test kurulumu bozuk');
}

test('init() bulmacayı yükler ve ilk boyamayı yapar', () => {
  const root = makeFakeRoot();
  init(root, POOL, fixedRng());
  const hasGiven = root.cells.some((c) => c.classList.contains('given'));
  assert.ok(hasGiven, 'en az bir given hücre boyanmış olmalı');
});

test('hücreye tıklama seçimi günceller (roving tabindex)', () => {
  const root = makeFakeRoot();
  init(root, POOL, fixedRng());
  const target = firstNonGivenIndex(root);
  root.cells[target].fire('click');
  assert.ok(root.cells[target].classList.contains('selected'));
  assert.equal(root.cells[target].getAttribute('tabindex'), '0');
});

test('rakam tuşu boş (given olmayan) seçili hücreye yazar', () => {
  const root = makeFakeRoot();
  init(root, POOL, fixedRng());
  const target = firstNonGivenIndex(root);
  root.cells[target].fire('click');
  root.boardEl.fire('keydown', { key: '7', preventDefault() {} });
  assert.equal(root.cells[target].textContent, '7');
});

test('given (salt-okunur) hücreye rakam tuşu yazmaz', () => {
  const root = makeFakeRoot();
  init(root, POOL, fixedRng());
  const givenIndex = root.cells.findIndex((c) => c.classList.contains('given'));
  const originalText = root.cells[givenIndex].textContent;
  root.cells[givenIndex].fire('click');
  root.boardEl.fire('keydown', { key: '3', preventDefault() {} });
  assert.equal(root.cells[givenIndex].textContent, originalText);
});

test('Backspace/Delete/0 seçili hücreyi boşaltır', () => {
  const root = makeFakeRoot();
  init(root, POOL, fixedRng());
  const target = firstNonGivenIndex(root);
  root.cells[target].fire('click');
  root.boardEl.fire('keydown', { key: '5', preventDefault() {} });
  assert.equal(root.cells[target].textContent, '5');
  root.boardEl.fire('keydown', { key: 'Backspace', preventDefault() {} });
  assert.equal(root.cells[target].textContent, '');
});

test('1-9 dışı tuş hücreyi değiştirmez (FR-2)', () => {
  const root = makeFakeRoot();
  init(root, POOL, fixedRng());
  const target = firstNonGivenIndex(root);
  root.cells[target].fire('click');
  root.boardEl.fire('keydown', { key: 'a', preventDefault() {} });
  assert.equal(root.cells[target].textContent, '');
});

test('ok tuşları seçimi ızgara üzerinde hareket ettirir', () => {
  const root = makeFakeRoot();
  init(root, POOL, fixedRng());
  root.cells[0].fire('click');
  root.boardEl.fire('keydown', { key: 'ArrowRight', preventDefault() {} });
  assert.ok(root.cells[1].classList.contains('selected'));
  assert.ok(!root.cells[0].classList.contains('selected'));
  root.boardEl.fire('keydown', { key: 'ArrowDown', preventDefault() {} });
  assert.ok(root.cells[10].classList.contains('selected'));
});

test('"Yeni Oyun" tıklanınca kullanıcı girdileri temizlenir', () => {
  const root = makeFakeRoot();
  init(root, POOL, fixedRng());
  const target = firstNonGivenIndex(root);
  root.cells[target].fire('click');
  root.boardEl.fire('keydown', { key: '9', preventDefault() {} });
  assert.equal(root.cells[target].textContent, '9');

  root.newGameBtn.fire('click');

  for (const cell of root.cells) {
    if (!cell.classList.contains('given')) {
      assert.equal(cell.textContent, '', 'yeni oyunda kullanıcı girdisi olmamalı');
    }
  }
});
