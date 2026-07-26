# 11 — Test Planı: sudoku

- Tarih: 2026-07-26 | Mod: AUTOPILOT | Profil: LITE | Rol: `test-engineer` (orchestrator inline)
- Girdi: `docs/03-requirements.md`, `src/`, `tests/` (Faz 9 birim testleri gerçek DOM/CSS'e karşı henüz doğrulanmamıştı)

## Kapsam

| # | Senaryo | FR/NFR | Katman | Durum |
|---|---------|--------|--------|-------|
| T1 | index.html: #board altında tam 81 `[data-index]` hücre, tekil 0..80, `role="gridcell"` | FR-1 | Sözleşme (yeni) | ✅ |
| T2 | index.html: script yükleme sırası (core→puzzles→render→app) mimariye uyuyor | FR-1..5 | Sözleşme (yeni) | ✅ |
| T3 | index.html: `#board`/`#status`/`#new-game` id'leri render.js/app.js'in beklediğiyle eşleşiyor | FR-1,4,5 | Sözleşme (yeni) | ✅ |
| T4 | styles.css: render.js'in `classList.toggle` ettiği `.given`/`.selected`/`.conflict` tanımlı | FR-1,3 | Sözleşme (yeni) | ✅ |
| T5 | styles.css: harici ağ kaynağı yok (saf istemci) | NFR-3, SEC-11 | Sözleşme (yeni) | ✅ |
| T6 | FR-1..5 + NFR-1/2 (Faz 9'dan devralınan 43 birim/entegrasyon testi) | tümü | Birim/entegrasyon (mevcut) | ✅ |

- Kapsam dışı (bilinçli): Gerçek tarayıcı E2E (Playwright/Puppeteer) — sıfır-bağımlılık mimari ilkesi (DL-04/05) nedeniyle eklenmedi; sözleşme testleri (T1-T5) gerçek dosya içeriğini okuyarak aynı kör noktayı (Faz 9 birim testleri sahte DOM üzerinde çalışıyordu) statik olarak kapatır. Gerçek tarayıcı sürüşü kullanıcı tarafından manuel yapılabilir (`README.md`).

## Yöntem
Faz 9 testleri sahte (`FakeElement`) DOM üzerinde çalışıyor — geliştiricinin kendi varsayımlarını doğruluyor, gerçek `index.html`/`styles.css` ile fiili eşleşmeyi değil. `tests/contract.test.js` gerçek dosya metnini okuyup bu sözleşmeyi (hücre sayısı/id'ler/sınıflar/script sırası) doğrudan kontrol eder — jsdom gibi bir bağımlılık eklenmedi.

## Kalite kapısı raporu
- "Kritik senaryolar %100 geçti" → ✅ T1-T6 hepsi geçti (48/48 test yeşil)
