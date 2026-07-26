# 11 — Test Sonuç Raporu: sudoku

- Tarih: 2026-07-26 | Koşum: `npm test` (Node --test) + `npm run test:coverage`

## Sonuç
| Metrik | Değer |
|--------|-------|
| Geçti | 48 |
| Kaldı | **0** |
| Toplam | 48 |
| Satır coverage (tümü) | %97,91 |
| `src/` satır coverage | %94,62 – %98,85 (dosya başına, hepsi ≥%70 gate eşiğinin üzerinde) |

## Eklenen kapsam (Faz 9'un kör noktası kapatıldı)
`tests/contract.test.js` (T1-T5, `docs/11-test/test-plan.md`): Faz 9 birim testleri sahte DOM
üzerinde çalışıyordu (geliştiricinin varsayımı = test'in varsayımı). Bu dosya gerçek
`index.html`/`styles.css` içeriğini okuyup hücre sayısı/id/sınıf/script-sırası sözleşmesini
doğrudan doğrular — hiçbir bulgu çıkmadı (kod zaten tutarlıydı), ama regresyona karşı kalıcı bir
kilit eklendi.

## Kalan (bilinçli, kapsam dışı)
Gerçek tarayıcı E2E (Playwright/Puppeteer) eklenmedi — sıfır-bağımlılık mimari ilkesi (DL-04/05)
korunuyor. Statik sözleşme testleri aynı riski (index.html/JS ayrışması) bağımlılıksız kapatıyor.

## Kalite kapısı raporu
- "Kritik senaryolar %100" → ✅ (test-plan.md T1-T6 hepsi geçti)
- "npm test gerçek koşum" → ✅ 48/48 pass (mechanical kapı tarafından ayrıca doğrulanır)
