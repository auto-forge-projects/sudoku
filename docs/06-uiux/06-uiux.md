# 06 — UI/UX: sudoku

- Tarih: 2026-07-25 | Mod: AUTOPILOT | Profil: LITE
- Ürün tipi: web → tek sayfa (statik HTML + vanilla JS, 81 statik DOM hücresi — bkz. `docs/05-architecture.md`)

Girdi: `docs/03-requirements.md` (FR-1..5, NFR-1..4), `docs/05-architecture.md`.

## Yüzey sözleşmesi (tek ekran)
| Öğe | Rol | Etkileşim | İlgili FR/NFR |
|-----|-----|-----------|----------------|
| Başlık `<h1>` "Sudoku" | Sayfa kimliği | — | — |
| Izgara `<div role="grid" id="board">` (81 hücre `role="gridcell"`) | 9x9 tahta, 3x3 kutu ayrımı CSS border ile | Klik/Tab ile seçim, ok tuşlarıyla gezinme | FR-1, NFR-4 |
| Hücre (`.given` / `.selected` / `.conflict`) | Değer gösterimi | `given` salt-okunur; diğerleri 1-9 giriş, Backspace/Delete/0 silme | FR-1, FR-2, FR-3 |
| Durum satırı `<div id="status" aria-live="polite">` | "Çözüldü" bildirimi | Tahta 81/81 dolu + ihlal yoksa görünür | FR-4, NFR-4 |
| "Yeni Oyun" butonu `<button id="new-game">` | Sıfırla | Click/Enter → havuzdan yeni bulmaca | FR-5 |

Yalnız klavye + fare — dokunmatik/çok dokunuşlu jest zorunlu değil (NFR-3 kapsamı dışı, v1 varsayımı).

## Ana akış — uçtan uca (kalite kapısı)
```mermaid
sequenceDiagram
  participant U as Kullanıcı
  participant D as #board (81 hücre)
  participant A as app.js
  participant C as sudoku-core.js
  participant R as render.js

  U->>D: sayfa yüklendi
  A->>C: getPuzzle(pool, rng) → Board
  A->>R: render(board, flags=0, solved=false)
  R->>D: givens .given + değerler yazılır

  U->>D: hücreye klik / Tab ile odakla
  D->>A: selected güncellenir (roving tabindex)
  U->>D: "7" tuşuna bas
  D->>A: keydown(digit)
  A->>C: setValue(board,i,7) → yeni Board (given ise değişmez)
  A->>C: conflicts(cells) / isSolved(cells)
  A->>R: render(board, flags, solved)
  R->>D: yalnız değişen hücreler: .conflict toggle + textContent

  alt kural ihlali
    R->>D: çakışan hücrelere .conflict + aria-invalid="true"
  end
  alt 81/81 dolu ve ihlal yok
    R->>D: #status "Çözüldü" (aria-live duyurur)
  end

  U->>D: "Yeni Oyun" tıkla
  D->>A: click
  A->>C: getPuzzle(pool, rng) → yeni Board (values sıfır, givens korunur)
  A->>R: render(...) → tüm hücreler yenilenir
```
Klavye akışı: `Tab` ile ızgaraya gir (roving `tabindex`, seçili hücre 0) → ok tuşlarıyla `±1`/`±9` hareket (kenarda kırpılır) → `1-9` yaz, `Backspace/Delete/0` sil → `Tab` ile "Yeni Oyun"a ulaş, `Enter`/`Space` ile tetikle (FR-5, NFR-4).

## Çıktı/görsel şablonları
- **Başlangıç durumu:** Izgara dolu/boş karışık render edilir; `given` hücreler koyu arka plan + kalın font, boş hücreler tıklanabilir; `#status` boş.
- **Giriş sırasında:** Seçili hücre `.selected` (belirgin çerçeve); girilen rakam normal fontla anında görünür (NFR-1: ≤200ms).
- **İhlal durumu:** Çakışan TÜM hücreler (girilen + çakıştığı diğerleri) `.conflict` (kırmızı metin/arka plan) + `aria-invalid="true"`; çakışma giderilince aynı karede kalkar.
- **Çözüldü durumu:** `#status` "🎉 Çözüldü!" metni, `aria-live="polite"` ile duyurulur; tahta salt-görsel kalır (giriş engellenmez, FR-4 yalnız bildirim ister).
- **Hata/kenar durumları:** 1-9 dışı tuş → hücre değişmez (sessiz yoksay, hata mesajı yok — FR-2 kabul kriteri); JS devre dışıysa `<noscript>` "Bu oyun JavaScript gerektirir" mesajı gösterilir; tarayıcı desteklemiyorsa (çok eski) ek fallback yok (NFR-3 kapsamı: güncel Chrome/Firefox/Edge).

## Tasarım notları
- **Palet/kontrast:** Beyaz/açık gri tahta, 3x3 kutu ayrımı kalın border; `.given` koyu gri arka plan, `.conflict` kırmızı — metin/arka plan kontrastı ≥4.5:1 hedefi.
- **Boyut:** Bağımlılıksız 4 JS + 1 CSS + 1 HTML dosya, derleme yok (NFR-3).
- **Responsive:** Izgara `aspect-ratio:1`, `max-width` ile ortalanır; ≥360px mobil viewport'ta okunur kalır (dokunmatik giriş v1 kapsamı dışı).
- **Ton:** Minimalist, coinflip/dice-game/calculator ile tutarlı düz-renk arayüz; emoji yalnız "Çözüldü" bildiriminde.

## Kalite kapısı raporu
- "Ana kullanıcı akışları uçtan uca çizildi" → ✅ GEÇTİ — tek ana akış (yükle → seç/gir → ihlal/çözüldü → yeni oyun) Mermaid + metinsel klavye akışıyla uçtan uca verildi; başlangıç/ihlal/çözüldü/hata kenar durumları tanımlandı.
