# 10 — Code Review: PR-1 (sudoku)

- Tarih: 2026-07-26 | Mod: AUTOPILOT | Profil: LITE | İnceleyen: orchestrator (blind, code-reviewer rolü) — **Author ≠ Reviewer**: Faz 9'u yazan koşumdan bağımsız, yeni bağlamda yalnız kod+sabit checklist okunarak yapıldı.
- İncelenen: `src/sudoku-core.js`, `src/puzzles.js`, `src/render.js`, `src/app.js`, `index.html`, `styles.css`, `Dockerfile`, `deploy/nginx.conf`, tüm `tests/*.js` (diff: Faz 9 + Faz 11/12 commit'leri, `7e71f3d..fbc2c11`)
- Referans: `docs/03-requirements.md`, `docs/05-architecture.md`, `docs/07-security.md`
- Bağımsız denetim notu: `HANDOFF.md`/yazar DL gerekçesi **okunmadı** (LITE'ta zaten yok); bulgular yalnız kod, sabit checklist ve bu koşumun kendi test/grep çıktısından çıktı.

## Yöntem
1. **Bağımsız test koşumu:** `npm test` → **48/48 pass**, 0 fail (Node, `node --test`). `npm run test:coverage` → satır **%97.91** / branch %92.38 / fn %95.33 (tüm `src/*.js` ≥94.6% satır, NFR-2'nin zımni %70 hedefinin üstünde); kapsanmayan satırlar yalnız `module.exports`/`window` ortam-algılama boilerplate'i.
2. **Elle kod okuma:** 4 modül (`sudoku-core.js` saf mantık+izomorfizm, `puzzles.js` 5 satırlık havuz, `render.js` tek DOM-yazıcı, `app.js` controller) + `index.html`/`styles.css`/`Dockerfile`/`deploy/nginx.conf`.
3. **Statik güvenlik taraması (yazarın testine güvenilmedi, bağımsız grep):** `grep -rnE "innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function|fetch\(|XMLHttpRequest|WebSocket|EventSource|console\.(log|debug)" src/ index.html` → tek eşleşme, `render.js:5` açıklayıcı yorum satırı (fiili kullanım yok).
4. **Mimari↔kod çapraz kontrol:** `docs/05-architecture.md` public arayüz imzaları (`getPuzzle/randomTransform/applyTransform/setValue/cells/conflicts/isSolved/render/init`) satır satır koda karşı doğrulandı — **drift yok** (calculator PR-1 F3'ün aksine, bu projede mimari döküman güncel kalmış).
5. **DOM/CSS sözleşme testi kontrolü:** `tests/contract.test.js` gerçek `index.html`/`styles.css`'i statik dosyalardan okuyup script sırası + 81 hücre + `.given/.selected/.conflict` sınıf varlığını doğruluyor — calculator PR-1 F4'ün ("DOM adaptörü test edilmiyor") bu projede **önceden giderilmiş** olduğunu gösteriyor (Faz 11 TASK-011-01).
6. **Dağıtım katmanı incelemesi:** `Dockerfile` (nginx:alpine, selective `COPY`), `deploy/nginx.conf` (port 3000, `autoindex` yok, `/health` endpoint).

## Bulgular
| # | Severity | Dosya:Satır | Bulgu | Aksiyon |
|---|----------|-------------|-------|---------|
| F1 | Minor | `Dockerfile` (tümü) | `USER` yönergesi yok → nginx master süreci root olarak çalışır (resmi `nginx:alpine` imajının standart davranışı; worker süreçleri zaten `nginx` (non-root) kullanıcısıyla çalışır, fiili istek işleme non-root). SEC-8'in "non-root kullanıcıyla sunacak" ifadesi harfiyen karşılanmıyor ama pratikte fiili dosya sunumu zaten non-root worker'larda. | Defence-in-depth: `nginxinc/nginx-unprivileged` base image'a geçiş veya `USER nginx` + port>1024 uyumlu config (savunma derinliği, blocker değil). |
| F2 | Minor | (repo kökü) | `.dockerignore` yok — SEC-8 açıkça bunu istiyor. Fiili risk düşük: `Dockerfile` `COPY . .` değil, yalnız `index.html`/`styles.css`/`src/`/`deploy/nginx.conf`'u seçerek kopyalıyor → `.git`/`tests/` zaten imaja giremiyor. | Süreç uyumu için `.dockerignore` (`.git`, `tests/`, `docs/`, `decisions/`, `node_modules/`) eklenebilir; imaj içeriğini fiilen değiştirmez. |
| F3 | Minor | `styles.css:57-60` | `.cell.conflict` yalnız arkaplan/metin rengiyle (kırmızı tonu) işaretleniyor, ikinci bir görsel ipucu (ikon/desen/kalın kenarlık) yok — WCAG 1.4.1 "yalnız renkle anlam" riski (renk körü kullanıcı çakışmayı ayırt edemeyebilir). FR-3 AC'si "görsel olarak işaretlenir" diyor, spesifik yöntem belirtmiyor. | `.cell.conflict` için ek `border`/ikon veya `text-decoration` eklenebilir (Faz 15 borcu — engelleyici değil). |

**Blocker: 0 · Critical: 0 · Major: 0 · Minor: 3 · Nit: 0**

## İzlenebilirlik (FR ↔ kod)
| FR | Karşılayan modül | Durum |
|----|------------------|-------|
| FR-1 Tahta + bulmaca yükleme | `index.html` 81 statik `role="gridcell"`; `getPuzzle` (sudoku-core.js:142) + `.given`/`aria-readonly` (render.js:41-44); test: `sudoku-core.test.js`, `contract.test.js` | ✅ |
| FR-2 Hücreye giriş | `app.js:50-68` `onKeydown` (1-9/Backspace/Delete/0/ok tuşları, diğerleri sessiz yoksayılır); `setValue` guard (sudoku-core.js:71-79); test: `app.test.js` | ✅ |
| FR-3 Kural ihlali vurgusu | `conflicts()` (sudoku-core.js:42-58, 27 grup) + `.conflict`/`aria-invalid` diff (render.js:46-50); her `paint()`'te yeniden hesaplanır → giderilince vurgu kalkar | ✅ (bkz. F3 — renk-yalnız sunum, engelleyici değil) |
| FR-4 Tamamlama bildirimi | `isSolved()` (sudoku-core.js:60-69) + `#status aria-live="polite"` (render.js:70-71, index.html:96) | ✅ |
| FR-5 Yeni bulmaca | `#new-game` click → `getPuzzle(pool, rng)` + `paint()` (app.js:75-78) | ✅ |
| NFR-1 ≤200ms ihlal tespiti | `conflicts()` = 243 karşılaştırma, saf bellek-içi `Uint8Array`; `render()` yalnız diff yazar; `tests/integration.test.js` 10k conflicts perf bütçesi | ✅ |
| NFR-2 %100 çözülebilirlik | Havuzun her satırı `tests/helpers/solver.js` ile tekil-çözüm doğrulanır; `applyTransform` otomorfizm property test'i (200 rastgele T) | ✅ |
| NFR-3 Tarayıcı uyumu | Sıfır bağımlılık, klasik `<script src>` (ESM değil — `file://` CORS kararı DL-04), `package.json` deps boş | ✅ |
| NFR-4 Erişilebilirlik | Roving tabindex + ok tuşu navigasyonu (`app.js:38-48`, `render.js:53-68`); `role="grid"`/`gridcell`, `aria-live`, `aria-readonly`, `aria-invalid` | ✅ (bkz. F3 — renk-körü kullanıcı için ek ipucu önerisi) |

Eksik/karşılıksız FR yok; tersi yönde gereksinimsiz kod da yok.

## Güvenlik (SEC-*) uygulama kontrolü
- **SEC-1/SEC-2** (yalnız `textContent`+`classList`, yasak DOM/eval deseni yok): ✅ bağımsız grep + `render.js` elle okuma — tek eşleşme yorum satırında.
- **SEC-3** (`setValue` sınır doğrulama, given hücre korunur): ✅ `sudoku-core.js:71-74` (`Number.isInteger` + aralık + given guard).
- **SEC-4** (havuz şema doğrulama, fail-closed): ✅ `parsePoolRow` + `/^[0-9]{81}$/` (sudoku-core.js:132-137,148-150); geçersiz satır elenir, hiç geçerli satır yoksa açık hata.
- **SEC-5** (`Math.random` yalnız oyun mantığı için): ✅ kod yorumu + kullanım yeri (yalnız `randomTransform`/`getPuzzle` çağrı zinciri).
- **SEC-6** (CSP meta, inline yok): ✅ `index.html:6` docs/07 metniyle birebir; inline `<script>`/`on*` yok (grep + `security.test.js` doğrulaması bağımsız tekrarlandı).
- **SEC-7** (boş runtime deps, pinned CI action): ✅ `package.json` deps yok; `ci.yml` `actions/checkout@v4`+`setup-node@v4`, `permissions: contents: read`.
- **SEC-8** (non-root, dizin listeleme kapalı, `.dockerignore`): ⚠️ Kısmi — bkz. F1 (root master, worker non-root) + F2 (`.dockerignore` yok ama seçici `COPY` zaten `.git`/`tests/` sızdırmıyor); `autoindex` nginx.conf'ta yok (varsayılan kapalı) → dizin listeleme kapalı ✅.
- **SEC-9** (solver test-only, runtime dışı): ✅ `index.html` içinde "solver" geçmiyor (grep + `security.test.js`).
- **SEC-10** (console.log/hata detayı yok): ✅ `src/*.js` içinde `console.*` yok.
- **SEC-11** (sıfır ağ yüzeyi): ✅ `fetch`/`XMLHttpRequest`/`WebSocket`/`EventSource` yok; `styles.css` harici `url()` içermiyor (`contract.test.js`).
- **SEC-12** (sır sızıntısı yok): ✅ `.gitignore` kapsamlı değil ama repo taramasında düz sır yok; `deploy.json` yalnız `env_ref`/`secret_names` (GitHub Secrets referansı), düz değer yok.

## Test kalitesi değerlendirmesi
Sayı (%97.91 satır) tek başına yeterli değil — senaryo çeşitliliği güçlü: birim (core/render/app), property-based (200 rastgele izomorfizm), perf bütçesi (10k conflicts), güvenlik deseni taraması, ve **gerçek statik dosya ↔ JS sözleşme testi** (`contract.test.js`) — bu son katman, calculator PR-1'in Major bulgusu (DOM adaptörü kör noktası) türünden regresyonu önceden kapatıyor. Zayıf nokta yok; kapsanmayan satırlar yalnız ortam-algılama boilerplate'i.

## Karar
Kapı **GEÇTİ** (Blocker 0, Critical 0). 3 Minor bulgu (F1 dağıtım savunma-derinliği, F2 `.dockerignore` süreç uyumu, F3 renk-yalnız erişilebilirlik ipucu) LITE eşiği (`threshold: critical`) gereği düzeltme dayatmıyor; hepsi Faz 15 (Bakım) teknik borcuna yönlendirilir.

## Kalite kapısı raporu
- "Blocker/Critical bulgu = 0" → ✅ (Blocker: 0, Critical: 0)
