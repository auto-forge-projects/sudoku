# 15 — Bakım: sudoku

- Tarih: 2026-07-26 | Mod: AUTOPILOT
- Bu dosya ÜRÜNÜN teknik borcunu izler; fabrikanın eksikleri `AUTOFORGE-FEEDBACK.md`'ye.

## Bilinen sorunlar
- Yok (Blocker/Critical = 0; tüm bulgular Minor seviyesinde — bkz. PR-1.md F1-F3).

## Teknik borç (kalite kapısı: önceliklendirilmiş)
| # | Borç | Kaynak (DL/review bulgusu) | Öncelik (P1/P2/P3) | Not |
|---|------|---------------------------|--------------------|-----|
| TD-1 | `.cell.conflict` yalnız arkaplan/metin rengiyle işaretleniyor — renk körü kullanıcı çakışmayı ayırt edemeyebilir (WCAG 1.4.1) | PR-1.md F3 | P2 | `styles.css`'e ek ikon/kalın kenarlık/`text-decoration` eklenmeli — düşük efor, erişilebilirlik kazancı |
| TD-2 | `Dockerfile`'da explicit `USER` yönergesi yok — nginx master root çalışıyor (worker'lar zaten non-root); savunma-derinliği eksik | PR-1.md F1 | P3 | `nginxinc/nginx-unprivileged` base image'a geçiş değerlendirilebilir |
| TD-3 | `.dockerignore` yok — fiili sızıntı yok (Dockerfile seçici `COPY` kullanıyor) ama süreç uyumu eksik | PR-1.md F2 | P3 | `.git`/`tests/`/`docs/`/`decisions/`/`node_modules/` içeren `.dockerignore` eklenebilir |

## Bağımlılık güncelleme planı
- Sıfır çalışma-zamanı bağımlılık (DL-04-004) — güncellenecek paket yok.
- Runtime: Node.js sürümü (`node --test`, geliştirme/CI'da) — CI workflow'undaki Node sürümü LTS güncellemelerinde elle bump edilir (Dependabot gereksiz, tek satırlık workflow ayarı).

## Bakım ritmi
- P2/P3 borçları birikimli backlog'da tutulur, kullanıcı talebi veya ↺ Yeni İhtiyaç fazında önceliklendirilir; hiçbiri işlevsel/güvenlik blokeri değil.

## Kalite kapısı raporu
- "Teknik borç önceliklendirilmiş" → ✅ (3 borç, hepsi PR-1.md bulgusuna izlenebilir, P2/P3 önceliklendirildi)
