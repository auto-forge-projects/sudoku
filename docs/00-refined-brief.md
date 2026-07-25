# 00 — Rafine Proje Brief'i: sudoku

- Tarih: 2026-07-25 | Rafine eden model: sonnet | Onay durumu: **Onaylandı** (dashboard, 2026-07-25)

## Ham fikir (kullanıcının girdisi — değiştirilmez)
> basit sudoku oyunu yap

## Rafine problem (tek cümle)
Tek oyunculu, tarayıcıda oynanan basit bir sudoku bulmacası sunmak; kullanıcı 9x9 tahtaya sayı girip bulmacayı çözebilsin.

## Hedef kitle
Kendi eğlencesi için kısa süreli sudoku oynamak isteyen tek bir kullanıcı (solo, casual).

## Kısıtlar & varsayımlar (AF-001 kapanışı)
- Platform/runtime: Web — tek sayfa uygulama (HTML/CSS/JS), backend/sunucu gerekmez.
- Çevrimiçi/çevrimdışı: Tamamen client-side; kalıcı veri gerekmiyorsa yok, gerekirse `localStorage`.
- Zaman/kota bütçesi: LITE — hızlı MVP, süslü özellik yok.
- Varsayımlar: Tek zorluk seviyesi yeterli; bulmaca üretimi basit bir algoritma veya sabit bulmaca havuzundan seçim; çözüm doğrulama kural-bazlı (satır/sütun/3x3 kutu tekrarı yok).

## Başarı kriterleri (ölçülebilir)
1. Kullanıcı 9x9 tahtada boş hücrelere sayı girip bulmacayı baştan sona çözebilir.
2. Kural ihlali (satır/sütun/kutuda tekrar eden sayı) anında görsel olarak işaretlenir.
3. Bulmaca doğru tamamlandığında "Çözüldü" bildirimi görünür.

## Kapsam sınırı (v1'de yapılmayacaklar)
- Kullanıcı hesabı, skor tablosu veya çoklu oyunculu mod yok.
- Zorluk seviyesi seçimi yok (v1'de sabit/tek seviye).
- Mobil native uygulama yok (yalnız web).

## Açık sorular (kullanıcının netleştirmesi önerilen)
- [ ] Bulmacalar sabit bir setten mi seçilsin, yoksa her oyunda algoritmik olarak yeniden üretilsin mi?
- [ ] İlerleme (yarım kalan çözüm) tarayıcıda saklansın mı (`localStorage`), yoksa her ziyarette sıfırdan mı başlasın?
- [ ] "İpucu ver" / hatalı hücreyi vurgulama gibi yardımcı özellik v1'de olsun mu, yoksa v2'ye bırakılsın mı?

## Önerilen profil ve ilk mod
- Profil: **LITE** · Gerekçe: Küçük, tek kişilik, backend'siz bir oyun — Faz 1+2 birleşik, hızlı akış yeterli.

---
## Onay kaydı
- 2026-07-25 — Beklemede
