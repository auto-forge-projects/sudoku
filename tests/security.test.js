'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const INDEX_HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// Yalnız FİİLİ kullanım (kod), açıklayıcı yorumlardaki kelime geçişleri değil —
// bu yüzden desenler her zaman bir çağrı/atama sözdizimiyle (`.`, `(`, `new`) eşleşir.
const BANNED = [
  /\.innerHTML\s*=/,
  /\.outerHTML\s*=/,
  /\.insertAdjacentHTML\(/,
  /document\.write\(/,
  /\beval\(/,
  /new Function\(/,
  /setTimeout\(\s*['"]/,
  /\bfetch\(/,
  /new XMLHttpRequest/,
  /new WebSocket/,
  /new EventSource/,
];

function srcFiles() {
  return fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.js')).map((f) => path.join(SRC_DIR, f));
}

test('src/*.js hiçbir yasak DOM/ağ deseni içermez (SEC-1, SEC-2, SEC-11)', () => {
  for (const file of srcFiles()) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of BANNED) {
      assert.ok(!pattern.test(content), `${path.basename(file)} yasak desen içeriyor: ${pattern}`);
    }
  }
});

test('index.html içinde inline on* olay özniteliği yok (SEC-2)', () => {
  assert.ok(!/\son[a-z]+\s*=/i.test(INDEX_HTML), 'inline on* öznitelik bulundu');
});

test('index.html inline <script> bloğu içermez, yalnız src ile yükler (SEC-6)', () => {
  const scriptTags = INDEX_HTML.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const tag of scriptTags) {
    assert.ok(/\ssrc=/i.test(tag), 'inline script bloğu bulundu (src özniteliği yok)');
  }
});

test('index.html CSP meta etiketi içerir (SEC-6)', () => {
  assert.match(INDEX_HTML, /Content-Security-Policy/i);
  assert.match(INDEX_HTML, /script-src 'self'/);
  assert.doesNotMatch(INDEX_HTML, /unsafe-inline/);
});

test('index.html test-only solver helper\'ı yüklemez/referans etmez (SEC-9)', () => {
  assert.doesNotMatch(INDEX_HTML, /solver/i);
});

test('index.html 81 statik gridcell + #status + #new-game içerir (FR-1, FR-4, FR-5)', () => {
  const cellCount = (INDEX_HTML.match(/role="gridcell"/g) || []).length;
  assert.equal(cellCount, 81);
  assert.match(INDEX_HTML, /id="status"[^>]*aria-live="polite"/);
  assert.match(INDEX_HTML, /id="new-game"/);
});
