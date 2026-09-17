# 03 — NOVA | ÜRÜN & KULLANICI AKIŞLARI

**Durum:** FINAL / LOCKED  
**Sürüm:** V1  
**Amaç:** NOVA yönetim panelinin ana kullanıcı yolculuklarını, modüller arası geçişleri ve temel iş kurallarını tanımlamak.

---

## 1. Ana Ürün Prensibi

NOVA yalnızca veri gösteren bir dashboard olmayacak. Önemli veriler kullanıcıyı doğrudan ilgili aksiyona götürecek.

Ana kullanıcı yolculuğu:

**Giriş → Genel Bakış → Sorunu/Fırsatı Gör → İlgili Modüle Git → İşlemi Yap → Sonucu Doğrula → Listeye veya Genel Bakış'a Dön**

V1 tek kullanıcı rolüne göre tasarlanır: **Yönetici / İşletme Sahibi**.

---

## 2. Genel Bakış V1

Üst KPI alanı:
- Bugünkü Satış
- Bugünkü Sipariş
- Bekleyen Sipariş
- Düşük Stok

Orta bölüm:
- Satış trendi
- Son 7 Gün / Son 30 Gün

Alt bölüm:
- Son Siparişler
- Stok Uyarıları

KPI ve uyarılar ilgili modülü aktif filtreyle açar.

**Bekleyen Sipariş** KPI'ı `/siparisler?durum=bekliyor` hedefini açar. `durum=bekliyor` ham sipariş statüsü değil; **Yeni + Hazırlanıyor + Teslimata Hazır** durumlarını kapsayan operasyonel aggregate filtredir. **Tamamlandı** ve **İptal** kapsama girmez. Siparişler sayfasında aktif filtre kullanıcıya **Bekleyen Siparişler** adıyla açıkça gösterilir.

V1 dışı:
- Bildirim merkezi
- Canlı trafik
- Detaylı finans KPI'ları
- Haritalar
- Saatlik grafikler

---

## 3. Siparişler V1

Akış:

**Sipariş Listesi → Arama/Filtreleme → Sipariş Detayı → Kontrollü Durum Yönetimi**

Oluşturma akışı:

**Siparişler → Yeni Sipariş → Sipariş Oluştur (`/siparisler/yeni`) → Sipariş Detayı**

Sipariş Oluştur V1 kapsamındadır; Siparişler sayfasındaki **Yeni Sipariş** aksiyonu aktiftir.

Liste alanları:
- Sipariş No
- Müşteri
- Tarih
- Toplam
- Ödeme
- Sipariş Durumu
- İşlem

Arama:
- Sipariş numarası
- Müşteri adı

Filtreler:
- Durum: Tümü / Yeni / Hazırlanıyor / Hazır / Tamamlandı / İptal
- Operasyonel aggregate: `durum=bekliyor` → **Bekleyen Siparişler** = Yeni + Hazırlanıyor + Teslimata Hazır; Tamamlandı ve İptal hariç
- Tarih: Bugün / Son 7 Gün / Son 30 Gün

Varsayılan sıralama: **En yeni → En eski**

Durum akışı:

**Yeni → Hazırlanıyor → Hazır → Tamamlandı**

Alternatif terminal durum: **İptal**

Serbest durum dropdown'u yerine bağlama göre aksiyon kullanılır. İptal işlemi confirmation modal gerektirir.

Sipariş detay kartları:
- Sipariş İçeriği
- Müşteri
- Teslimat
- Ödeme

V1 dışı:
- Sipariş düzenleme
- Siparişe ürün ekleme
- Kısmi iade
- Fatura
- Kargo entegrasyonu
- Yazdırma
- Toplu durum değiştirme
- Audit log

---

## 4. Ürünler V1

Akış:

**Ürün Listesi → Arama/Filtreleme → Yeni Ürün → Ürün Düzenleme → Aktif/Pasif Yönetimi**

Liste alanları:
- Ürün
- SKU
- Kategori
- Fiyat
- Stok
- Durum
- İşlem

Arama:
- Ürün adı
- SKU

Filtreler:
- Kategori
- Durum: Tümü / Aktif / Pasif
- Stok: Tümü / Stokta / Düşük Stok / Tükendi

Temel kural:

**Ürünler katalog bilgisini yönetir; günlük stok miktarı Stok modülünde yönetilir.**

Yeni üründe başlangıç stoğu girilebilir. Sonraki stok değişiklikleri Stok modülünden yapılır.

SKU değiştirilebilir ancak sistem genelinde benzersiz kalır.

Hard delete yoktur. Ürünler gerektiğinde pasif yapılır; geçmiş sipariş verileri korunur.

V1 dışı:
- Varyantlar
- Çoklu görsel
- İndirim/fiyat geçmişi
- Toplu düzenleme
- Barkod
- Ürün kopyalama
- Gelişmiş SEO
- Tedarikçi ilişkileri

---

## 5. Stok V1

Akış:

**Stok Listesi → Arama/Filtreleme → Stok Detayı → Stok Ekle/Azalt → Minimal Hareket Geçmişi**

Liste alanları:
- Ürün
- SKU
- Mevcut Stok
- Kritik Eşik
- Durum
- Son Güncelleme
- İşlem

Durumlar otomatik hesaplanır:
- Stokta
- Düşük Stok
- Tükendi

Her ürün ayrı kritik stok eşiğine sahip olabilir.

Stok doğrudan toplam rakam değiştirilerek değil:
- Stok Ekle
- Stok Azalt

hareketleriyle güncellenir.

Stok negatif olamaz.

Minimal geçmiş:
- Tarih
- İşlem
- Miktar
- Sonuç

**Tükendi ≠ Pasif**

