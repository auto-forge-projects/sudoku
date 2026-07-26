# sudoku v0.1.0 — Release Notes

- Tarih: 2026-07-26 | SemVer: **v0.1.0** (0.x = API garanti yok) | Mod: AUTOPILOT
> Sürüm, Faz 8 planındaki tek milestone M1 (Oynanabilir MVP) ile tutarlı: FR-1..FR-5 eksiksiz.

## Öne çıkanlar
- İstemci-taraflı, sıfır bağımlılık, tek sayfa sudoku oyunu (statik `index.html`+4 JS modülü+`styles.css`).
- Havuz+izomorfizm tasarımı: 5 doğrulanmış tekil-çözümlü bulmaca, her yüklemede geçerlilik-koruyan rastgele dönüşüm (rakam relabel + bant-koruyan satır/sütun permütasyonu + transpoze) ile çeşitlendirilir.
- Klavye ile tam erişilebilirlik: roving tabindex + ok tuşu navigasyonu, `aria-live`/`aria-readonly`/`aria-invalid`.

## Özellikler
- FR-1: 9x9 tahta + 3x3 kutu ayrımı; başlangıç ipuçları salt-okunur.
- FR-2: Hücreye 1-9 girişi; Backspace/Delete/0 ile boşaltma.
- FR-3: Satır/sütun/kutu kural ihlali anlık (≤200ms) görsel vurgu; giderilince kalkar.
- FR-4: Tüm hücreler dolu ve ihlalsizse "🎉 Çözüldü!" bildirimi.
- FR-5: "Yeni Oyun" — girdiler temizlenir, havuzdan yeni bir bulmaca yüklenir.

## Güvenlik
- OWASP Top 10 değerlendirildi (`docs/07-security.md`); SEC-1..SEC-5, SEC-7, SEC-9..SEC-11 Faz 10 code review'unda kodda bağımsız doğrulandı (grep kanıtı: `innerHTML`/`eval`/`fetch`/`XMLHttpRequest` repoda yok; CSP meta docs/07 metniyle birebir; test-only solver runtime'a girmiyor).
- SEC-8 (non-root, dizin listeleme kapalı): Faz 12 `Dockerfile` (nginx:alpine) + `deploy/nginx.conf` ile karşılandı; iki Minor iyileştirme (`USER` yönergesi, `.dockerignore`) Faz 15 borcuna kaydedildi (`DL-10-001`).

## Test
- 48/48 birim/entegrasyon/property/güvenlik/sözleşme testi yeşil (`npm test`); satır kapsamı %97.91 (tüm modüller ≥%94.6).
- Faz 11 sonuçları: `docs/11-test/results.md`.

## Bilinen sınırlar (docs/15-maintenance.md referanslı)
- `.conflict` görsel işareti yalnız renkle ayırt ediliyor (WCAG 1.4.1 — Faz 10 F3).
- Dockerfile'da explicit `USER` yok, `.dockerignore` yok (Faz 10 F1/F2 — fiili risk düşük, savunma-derinliği notu).

## Kurulum
```bash
git clone <repo> && cd sudoku
# Statik dosya sunucusu ile aç, örn:
npx serve .     # veya Docker: docker build -t sudoku . && docker run -p 3000:3000 sudoku
```

## Rollback planı (kalite kapısı)
1. **Kod:** İlk sürüm (v0.1.0) — geri alınacak önceki sürüm yok; gerekirse `git revert` ile Faz 9 commit zincirine (`7e71f3d..742b1db`) dönülebilir, statik dosya olduğundan anlık etkilidir.
2. **Veri uyumluluğu:** Durumsuz (kalıcı depolama/backend yok) — rollback veri kaybı yaratmaz, oyun durumu yalnız tarayıcı belleğinde geçicidir.
3. **Doğrulama:** Rollback sonrası `npm test` (48/48 yeşil beklenir) + `/health` endpoint (nginx statik servis) 200 dönmeli.
4. **Dağıtım:** Docker imajı `ghcr.io/auto-forge-projects/sudoku:<önceki-sha>` tag'ine geri alınır (`deploy-image.yml` immutable SHA tag üretir); SSH-push deploy script'i (`deploy/remote-deploy.sh`) önceki tag ile yeniden çalıştırılır.

## Kalite kapısı raporu
- "Rollback prosedürü tanımlı" → ✅ (yukarıdaki 4 adım: kod/veri/doğrulama/dağıtım)
- "Sürüm plana uygun" → ✅ (Faz 8 tek milestone M1, FR-1..FR-5 eksiksiz)
