# 14 — Monitoring: sudoku

- Tarih: 2026-07-26 | Mod: AUTOPILOT | Profil: LITE (basit health check + hata görünürlüğü)

## Ürün tipine göre izleme (web)

| Tip | İzlenecekler |
|-----|--------------|
| Web | `/health` endpoint (nginx statik servis), istemci-taraflı JS hataları, statik dosya sunum hataları (404/5xx) |

LITE profil asgari kapsam: health check + hata görünürlüğü. Kod-içi analytics/APM eklenmedi (sıfır bağımlılık, durumsuz mimariyle tutarlı — docs/05-architecture.md, DL-04-004).

## Health check
| Kontrol | Sağlıklı | Sorunlu davranış |
|---------|----------|-------------------|
| `GET /health` (nginx, `deploy/nginx.conf:6-8`) | `200 OK` (statik `"ok\n"` yanıtı) | Bağlantı reddi / 5xx → container ayakta değil veya nginx config bozuk |
| `GET /` (index.html) | `200 OK`, `Content-Type: text/html` | 404 → yanlış statik kök yolu; 5xx → nginx config hatası |
| Tarayıcı konsolu (manuel/gözlem) | Hata yok | `Uncaught TypeError` → beklenmeyen DOM eksikliği (`#board`/`#status`/`#new-game` seçicilerinden biri yoksa `app.js:12-20` null-check olmadan patlar — bkz. docs/15-maintenance.md TD) |

## Hata görünürlüğü / loglama
- **Sunucu tarafı:** nginx erişim/hata logları (container stdout/stderr — `docker logs`); Docker/SSH-deploy zaten stdout'u toplar, ek log altyapısı gerekmiyor (statik dosya servisi, uygulama sunucusu/backend yok).
- **İstemci tarafı:** Kural ihlali/tamamlama durumları `#status[aria-live]` ile kullanıcıya gösterilir; ayrıca `console.log/debug` üretim kodunda YOK (SEC-10, Faz 10'da doğrulandı). Üçüncü-taraf hata toplama (Sentry vb.) CSP (`connect-src 'none'`) tarafından zaten engelleniyor ve sıfır-bağımlılık ilkesiyle çelişirdi.
- **Hassas veri loglanmaz:** Kullanıcı girdisi yalnız hücre/sayı seçimi (kimlik, PII, sır yok); nginx erişim logu yalnız istek yolu+durum kodu tutar.

## Kritik akış izleme (kalite kapısı)
- **En kritik risk:** Statik dosya servisinin (container) ayakta kalmaması → tüm ürün erişilemez olur (tek risk yüzeyi, sunucu-taraflı iş mantığı yok).
- **Görünürlük/alert mekanizması:** `deploy-image.yml` + `remote-deploy.sh` sonrası `/health` **canlı probe** edilir (kural 9, bitiş otomasyonu) ve sonucu `state.deploy` alanına yazılır; dashboard 🔴/🟢 rozetiyle gösterir. Sürekli uptime ping bu ölçekte (LITE, tek statik container) kapsam dışı — deploy-anı probe + manuel `docker logs` yeterli kabul edildi.
- **İkincil risk:** `.conflict` görsel işareti yalnız renkle ayrışıyor (Faz 10 F3) — sessiz kullanıcı-deneyimi kaybı, sunucuya rapor edilmeyen bir hata değil; alert kapsamı dışında, bakım borcunda.

## Kalite kapısı raporu
- "Kritik akışlar için alert/hata görünürlüğü tanımlı" → ✅ (health probe + deploy-anı doğrulama + nginx log; tip=web beklentisi: health/hata/log karşılandı)