V1 dışı:
- Çoklu depo
- Transfer
- Tedarikçi
- Alış maliyeti
- Sayım oturumu
- Seri/lot
- Son kullanma tarihi
- Otomatik satın alma
- Barkod okutma
- Rezervasyon

---

## 6. Müşteriler V1

Akış:

**Müşteri Listesi → Arama/Sıralama → Müşteri Detayı → Sipariş Geçmişi → Temel Bilgi Düzenleme**

Liste alanları:
- Müşteri
- E-posta
- Telefon
- Sipariş Sayısı
- Toplam Harcama
- Son Sipariş
- İşlem

Arama:
- Ad Soyad
- Telefon
- E-posta

Müşteri esas olarak sipariş üzerinden oluşur. V1'de manuel müşteri oluşturma yoktur.

Müşteri detayında:
- Temel bilgiler
- Tamamlanan Sipariş
- Toplam Harcama
- Ortalama Sipariş
- Son Sipariş
- Sipariş geçmişi

Ad, telefon, e-posta ve adres düzenlenebilir. Hesaplanan metrikler elle değiştirilemez.

Hard delete yoktur.

---

## 7. Analizler V1

Akış:

**Tarih Aralığı → KPI Özeti → Satış/Sipariş Trendi → Sipariş Durum Dağılımı → En Çok Satan Ürünler → Kategori Performansı**

Tarih:
- Son 7 Gün
- Son 30 Gün
- Son 90 Gün
- Özel Tarih Aralığı

Varsayılan: **Son 30 Gün**

KPI:
- Toplam Satış
- Toplam Sipariş
- Ortalama Sipariş Tutarı
- Satılan Ürün Adedi

Uygun olduğunda önceki eşdeğer dönemle karşılaştırılır.

Finansal KPI'lar yalnız **Tamamlandı** durumundaki siparişlerden hesaplanır. İptal siparişler finansal hesaplara dahil edilmez.

Analiz verileri mümkün olduğunda ilgili Ürün veya filtrelenmiş Sipariş ekranına bağlanır.

V1 dışı:
- Kâr/zarar
- Marj/maliyet
- Vergi
- CLV
- Cohort/Funnel
- Tahminleme
- AI önerileri
- Şube karşılaştırması
- PDF/Excel dışa aktarma

---

## 8. Ayarlar ve Yardımcı Akışlar V1

Ayarlar:
- İşletme adı
- E-posta
- Telefon
- Adres
- Para birimi
- Saat dilimi

Standart sistem durumları:
- Empty state
- Filtre sonucu boş durumu
- Skeleton loading
- Alan bazlı form hatası
- Başarı toast'ı
- Kritik işlem confirmation modal'ı
- Veri yükleme hatasında Tekrar Dene
- 404 / kayıt bulunamadı

Boş veri ile yükleme hatası aynı durum değildir.

V1 dışı:
- Rol/yetki
- Ekip üyeleri
- Entegrasyonlar
- API/Webhook
- Abonelik
- 2FA
- Tema/dil yönetimi

---

## 9. Navigasyon ve Modüller Arası Bağlantılar

Ana navigasyon:

**Genel Bakış → Siparişler → Ürünler → Stok → Müşteriler → Analizler → Ayarlar**

Çapraz geçişlerde aktif filtre görünür olmalıdır.

Detaydan listeye dönüldüğünde önceki filtre ve sıralama mümkün olduğunca korunur.

Veri sahipliği:
- Sipariş durumu → Siparişler
- Ürün adı/fiyat/kategori → Ürünler
- Stok miktarı/kritik eşik → Stok
- Müşteri temel bilgileri → Müşteriler
- İşletme bilgileri → Ayarlar
- KPI/analiz → Sistem tarafından hesaplanır

V1'de siparişler demo/veri kaynağından gelebilir; manuel Sipariş Oluştur akışı `/siparisler/yeni` altında desteklenir. Gerçek mağaza entegrasyonu kapsam dışıdır.

---

## 10. Edge Case ve İş Kuralları

- Tükendi ile Pasif farklıdır.
- Pasif ürün geçmiş siparişlerden ve analizlerden silinmez.
- Ürün adı, SKU veya fiyat değişikliği geçmiş siparişleri değiştirmez.
- Sipariş satırları sipariş anındaki ürün adı, SKU, birim fiyat ve adedi korur.
- Toplam Sipariş operasyonel olarak tüm siparişleri kapsayabilir.
- Finansal KPI'lar yalnız tamamlanmış siparişlerden hesaplanır.
- Müşteri toplam harcaması yalnız tamamlanmış siparişlerden hesaplanır.
- Sipariş durum değişikliği V1'de otomatik stok hareketi oluşturmaz.
- Tamamlandı ve İptal terminal durumlardır.
- Pasif ürünün stok kaydı korunur.
- Stok ve kritik eşik negatif olamaz.
- Başlangıç stoğu boşsa 0 kabul edilir.
- SKU aktif/pasif ayrımı olmadan benzersizdir.
- Müşteriler yalnız isim benzerliğiyle otomatik birleştirilmez; telefon/e-posta eşleşmesi tercih edilir.
- Gerçek 0 değeri ile veri yükleme hatası ayrıdır.
- Önceki dönem değeri 0 ise yanıltıcı yüzde değişimi gösterilmez.

---

# FINAL / LOCKED

`03 — NOVA | ÜRÜN & KULLANICI AKIŞLARI` tamamlanmıştır.

Bu dokümandaki kararlar V1 için referans kabul edilir. Yeni bir ihtiyaç veya doğrulanmış gerekçe ortaya çıkmadıkça geliştirme sırasında bu kapsam genişletilmez.

**Bir sonraki aşamaya geçilebilir.**
