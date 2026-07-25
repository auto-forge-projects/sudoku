# 07 — Güvenlik Tasarımı: sudoku

- Tarih: 2026-07-25 | Mod: AUTOPILOT | Profil: LITE
- Kapsam: %100 istemci-tarafı statik oyun (backend yok, ağ çağrısı yok, kalıcı depolama yok, kullanıcı hesabı yok). Güven sınırı = tarayıcı sekmesi; sunucu yalnız statik dosya dağıtır.

## Varlıklar ve veri sınıflandırma
| Veri | Sınıf | Nerede duruyor | Koruma |
|------|-------|----------------|--------|
| Bulmaca havuzu (`givens`/`solution` string'leri) | Public | `src/puzzles.js` (repo + istemci) | Sır değil; gizlilik hedefi yok. Yükleme sırasında `/^[0-9]{81}$/` ile katı doğrulama |
| Oyuncu girdileri (`values`, `selected`) | Public / geçici | Yalnız sekme belleği (`Board`) | Kalıcılaştırılmaz, gönderilmez, loglanmaz (sayfa yenilenince yok olur) |
| Aktif bulmacanın çözümü (`solution`) | Public (oyun-içi spoiler) | Sekme belleği | Erişim engellenemez (istemci); DOM'a **yazılmaz** — yalnız test/doğrulama referansı |
| Test-only solver | Internal | `tests/helpers/solver.js` | Runtime paketine/`index.html`'e ASLA girmez (sızarsa spoiler + gereksiz saldırı yüzeyi) |
| PII / kimlik / ödeme / telemetri | **Yok** | — | Toplanmaz — veri minimizasyonu tasarım gereği (GDPR/KVKK yüzeyi sıfır) |
| Dağıtım zinciri (repo, GH Actions, imaj) | Confidential (yetkiler) | GitHub + registry | Sır düz metin yazılmaz (`env_ref`), `GITHUB_TOKEN` en az yetki, action sürüm sabitleme |

## Threat model (STRIDE)
| Bileşen | Spoofing | Tampering | Repudiation | Info Disclosure | DoS | Elevation | Önlemler |
|---------|----------|-----------|-------------|-----------------|-----|-----------|----------|
| `index.html` + DOM | N/A (kimlik yok) | **Orta:** enjekte edilen HTML → DOM XSS | N/A (denetim iddiası yok) | Düşük: yalnız public veri | Düşük | **Orta:** XSS = origin'de kod çalıştırma | SEC-1/2 (yalnız `textContent`, `innerHTML`/`eval` yasak), SEC-6 CSP |
| `app.js` (controller) | N/A | Konsol/eklenti ile state değişimi → hile | N/A | — | Sonsuz döngü/ağır olay | Yok (yeni yetki kazanılamaz) | SEC-3 girdi guard'ları; hile **kabul edilen risk** (sunucu skoru yok) |
| `sudoku-core.js` / `puzzles.js` | N/A | Bozuk havuz satırı → geçersiz oyun | N/A | Çözüm bellekte okunabilir | `conflicts()` O(243) sabit | N/A | SEC-4 havuz şema doğrulaması; saf fonksiyonlar, DOM/ağ erişimi yok |
| `render.js` | N/A | **Ana XSS vektörü** (DOM'a yazan tek yer) | N/A | — | Düşük (diff, tam re-render yok) | XSS → origin | SEC-1 `textContent`+`classList` yalnız; whitelist class seti |
| Dağıtım (statik host / Docker / CI) | Sahte imaj/repo push | Yayın öncesi kod değişimi | Commit/deploy izi git+Actions'ta | Kaynak public; sır yok | Host seviyesi | CI yetki aşımı | SEC-7 pinned actions + en az yetki, SEC-8 sertleştirilmiş statik sunum, HTTPS-only |

## Auth / Authz stratejisi
Kimlik doğrulama ve yetkilendirme **uygulanmaz ve gerekmez**: tek kullanıcılı, oturumsuz, sunucu durumu olmayan bir oyun; korunacak hesap/kaynak/çok-kiracılı veri yok. Oturum/çerez/token üretilmez → oturum ele geçirme, CSRF ve yetki yükseltme yüzeyi yapısal olarak yoktur. `givens` hücrelerinin salt-okunur olması bir **oyun kuralı bütünlüğü** kontrolüdür (istemcide zorlanır), güvenlik sınırı değildir. Tek gerçek yetkilendirme alanı repo/CI/deploy tarafındadır (GitHub rolleri + en az yetkili `GITHUB_TOKEN`).

## OWASP Top 10 değerlendirmesi (kalite kapısı: HER madde)
| # | Risk | Uygulanabilir mi | Önlem / Neden uygulanamaz |
|---|------|------------------|----------------------------|
| A01 | Broken Access Control | Kısmen (yalnız dağıtım) | Uygulamada korunan kaynak/rol yok. Repo/CI: en az yetkili token, `contents:read` varsayılan, dizin listeleme kapalı (SEC-8) |
| A02 | Cryptographic Failures | Hayır (N/A) | Şifrelenecek/imzalanacak sır, kimlik veya hassas veri yok. Not: `Math.random()` yalnız bulmaca seçimi/izomorfizmi için — güvenlik amaçlı KULLANILMAZ (SEC-5). Taşımada HTTPS zorunlu |
| A03 | Injection | **Evet — ana risk** | DOM XSS: `render.js` yalnız `textContent`/`classList` kullanır; `innerHTML`/`insertAdjacentHTML`/`eval`/`new Function`/inline `on*` yasak (SEC-1, SEC-2). SQL/OS/LDAP enjeksiyonu N/A (backend, DB, kabuk yok) |
| A04 | Insecure Design | Evet | Tasarımca minimizasyon: sıfır bağımlılık, sıfır ağ çağrısı, sıfır kalıcı veri, sıfır PII. Test-only solver runtime'a girmez (SEC-9). İstemci verisine güvenilmez varsayımı kayıtlı (DL-07-001) |
| A05 | Security Misconfiguration | Evet | CSP + `X-Content-Type-Options: nosniff` + `Referrer-Policy: no-referrer` + `frame-ancestors 'none'` statik sunum katmanında (SEC-6); Docker imajı non-root, salt-okunur içerik, dizin listeleme/kaynak haritası yok (SEC-8) |
| A06 | Vulnerable and Outdated Components | Evet (ama yüzey ~0) | Runtime `dependencies` **boş**, devDependency yok (`node --test`), CDN/3. parti script yok → SRI gereksiz. GH Actions sürümleri sabitlenir; yeni bağımlılık eklemek Faz 10 review kapısına tabidir (SEC-7) |
| A07 | Identification and Authentication Failures | Hayır (N/A) | Kimlik doğrulama, oturum, çerez, parola veya token yok — yapısal olarak yüzey yok (bkz. Auth/Authz) |
| A08 | Software and Data Integrity Failures | Evet | Kod bütünlüğü: pinned actions, imzalı/etiketli imaj (`latest` + SHA), yalnız gözden geçirilmiş commit yayınlanır. Veri bütünlüğü: havuz satırı şema+çözülebilirlik testinden geçmeden yüklenmez (SEC-4); güvensiz deserializasyon yok (JSON.parse dahi kullanılmaz) |
| A09 | Security Logging and Monitoring Failures | Kısmen | Güvenlik olayı üreten sunucu bileşeni yok → uygulama logu yok (kasıtlı: gizlilik). Üretimde `console.*` gürültüsü ve hata detayı sızdırma yasak (SEC-10); izleme Faz 14'te statik host uptime/health seviyesinde |
| A10 | Server-Side Request Forgery (SSRF) | Hayır (N/A) | Sunucu tarafı istek yapan kod yok; istemcide `fetch`/`XHR`/`WebSocket`/uzak `<img>`/`<iframe>` **hiç** kullanılmaz (SEC-11 ile zorlanır) |

## AI tedarik zinciri & fabrika tehditleri
| Tehdit | Uygulanabilir? | Önlem / Neden uygulanamaz |
|--------|----------------|----------------------------|
| Prompt injection | Hayır | Ürün model çağırmaz; kullanıcı girdisi yalnız 1-9/0 tuşları |
| Repository/artefakt prompt poisoning | Evet (fabrika) | Artefaktlar yalnız pipeline ajanlarınca yazılır; Faz 10 blind review + insan denetimi |
| Dependency confusion | Hayır | Hiç paket kurulmuyor (bağımlılık grafiği boş), iç paket adı yok |
| Malicious package scripts (postinstall) | Hayır | `npm install` gerektirmez; `package.json` yalnız `test` script'i taşır (SEC-7) |
| Shell komut güvenliği | Hayır | Ürün kabuk çalıştırmaz; CI'da kullanıcı içeriği komuta interpolasyon YOK |
| Workspace sınırı / path & symlink escape | Evet (fabrika) | Yazımlar `workspace/sudoku` altında; statik sunucu kök-dışı yol çözmez (SEC-8) |
| Secret leakage (log/commit) | Evet | Repoda sır yok ve olmayacak; deploy sırları `env_ref` ile dışarıda; commit'e `.env` girmez (SEC-12) |
| Docker build izolasyonu | Evet | Build-arg ile sır geçirilmez, çok-aşamalı gerekmez (statik dosya kopyası), non-root çalıştırma (SEC-8) |
| Üretilen CI güvenliği | Evet | `pull_request_target`/`workflow_run` + gizemli `curl \| sh` pattern'i yasak; en az yetkili `permissions:` bloğu (SEC-7) |
| MCP/tool izinleri | Hayır (ürün) | Ürün araç yüzeyi yok; fabrika yetkileri Execution Policy'de sınırlı |

## Faz 9'a güvenlik gereksinimleri (developer implementasyon listesi)
- [ ] **SEC-1 (A03):** DOM'a yazan TEK yer `render.js` olacak ve yalnız `textContent` + `classList.add/remove/toggle` kullanacak. Hücre içeriği asla HTML olarak yorumlanmayacak.
- [ ] **SEC-2 (A03):** Kod tabanının hiçbir yerinde `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, `setTimeout("string")` veya inline `on*` HTML özniteliği bulunmayacak. **Test:** kaynak dosyaları tarayıp bu pattern'leri arayan birim testi (`tests/security.test.js`) yeşil olacak.
- [ ] **SEC-3 (A03/A04):** `setValue(board, i, digit)` girdiyi katı doğrulayacak: `Number.isInteger(i) && 0 <= i <= 80` ve `digit ∈ {0..9}`; `givens[i] !== 0` ise değişiklik yok. Geçersiz girdide **istisna atmadan** aynı board döner. **Test:** sınır değerleri (-1, 81, 10, NaN, `undefined`, `"7"`, `__proto__`) board'ı değiştirmiyor.
- [ ] **SEC-4 (A08):** Havuz yükleme `/^[0-9]{81}$/` şema doğrulaması yapacak; ihlal eden satır yüklenmez (fail-closed: bir sonraki geçerli bulmaca veya net hata durumu). **Test:** bozuk satır enjeksiyonu kabul edilmiyor.
- [ ] **SEC-5 (A02):** `Math.random()` yalnız bulmaca seçimi/izomorfizmi için kullanılacak; hiçbir güvenlik/kimlik/token kararında rastgelelik kullanılmayacak (kod yorumunda açıkça belirtilecek).
- [ ] **SEC-6 (A05):** `index.html`'e CSP meta etiketi eklenecek: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'`. Inline script/style kullanılmayacak (CSP'yi `unsafe-inline` ile zayıflatmak yasak). NFR-3 `file://` açılışını bozarsa CSP HTTP başlığına taşınır ve meta kaldırılır — **kararı Faz 10'a not düşülür**.
- [ ] **SEC-7 (A06/A08):** `package.json`'da runtime `dependencies` **boş** kalacak, `devDependencies` eklenmeyecek, `postinstall`/`preinstall` script'i olmayacak. Faz 12 CI'ında action'lar sürüm sabitli + `permissions: contents: read` (yazma yalnız gerektiği job'da).
- [ ] **SEC-8 (A01/A05):** Faz 12 Dockerfile'ı statik dosyaları non-root kullanıcıyla sunacak; dizin listeleme kapalı, kaynak haritası/`.git`/`tests/` imaja kopyalanmayacak (`.dockerignore`).
- [ ] **SEC-9 (A04):** `tests/helpers/solver.js` runtime'a girmeyecek: `index.html` onu yüklemeyecek, `src/` içinden `require`/referans edilmeyecek. **Test:** `index.html` içeriğinde `solver` geçmiyor.
- [ ] **SEC-10 (A09):** Üretim kodunda `console.log/debug` bırakılmayacak; kullanıcıya gösterilen hata mesajları yığın izi/dosya yolu içermeyecek.
- [ ] **SEC-11 (A10):** Kodda `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, uzak `<script>/<img>/<iframe>` **bulunmayacak** (SEC-2 tarama testine bu pattern'ler dahil edilir) — sıfır ağ yüzeyi kanıtlanabilir olacak.
- [ ] **SEC-12 (Secret leakage):** Repoya sır/kimlik bilgisi commit edilmeyecek; `.gitignore` `.env*` içerecek; `deploy.json`'da düz sır yerine `env_ref` kullanılacak.

## Kalite kapısı raporu
- "OWASP Top 10 değerlendirildi" → ✅ A01–A10'un **onu da** ayrı satırda: uygulanabilir olanlar (A01 kısmi, A03, A04, A05, A06, A08, A09 kısmi) somut önleme, uygulanamayanlar (A02, A07, A10) yapısal gerekçeye bağlandı
- "Hassas veri sınıflandırması eksiksiz" → ✅ 6 varlık sınıflandırıldı; PII/sır **yok** olarak açıkça kayıtlı (veri minimizasyonu)
- "STRIDE tehdit modeli var" → ✅ 5 bileşen × 6 STRIDE kategorisi + önlem eşlemesi
- "Faz 9'a devredilen gereksinimler" → ✅ SEC-1..SEC-12, her biri test edilebilir/doğrulanabilir ifadeyle
- "AI/tedarik zinciri tehditleri" → ✅ 10 satır değerlendirildi
- Decision Log → ✅ DL-07-001 (istemci-tarafı güven sınırı + kabul edilen hile riski)
