# 06 — NOVA | SAYFA TASARIMLARI — LOCKED FINAL

## 06.1 — Genel Bakış
Akış: **Başlık → 4 KPI → Satış Performansı + Sipariş Durumları → Kritik Stoklar + Son Siparişler**.  
KPI: **Bugünkü Satış / Bugünkü Sipariş / Bekleyen Sipariş / Düşük Stoklu Ürün**. İlk ikide dönem karşılaştırması, diğerlerinde operasyonel bilgi; ilgili modüller filtreli açılır.  
Satış grafiği line chart, 7/30/90 gün, varsayılan 7; tooltip satış + sipariş. Durumlar: **Yeni / Hazırlanıyor / Teslimata Hazır / Tamamlandı**; donut yok. Kritik stok max 5; **Düşük Stok / Tükendi**. Son siparişler son 5; satır detay açar. Mobil KPI tek kolon, tablet 2×2.

## 06.2 — Siparişler
Akış: **Başlık + Yeni Sipariş → Durumlar → Arama/Filtre/Sıralama → Tablo → Sayfalama**.  
Durumlar: **Tümü / Yeni / Hazırlanıyor / Teslimata Hazır / Tamamlandı / İptal**. Arama: sipariş no, müşteri, telefon, e-posta. Varsayılan **En Yeni**.  
Tablo: **Sipariş No / Müşteri / Tarih / Ürün / Tutar / Durum / Aksiyon**. Satır detay açar; menü: Detayı Gör / Durumu Güncelle / uygunsa İptal Et. Checkbox yok.  
Akış: **Yeni → Hazırlanıyor → Teslimata Hazır → Tamamlandı**. İptal destructive + onaylı. 20 kayıt/sayfa; filtre değişince sayfa 1; dönüşte state korunur. Mobil kart + filtre drawer.

## 06.3 — Sipariş Detayı
Akış: **Geri + Başlık + Durum → Özet → Ürünler → Müşteri/Teslimat → Tutar → Durum Geçmişi → Aksiyonlar**.  
Ürünler: **Ürün / Birim Fiyat / Adet / Toplam**; varsa varyant. **Sipariş anındaki fiyat snapshot** kullanılır. Inline düzenleme yok. Tutar: **Ara Toplam / Teslimat / varsa İndirim / Genel Toplam**.  
Müşteri: ad, telefon, e-posta; iletişim/teslimat snapshot’tır. Yöntemler: **Teslimat / Mağazadan Teslim Alma**. Geçmiş yalnız gerçekleşmiş statüleri tarih-saat ile gösterir. Ana CTA: **Hazırlamaya Başla → Teslimata Hazır Olarak İşaretle → Tamamlandı Olarak İşaretle**. İptal ayrı destructive aksiyon.

## 06.4 — Ürünler
Akış: **Başlık + Yeni Ürün → Hızlı Filtreler → Arama/Filtre/Sıralama → Tablo → Sayfalama**.  
Yayın **Aktif/Pasif**, stok **Normal/Düşük Stok/Tükendi** ve ayrıdır. Filtreler: Tümü / Aktif / Pasif / Düşük Stok / Tükendi. Arama ürün adı + SKU; kategori tek seçim; fiyat min/max; varsayılan **En Yeni Eklenen**.  
Tablo: **Ürün / Kategori / Fiyat / Stok / Yayın Durumu / Aksiyon**. Satır Ürün Düzenle’yi açar. Menü: Düzenle / Aktif Et veya Pasife Al. Silme/checkbox yok; pasife alma onaylı. 20 kayıt; mobil kart.

## 06.5 — Ürün Ekle / Düzenle
Form: **Temel Bilgiler → Fiyat → Stok → Görsel → Yayın Durumu → Aksiyonlar**.  
Zorunlu: ürün adı, kategori, satış fiyatı, stok adedi, düşük stok eşiği. Opsiyonel: SKU, açıklama, görsel. Fiyat >0; stok/eşik ≥0 tam sayı; SKU benzersiz.  
Tek ana görsel; JPEG/PNG/WebP; önizleme/değiştir/kaldır; crop yok. Yeni ürün varsayılan **Aktif**. Dirty-state uyarısı vardır. Varyant, çoklu galeri, kampanya, maliyet, SEO yok.

## 06.6 — Stok
Akış: **Başlık → Hızlı Stok Filtreleri → Arama/Filtre/Sıralama → Tablo → Sayfalama**. Durumlar: **Tümü / Normal / Düşük Stok / Tükendi**.  
Tablo: **Ürün / Kategori / Mevcut Stok / Düşük Stok Eşiği / Stok Durumu / Aksiyon**. Durum: `0=Tükendi`, `stok≤eşik=Düşük Stok`, aksi Normal. Satır tıklanmaz; aksiyonlar **Stok Güncelle / Ürünü Düzenle**.  
Modalda yalnız yeni stok değişir; eşik salt-okunur; değer ≥0 tam sayı. Varsayılan **Stok: Az → Çok**. 20 kayıt; mobil kart. 

## 06.7 — Müşteriler
Akış: **Başlık → Hızlı Segmentler → Arama/Filtre/Sıralama → Tablo → Sayfalama**. Manuel Yeni Müşteri yok.  
Segmentler: **Yeni** = ilk sipariş son 30 gün; **Tekrar Sipariş Veren** = en az 2 geçerli sipariş; **Pasif** = son sipariş 90 günden eski.  
Tablo: **Müşteri / İletişim / Sipariş Sayısı / Toplam Harcama / Son Sipariş / Durum / Aksiyon**. Sipariş sayısı iptalleri hariç; toplam harcama yalnız tamamlanmışlardan. Satır detay açar. 20 kayıt; mobil kart. 

