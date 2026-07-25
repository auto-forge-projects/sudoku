# 03 — Requirement Analizi: sudoku

- Tarih: 2026-07-25 | Mod: AUTOPILOT | Profil: LITE

## Fonksiyonel gereksinimler

### FR-1: Tahtayı görüntüleme ve bulmaca yükleme
- **User story:** Oyuncu olarak, sayfayı açtığımda dolu/boş hücreleriyle bir sudoku bulmacası görmek istiyorum, böylece hemen oynamaya başlayabilirim.
- **Kabul kriterleri:**
  - Given sayfa yüklendi, when tahta render edildi, then 9x9 grid (81 hücre) 3x3 kutu ayrımıyla görünür.
  - Given bulmaca yüklendi, when başlangıç ipuçları (verilen sayılar) gösteriliyor, then bu hücreler düzenlenemez (salt-okunur) olarak işaretlenir.
- **Öncelik:** Must

### FR-2: Hücreye sayı girişi
- **User story:** Oyuncu olarak, boş bir hücreye 1-9 arası sayı girmek istiyorum, böylece bulmacayı adım adım çözebilirim.
- **Kabul kriterleri:**
  - Given boş (salt-okunur olmayan) bir hücre seçili, when 1-9 arası bir tuşa basılır, then hücreye o sayı yazılır.
  - Given bir hücreye sayı girilmiş, when Backspace/Delete veya 0 basılır, then hücre boşaltılır.
  - Given 1-9 dışında bir tuşa basılır, then hücre değişmez.
- **Öncelik:** Must

### FR-3: Kural ihlali vurgusu
- **User story:** Oyuncu olarak, girdiğim sayı satır/sütun/3x3 kutuda tekrar ediyorsa anında uyarılmak istiyorum, böylece hatamı hemen fark edebilirim.
- **Kabul kriterleri:**
  - Given bir hücreye sayı girildi, when aynı sayı aynı satır, sütun veya 3x3 kutuda başka bir hücrede zaten varsa, then çakışan hücreler görsel olarak (ör. kırmızı) işaretlenir.
  - Given çakışma giderildi (sayı değiştirildi/silindi), then vurgu kalkar.
- **Öncelik:** Must

### FR-4: Tamamlama bildirimi
- **User story:** Oyuncu olarak, bulmacayı doğru bitirdiğimde bunu net biçimde görmek istiyorum, böylece başardığımı anlarım.
- **Kabul kriterleri:**
  - Given tüm 81 hücre dolu ve hiçbir satır/sütun/kutuda tekrar yok, then "Çözüldü" bildirimi gösterilir.
  - Given tahta dolu ama en az bir kural ihlali var, then "Çözüldü" bildirimi GÖSTERİLMEZ.
- **Öncelik:** Must

### FR-5: Yeni bulmaca / sıfırlama
- **User story:** Oyuncu olarak, istediğim zaman baştan başlamak istiyorum, böylece yeniden deneyebilirim.
- **Kabul kriterleri:**
  - Given oyun ekranı açık, when "Yeni Oyun" butonuna tıklanır, then kullanıcı girdileri temizlenir ve (sabit havuzdan) bir bulmaca yeniden yüklenir; başlangıç ipuçları korunur.
- **Öncelik:** Should

## Fonksiyonel olmayan gereksinimler (kalite kapısı: ölçülebilir)
| ID | Kategori | Gereksinim | Ölçüt / Hedef |
|----|----------|------------|----------------|
| NFR-1 | Performans | Hücre girişinden kural-ihlali vurgusuna kadar gecikme | ≤ 200ms |
| NFR-2 | Güvenilirlik | Yüklenen her bulmacanın geçerli bir çözümü olmalı | %100 (Faz 9'da otomatik testle doğrulanır) |
| NFR-3 | Uyumluluk | Güncel masaüstü tarayıcılarda (Chrome/Firefox/Edge) çalışmalı | Ek bağımlılık/derleme gerektirmeden, saf HTML/CSS/JS |
| NFR-4 | Erişilebilirlik | Klavye ile hücre seçimi ve sayı girişi mümkün olmalı | Tab/ok tuşlarıyla gezinme + sayı tuşlarıyla giriş |

## İzlenebilirlik
| FR | Karşıladığı KPI / iş hedefi |
|----|------------------------------|
| FR-1 | KPI-1 (yükleme→ilk hamle ≤5sn) |
| FR-2, FR-3 | KPI-3 (kural ihlali tespiti ≤200ms) |
| FR-4 | Başarı kriteri 3 (Çözüldü bildirimi) |
| FR-3 | Başarı kriteri 2 (kural ihlali vurgusu) |
| FR-1, FR-2, FR-4, FR-5 | KPI-2 (bulmaca %100 çözülebilir) |

## Kalite kapısı raporu
- "Her FR'nin kabul kriteri var" → ✅ (FR-1..FR-5, her biri Given/When/Then kriterleriyle)
- "NFR'ler ölçülebilir" → ✅ (NFR-1..NFR-4, ölçüt/hedef sütunuyla)
