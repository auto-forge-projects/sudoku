'use strict';

// tests/contract.test.js — Faz 11: index.html/styles.css ↔ src/*.js sözleşme testi.
// Faz 9 birim testleri (app.test.js/render.test.js) FAKE DOM üzerinde çalışır ve
// geliştiricinin KENDİ varsayımlarını doğrular; gerçek index.html/styles.css'in bu
// varsayımlarla fiilen eşleştiğini hiçbir test kontrol etmiyordu (kör nokta —
// bkz. calculator projesi Faz 10 F4 bulgusu, aynı desen). Bu dosya GERÇEK dosya
// içeriğini okuyup render.js/app.js'in kullandığı seçici/sınıf sözleşmesine karşı
// doğrular; jsdom gibi bir bağımlılık eklemez (sıfır-bağımlılık ilkesi).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');

test('index.html: #board altında tam 81 hücre, data-index 0..80 tekil ve tam', () => {
  const cellTags = HTML.match(/<div class="cell"[^>]*>/g) || [];
  assert.equal(cellTags.length, 81, `81 bekleniyordu, ${cellTags.length} bulundu`);

  const seen = new Set();
  for (const tag of cellTags) {
    assert.match(tag, /role="gridcell"/, `gridcell rolü eksik: ${tag}`);
    const m = /data-index="(\d+)"/.exec(tag);
    assert.ok(m, `data-index eksik: ${tag}`);
    seen.add(Number(m[1]));
  }
  for (let i = 0; i < 81; i++) assert.ok(seen.has(i), `data-index=${i} yok`);
  assert.equal(seen.size, 81);
});

test('index.html: script yükleme sırası bağımlılık grafına uyar (core→puzzles→render→app)', () => {
  const srcs = Array.from(HTML.matchAll(/<script\s+src="([^"]+)"/g)).map((m) => m[1]);
  assert.deepEqual(srcs, ['src/sudoku-core.js', 'src/puzzles.js', 'src/render.js', 'src/app.js']);
});

test('index.html: #board id\'si render.js/app.js\'in beklediği kök öğeleri taşır', () => {
  assert.match(HTML, /id="board"/);
  assert.match(HTML, /id="status"/);
  assert.match(HTML, /id="new-game"/);
});

test('styles.css: render.js\'in classList.toggle ettiği tüm sınıflar (.given/.selected/.conflict) tanımlı', () => {
  assert.match(CSS, /\.cell\.given/);
  assert.match(CSS, /\.cell\.selected/);
  assert.match(CSS, /\.cell\.conflict/);
});

test('styles.css: harici ağ kaynağı (url(http...)) içermez (SEC-11, NFR-3 saf istemci)', () => {
  assert.doesNotMatch(CSS, /url\(\s*['"]?https?:/i);
});
