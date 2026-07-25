# 00 — Fikir (Intake): sudoku

- Tarih: 2026-07-25 | Mod: AUTOPILOT | Profil: LITE

## Problem (tek cümle)
Solo kullanıcının tarayıcıda kısa süreli oynayabileceği basit bir sudoku bulmacası yok.

## Çözüm fikri
Tek sayfalık, backend'siz bir web uygulaması: 9x9 sudoku tahtası, sayı girişi, anlık kural-ihlali vurgusu ve tamamlama bildirimi.

## Hedef kitle
Kendi eğlencesi için kısa süreli sudoku oynamak isteyen tek bir kullanıcı (solo, casual).

## Başarı kriterleri
1. Kullanıcı 9x9 tahtada boş hücrelere sayı girip bulmacayı baştan sona çözebilir.
2. Kural ihlali (satır/sütun/3x3 kutuda tekrar eden sayı) anında görsel olarak işaretlenir.
3. Bulmaca doğru tamamlandığında "Çözüldü" bildirimi görünür.

## Kapsam dışı (v1)
- Kullanıcı hesabı, skor tablosu, çoklu oyunculu mod.
- Zorluk seviyesi seçimi (v1'de sabit/tek seviye).
- Mobil native uygulama.

## Kalite kapısı raporu
- "Problem tek cümlede ifade edilebiliyor" → ✅ GEÇTİ (yukarıdaki tek cümle problem tanımı yeterli).
