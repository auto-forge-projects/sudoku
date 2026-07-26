# 16 — Retrospektif: AutoForge pipeline'ı (sudoku koşusu)

- Tarih: 2026-07-26 | Mod: AUTOPILOT | Girdi: `AUTOFORGE-FEEDBACK.md` (AF-105, AF-105 ek, AF-107)
- Kapsam: FABRİKA değerlendirilir, ürün değil (sudoku'nun kendi teknik borcu `docs/15-maintenance.md`'de).

## Ne iyi gitti
- **Task-list-driven resume (kural 3c/3d) tam beklendiği gibi çalıştı:** Faz 10 bir önceki oturumda `hung_run` (12dk sessizlik, izin-beklemesi DEĞİL) nedeniyle "FR/NFR izlenebilirlik" adımının ortasında kesilmişti. Doctor `ORPHANED_RUN` bulgusunu doğru yakaladı; iş listesine güvenip diske ucuzca doğrulayarak (test yeniden koşuldu, kod yeniden okundu — pahalı olmayan adımlar) baştan üretim yapılmadan kaldığı yerden tamamlandı.
- **Blind review gerçekten yeni değer kattı:** Faz 10 (bu koşuda, Author≠Reviewer — orchestrator taze bağlamda) mimari-kod drift'i SIFIR buldu (calculator PR-1 F3'ün aksine) ve DOM/CSS sözleşme testinin (`contract.test.js`) zaten proaktif eklenmiş olduğunu doğruladı — calculator PR-1 F4'ün ("DOM adaptörü test edilmiyor") dersi bu projede Faz 11'de ÖNCEDEN uygulanmıştı. Meta-öğrenme döngüsü (bir projenin review bulgusu → sonrakinin task listesine girmesi) somut kanıtla çalışıyor.
- **JOIN kapısı (LITE async_review) doğru işledi:** Faz 10 arka planda sürerken Faz 11/12 akmıştı; Faz 13'e geçmeden önce Faz 10'un Blocker/Critical=0 ile kapandığı doğrulandı — hız kazancı güvenlik/kalite ödünü olmadan elde edildi.

## En önemli öğrenim
Faz 10'un kesintisi bu kez AF-105'in izin-beklemesi paterninden FARKLIYDI — düz bir `hung_run` (bilinmeyen 12dk sessizlik). Bu, mevcut ORPHANED_RUN+task-list resume mekanizmasının izin-beklemesi dışındaki kesinti sınıflarında da (ağ/kilit/bilinmeyen asılma) sorunsuz çalıştığını doğruladı — AF-105'in dar-kapsamlı düzeltmesi (yalnız izin-metni deseni) genel dayanıklılığı tehlikeye atmamış. Ayrı bir gözlem: faz kapanışlarını hızlı art arda yaparken elle `commit-queue --drain` çağırmak, ZATEN arka planda çalışan bir otomatik executor'la yarışıp benign ama gürültülü bir push-çakışma kaydı (`incidents.jsonl`) üretti (AF-107) — sistem kendiliğinden düzeldi ama "dashboard koşuyor mu?" tespiti (`pgrep` adı eşleşmesi) güvenilir değildi.

## Kök-neden temaları (AF kayıtları → temalar)
| Tema | İlgili AF | Özet |
|------|-----------|------|
| İzin-beklemesi dışı kesintiler mevcut mekanizmayla sorunsuz kurtarılıyor | AF-105/AF-105 ek (önceki koşu), bu koşuda DOĞRULANDI | `hung_run` sonrası ORPHANED_RUN + iş listesi resume, izin-beklemesi paterni olmadan da temiz çalıştı |
| "Dashboard koşuyor mu?" tespiti güvenilir değil | AF-107 (bu koşu) | `pgrep -fl dashboard` adı eşleşmesine dayanıyor; arka planda farklı isimli bir executor koşarken elle drain çağrısı gereksiz/riskli oluyor |
| Kuyruk-drain yarışı benign ama gürültülü | AF-107 (bu koşu) | Push çakışması kendiliğinden düzeldi, ama sahte "BAŞARISIZ" kaydı gerçek `UNPUSHED_WORK` sinyalini seyreltebilir |

## Somut süreç iyileştirmeleri (kalite kapısı: ≥1)
### Öneri 1 — Orchestrator talimatına güvenilir "dashboard koşuyor mu?" kontrolü **[P2, önerildi — AF-107'de detaylandırıldı]**
`CLAUDE.md` kural 3 (commit isteği bölümü): "`pgrep`/süreç adına güvenme; `dashboard/runs/active-<proje>.json` işaretinin varlığına bak (AF-045 run-marker) — varsa drain'i ATLA, kuyruk zaten otomatik boşalır." Uygulama yeri: `CLAUDE.md` kural 3 + `.claude/commands/pipeline-continue.md`.

### Öneri 2 — `commit-queue.mjs --drain` idempotent guard **[P3, önerildi — AF-107'de detaylandırıldı]**
Kuyruk kalemi zaten `applied`/işleniyorsa `--drain` no-op geçsin (ikinci push denemesi hiç başlamasın). Uygulama yeri: `scripts/commit-queue.mjs`.

**Seçilen:** Öneri 1 (P2) — kök nedeni (yanlış "koşmuyor" varsayımı) çözüyor; Öneri 2 savunma-derinliği olarak eklenebilir ama tek başına kök nedeni gidermez.

## MASTER-PROMPT / CLAUDE.md / şablon değişiklik önerileri
1. `CLAUDE.md` kural 3 → "dashboard koşuyor mu" kontrolünü run-marker dosyasına dayandır (bkz. Öneri 1).
2. `scripts/commit-queue.mjs` → idempotent drain guard (bkz. Öneri 2).
3. (Uygulanmadı, gelecek oturuma bırakıldı — bu faz kapsamı yalnız GÖZLEM/ÖNERİ üretmek; fabrika kodu değişikliği `/pipeline-improve` + insan onayı akışına aittir.)

## Kalite kapısı raporu
- "En az 1 somut süreç iyileştirmesi" → ✅ GEÇTİ (2 öneri, biri seçildi + gerekçelendirildi; AUTOFORGE-FEEDBACK.md'ye AF-107 olarak zaten işlendi)
