# 04 — Çözüm Analizi: sudoku

- Tarih: 2026-07-25 | Mod: AUTOPILOT | Profil: LITE

## Karar problemi
Backend'siz, derlemesiz, tek sayfa bir sudoku için 4 bağlayıcı seçim: (D1) bulmaca kaynağı, (D2) durum modeli, (D3) doğrulama+render stratejisi, (D4) kod paketleme. Belirleyiciler: **NFR-2** (%100 çözülebilir bulmaca), **NFR-1** (ihlal vurgusu ≤200ms), **NFR-3** (saf HTML/CSS/JS, derleme yok), **NFR-4** (klavye erişilebilirliği) ve Faz 9 TDD test edilebilirliği.

## D1 — Bulmaca kaynağı
- **A — Sabit havuz.** 10-20 bulmaca + çözümleri JS dizisinde gömülü; "Yeni Oyun" havuzdan seçer (Faz 3 varsayımı).
- **B — Runtime algoritmik üretim.** Backtracking ile tam grid doldur, simetrik delik aç, her delikte solver ile tekil-çözüm doğrula.
- **C — Havuz + geçerlilik-koruyan dönüşüm.** Gömülü havuz, seçimde rastgele izomorfizm uygulanır: rakam yeniden etiketleme (9!), bant permütasyonu (3!×3!), bant-içi satır/sütun permütasyonu (3!⁶), transpoze. Maske de aynı dönüşümü gördüğü için çözüm sayısı (ve tekillik) matematiksel olarak korunur.

| Kriter | A Havuz | B Runtime üretim | C Havuz+dönüşüm |
|--------|---------|------------------|------------------|
| NFR-2 çözülebilirlik | ✅ havuz test-zamanı doğrulanır | ✅ üretim gereği, ama solver hatası riski | ✅ havuz doğrulanır + izomorfizm invaryantı |
| NFR-1 / yükleme gecikmesi | ✅ O(81) | ⚠️ tekillik kontrolü worst-case yüz ms, ana thread bloğu | ✅ O(81) dönüşüm |
| Karmaşıklık (kod + test) | ✅ ~20 satır | ❌ generator+solver+uniqueness ~250 satır | 🟡 ~50 satır saf fonksiyon |
| Çeşitlilik / tekrar oynanabilirlik | ❌ havuz tükenir | ✅ sınırsız | ✅ havuz × ~10¹¹ görünüş |
| Geri alınabilirlik | Yüksek | Orta (test yükü kalır) | **Yüksek** — `getPuzzle()` arkasında |

**Seçim: C.** A'nın maliyeti + B'nin çeşitliliği; B'nin runtime solver riski ve ~250 satırlık yüzeyi LITE bütçesine değmez. Solver **yalnız testte** (havuzun tekil çözümlülüğünü ve dönüşüm invaryantını kanıtlamak için) yaşar, runtime'a girmez.

## D2 — Durum modeli
- **A — DOM-as-state.** `<input>`/hücre metni tek doğruluk kaynağı; doğrulama DOM'dan okur.
- **B — Tek merkezi model.** `givens: Uint8Array(81)` + `values: Uint8Array(81)`; tüm mantık saf fonksiyon, render modelden türetilir (tek yönlü akış).

| Kriter | A DOM-as-state | B Merkezi model |
|--------|----------------|------------------|
| Faz 9 TDD test edilebilirliği | ❌ DOM/jsdom bağımlılığı gerekir (NFR-3 "sıfır bağımlılık" ile çatışır) | ✅ Node'da DOM'suz saf fonksiyon testi |
| NFR-1 performans | ⚠️ senkron DOM okuma → layout thrash riski | ✅ bellek içi, reflow yok |
| Karmaşıklık | 🟡 az kod, ama mantık DOM'a dağılır | ✅ mantık/görünüm ayrımı net |
| Geri alınabilirlik | Düşük (her yer DOM'a bağlanır) | Yüksek (render katmanı değişebilir) |

**Seçim: B.** Belirleyici: sıfır-bağımlılık TDD (jsdom kurmadan `npm test`) ve NFR-1.

## D3 — Doğrulama + render stratejisi
- **A — Tam doğrula + tam re-render.** Her tuşta 81 hücre kontrol edilir, grid `innerHTML` ile yeniden kurulur.
- **B — Artımlı doğrula + hedefli güncelleme.** Yalnız değişen hücrenin 20 peer'i kontrol edilir, yalnız etkilenen hücrelerin class'ı değişir.
- **C — Tam doğrula + hedefli DOM güncelleme.** 81 hücre / 27 grup taranır (~243 karşılaştırma, <1ms), DOM'da sabit 81 element korunur, yalnız class diff'i uygulanır.

| Kriter | A | B | C |
|--------|---|---|---|
| NFR-1 ≤200ms | 🟡 innerHTML 81 düğüm yeniden kurar | ✅ | ✅ hesap <1ms + class toggle |
| NFR-4 klavye | ❌ re-render **odağı kaybettirir**, ok tuşu gezinmesi kırılır | ✅ | ✅ odak korunur |
| Doğruluk riski | ✅ basit | ⚠️ peer-invalidasyonu unutulan kenar durumlar (silme sonrası vurgu kalıntısı) | ✅ tam tarama, kalıntı imkânsız |
| Kod karmaşıklığı | ✅ | ❌ | ✅ |

**Seçim: C.** 9x9'da tam tarama zaten bedava; darboğaz DOM'dur. A'yı eleyen somut sebep NFR-4 (odak kaybı), B'yi eleyen sebep artımlı invalidasyonun hata yüzeyi.

## D4 — Kod paketleme
- **A — ES modules** (`<script type="module">`, `export`).
- **B — Klasik script + çift dışa-aktarım** (`window.SudokuCore = …; typeof module !== 'undefined' && (module.exports = …)`).

| Kriter | A ESM | B Klasik + dual export |
|--------|-------|------------------------|
| `file://` çift tıkla açılış (NFR-3) | ❌ CORS: modül yüklenmez, HTTP sunucu şart | ✅ çalışır |
| Node'dan test importu | ✅ | ✅ (`require`) |
| Derleme/bağımlılık | ✅ yok | ✅ yok |
| Maliyet | — | 🟡 3 satır guard boilerplate |

**Seçim: B.** 3 satır boilerplate karşılığında hem `file://` hem HTTP hem `node --test` çalışır.

## Kalite kapısı raporu
- "En az 2 alternatif karşılaştırıldı" → ✅ (4 karar problemi; D1 3, D2 2, D3 3, D4 2 = **10 alternatif**, her biri 4-5 kriterli trade-off matrisinde satır satır karşılaştırıldı)
- "Seçim gerekçeli" → ✅ (her karar için eleme sebebi NFR'ye bağlandı: D1→NFR-1/2, D2→NFR-1+TDD, D3→NFR-4, D4→NFR-3)
- Decision Log → ✅ DL-04-001..004 (her seçim ayrı DL)