## 06.8 — Müşteri Detayı
Akış: **Geri + Ad + Segmentler → Özet → İletişim → İstatistikler → Sipariş Geçmişi**. Salt-okunur.  
Metrikler: **Geçerli Sipariş / Tamamlanmış Sipariş / Toplam Harcama / Ortalama Sipariş Tutarı**. Finansal metrikler yalnız tamamlanmışlardan; veri yoksa ortalama `—`. Telefon + e-posta.  
Son 10 sipariş: **Sipariş No / Tarih / Ürün / Tutar / Durum**; en yeni üstte. Satır Sipariş Detayı’nı açar. “Tüm siparişleri görüntüle” Siparişler’i müşteri filtresiyle açar. Mobilde 2×2 metrik grid + kart liste.

## 06.9 — Analizler
Akış: **Başlık + Global Tarih → 4 KPI → Satış Trendi → Sipariş Trendi + Ortalama Sipariş → En Çok Satan Ürünler + Kategori Performansı**. Varsayılan **Son 30 Gün**.  
KPI: Toplam Satış, Sipariş Sayısı, Ortalama Sipariş Tutarı, Satılan Ürün Adedi. Finansal metrikler yalnız tamamlanmışlardan; sipariş sayısı iptal hariç geçerli siparişlerden. Önceki eşdeğer dönemle karşılaştırılır; önceki dönem 0 ise yüzde yok.  
Satış Trendi: 7/30 günlük, 90 haftalık; önceki dönem soluk ikinci çizgi. Ortalama Sipariş yalnız tamamlanmışlardan; veri yoksa 0 sayılmaz. En Çok Satan ilk 5 ürün adede göre + gelir. Kategori performansı satış tutarı + pay ile yatay bar. Global tarih tüm analizleri değiştirir.

## 06.10 — Ayarlar
V1: **İşletme Bilgileri → Sipariş ve Teslimat Ayarları → Kaydet**.  
İşletme: ad + e-posta zorunlu; telefon + adres opsiyonel. Ayarlar: teslimat ücreti, minimum sipariş tutarı, Teslimat ve Mağazadan Teslim Alma toggle’ları. Ücret/minimum ≥0; `0` geçerli. En az bir teslim yöntemi aktif olmalı.  
Form max ~720–800 px; mobil tek kolon. Ayarlar yüklenemezse boş düzenlenebilir form gösterilmez. 

## 06.11 — Ortak Davranışlar
Sayfa/içerik loading varsayılanı **skeleton**; tam ekran spinner yok. Küçük mutation lokal loading kullanır. `prefers-reduced-motion` desteklenir.  
Durumlar ayrı: **Empty / No Results / Not Found / Error**. Teknik hata detayı gösterilmez.  
Toast kısa işlem geri bildirimi içindir. Modal kısa/onay isteyen işlemlerde kullanılır; destructive CTA açık isimlidir; veri girilen modal dış tıkla kapanmaz. Başarıda modal kapanır + toast; hatada modal açık kalır, veri korunur.  
Tüm interaktif öğelerde `focus-visible`, gerçek button/link semantiği, mantıksal tab sırası, modal focus trap/Escape/focus return, görünür label ve yeterli mobil dokunma hedefi zorunludur. Anlam yalnız renkle verilmez.

## 06.12 — Responsive ve Final QA
Responsive içerik temellidir. Masaüstü layout küçük ekranda zorla korunmaz. Tablet gerektiğinde tek kolona; okunamayan tablolar kart/list görünümüne geçer. Mobil ana içerikte yatay scroll yok; yalnız hızlı filtre chip’lerinde kontrollü yatay kaydırma olabilir.   
Final QA: görsel tutarlılık, terminoloji, navigasyon, state korunumu, form davranışları, responsive, erişilebilirlik, loading/empty/error ve veri mantığı. Sonuçlar **PASS / PASS WITH MINOR ISSUE / FAIL**; FINAL baseline öncesi bloklayıcı FAIL kalmaz.  
Kategoriler V1’de ayrı yönetilmez; demo/seed veridir.

## 06.13 — Sipariş Oluştur
Akış: **Müşteri → Ürünler → Teslimat Yöntemi → Teslimat Bilgileri → Sipariş Özeti → Oluştur**.  
Müşteri: ad + telefon zorunlu, e-posta opsiyonel. Eşleştirme **Telefon → E-posta → Yeni Müşteri**; adla otomatik eşleştirme yok. Sipariş müşteri/teslimat snapshot’ı profili otomatik güncellemez.  
Yalnız Aktif ürünler seçilebilir; Tükendi görünür ama seçilemez. Adet min 1, tam sayı ve stokla sınırlı. Aynı ürün tekrar eklenirse adet artar. Submit’te fiyat + stok yeniden doğrulanır. Fiyat değişirse özet güncellenir ve yeniden onay gerekir. Stok sipariş oluşunca azalır; iptalde geri eklenir. İşlem atomik/tutarlı yürütülür.  
Teslimat yöntemi kullanıcı seçer; yalnız Ayarlar’daki aktif yöntemler görünür. Teslimatta adres + tarih + saat aralığı zorunlu; mağazadan teslimde adres gizli. Geçmiş tarih/saat yok. Teslimat ücreti Ayarlar’dan gelir; minimum sipariş yalnız ürün ara toplamına uygulanır.  
Özet: **Ara Toplam / Teslimat / Genel Toplam**. Başlangıç durumu **Yeni**. Başarı sonrası Sipariş Detayı’na yönlendirme. Desktop ~65/35; özet uygun ekranda sticky olabilir. Mobil tek kolon; sticky bottom bar yok.

---
**Nihai V1 referansıdır.**
