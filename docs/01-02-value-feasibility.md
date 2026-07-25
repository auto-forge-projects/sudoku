# 01-02 — Değer & Fizibilite (LITE birleşik faz): sudoku

> LITE profil: yarım sayfa hedefi, paydaş analizi yok.

- Tarih: 2026-07-25 | Mod: AUTOPILOT | Profil: LITE

## Değer önerisi
Kurulum gerektirmeyen, tarayıcıda anında açılan bir sudoku oyunu; kullanıcı ek yazılım/hesap olmadan kısa süreli zihinsel eğlence bulur.

## KPI'lar (kalite kapısı: en az 3, ölçülebilir)
1. Sayfa yüklenmesinden ilk hamleye kadar geçen süre ≤ 5 sn (manuel ölçüm, tarayıcı DevTools).
2. Bir bulmacanın baştan sona çözülebilirliği %100 (üretilen/seçilen her bulmaca en az bir geçerli çözüme sahip — otomatik testle doğrulanır).
3. Kural ihlali tespiti gecikmesi ≤ 200ms (hücre girişinden vurgulanmaya kadar, manuel/otomatik ölçüm).

## Fizibilite
- Teknik: Statik HTML/CSS/JS ile tamamen client-side çözülebilir; sunucu/veritabanı gerekmez. ✅
- Ekonomik: Sıfır altyapı maliyeti (statik barındırma yeterli). ✅
- Zaman: LITE MVP kapsamı (tek zorluk, backend yok) 1 günden az geliştirme gerektirir. ✅

## GO / NO-GO önerisi: **GO**
Gerekçe: Teknik risk yok (kanıtlanmış client-side algoritmalarla — kural doğrulama basit satır/sütun/kutu kontrolü), maliyet sıfıra yakın, kapsam net ve küçük. Üç ölçülebilir KPI ile ilerlemek uygun.

## Kalite kapısı raporu
- "En az 3 ölçülebilir KPI" → ✅ (yukarıda 3 KPI, hedef + ölçüm yöntemiyle)
- "GO/NO-GO kararı gerekçeli" → ✅ (GO, teknik/ekonomik/zaman gerekçesiyle)
