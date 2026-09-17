# 04 — NOVA | BİLGİ MİMARİSİ & SAYFA YAPISI

**Durum:** FINAL / LOCKED  
**Proje:** NOVA  
**Sürüm:** V1

---

## 04.1 — Global Uygulama İskeleti

NOVA, masaüstünde **sol sidebar + üst bar + ana içerik alanı** yapısını kullanır.

Ana navigasyon sırası:

1. Genel Bakış
2. Siparişler
3. Ürünler
4. Stok
5. Müşteriler
6. Analizler
7. Ayarlar

Ayarlar ana modül olmaya devam eder ancak sidebar'ın alt bölümünde görsel olarak ayrıştırılır.

Masaüstünde sidebar varsayılan olarak açık, gerektiğinde daraltılabilir yapıdadır.

Mobilde sabit sidebar kullanılmaz. Navigasyon hamburger menüsü ile açılan drawer/overlay yapısına dönüşür.

Bottom navigation kullanılmaz.

Breadcrumb yalnız detay/hiyerarşik ekranlarda kullanılır.

Sayfa üst alanı genel olarak:
- Sayfa başlığı
- Kısa açıklama
- Gerekiyorsa birincil aksiyon

yapısını izler.

Bildirim merkezi V1 kapsamında değildir.

---

## 04.2 — URL ve Rota Yapısı

Nihai rota yapısı:

```text
/                       Genel Bakış

/siparisler             Sipariş Listesi
/siparisler/[id]        Sipariş Detayı

/urunler                Ürün Listesi
/urunler/yeni           Yeni Ürün
/urunler/[id]           Ürün Detay / Düzenleme

/stok                   Stok Yönetimi

/musteriler             Müşteri Listesi
/musteriler/[id]        Müşteri Detayı

/analizler              Analizler

/ayarlar                Ayarlar
```

`/` doğrudan Genel Bakış ekranıdır. Ayrı `/genel-bakis` rotası kullanılmaz.

URL'lerde Türkçe kelimeler kullanılabilir ancak Türkçe karakter kullanılmaz.

Filtre, arama, sıralama ve gerektiğinde sayfalama URL query parametreleriyle temsil edilir.

Örnek:

```text
/siparisler?durum=hazirlaniyor
/stok?durum=dusuk
/urunler?kategori=tatli
/musteriler?q=ahmet
```

---

## 04.3 — Genel Bakış

Genel Bakış ekranının amacı işletmenin mevcut durumunu hızlıca göstermektir.

Ana bloklar:

1. KPI Kartları
2. Satış Grafiği
3. Son Siparişler
4. Stok Uyarıları
5. En Çok Satan Ürünler
6. Müşteri Özeti

Temel KPI'lar:
- Bugünkü Ciro
- Bugünkü Sipariş Sayısı
- Bekleyen / işlem gerektiren siparişler
- Düşük stoklu ürünler

KPI ve özet alanları mümkün olduğunda ilgili modüle aktif filtreyle yönlendirir.

Ana satış grafiği varsayılan olarak son 7 günü gösterir; 7 / 30 / 90 gün seçimi desteklenebilir.

Genel Bakış detaylı analiz ekranına dönüştürülmez.

---

## 04.4 — Siparişler

Siparişler ana ekranı tablo/listesi olarak tasarlanır.

Filtreler:
- Arama
- Sipariş durumu
- Tarih
- Sıralama

Sipariş durumları:

```text
Yeni
Hazırlanıyor
Hazır
Tamamlandı
İptal
```

Sipariş detay ekranında:
- Sipariş özeti
- Müşteri bilgileri
- Ürünler
- Teslimat bilgileri
- Notlar
- Durum güncelleme

bulunur.

Ayrı sipariş düzenleme rotası kullanılmaz.

Listeye dönüşte önceki filtre ve sıralama mümkün olduğunca korunur.

---

## 04.5 — Ürünler

Ürün listesinde:
- Arama
- Kategori
- Stok durumu
- Sıralama

bulunur.

Ürünlerde **Aktif / Pasif** durumu desteklenir.

`/urunler/yeni` yeni ürün oluşturma ekranıdır.

`/urunler/[id]` hem ürün detayını hem düzenlemeyi içerir.

Temel ürün alanları:
- Ürün adı
- Kategori
- Fiyat
- Açıklama
- Ana görsel
- Aktif/Pasif
- Mevcut stok
- Düşük stok eşiği

Stok miktarı ürün ekranında görüntülenebilir; stok operasyonlarının asıl sahibi Stok modülüdür.

Ürün silmek yerine mümkün olduğunca pasife alma tercih edilir.

Varyantlar, çoklu görseller ve gelişmiş fiyatlandırma V1 kapsamı dışındadır.

---

## 04.6 — Stok

Stok ekranı operasyonel stok yönetiminin merkezidir.

Stok durumları:

```text
Normal
Düşük Stok
Stokta Yok
```

Ana tablo:
- Ürün
- Mevcut stok
- Düşük stok eşiği
- Durum
- Son hareket

Stok değişiklikleri doğrudan değerin üzerine yazmak yerine hareket mantığıyla yapılır.

Örnek:

```text
+10 Yeni üretim
-2 Hasarlı ürün
-1 Sipariş
```

Stok Durumu ve Stok Hareketleri aynı `/stok` sayfasında sekme/bölüm olarak bulunur.

Ayrı `/stok/hareketler` rotası yoktur.

---

## 04.7 — Müşteriler

Müşteri listesi temel olarak:
- Müşteri
- Sipariş sayısı
- Toplam harcama
- Son sipariş

bilgilerini gösterir.

Arama ad, telefon veya e-posta üzerinden yapılabilir.

Müşteri detay ekranında:
- İletişim bilgileri
- Toplam sipariş
- Toplam harcama
- Ortalama sipariş tutarı
- Son sipariş tarihi
- Sipariş geçmişi

bulunur.

Sipariş geçmişinden ilgili sipariş detayına geçilebilir.

Sipariş kayıtları Müşteri modülünden değiştirilmez.

Bağımsız yeni müşteri oluşturma ve müşteri silme V1 kapsamında değildir.

Gelişmiş CRM özellikleri kapsam dışıdır.

---

## 04.8 — Analizler

Analizler, Genel Bakış'ın tekrarı değil; dönemsel performans değerlendirme ekranıdır.

Ana alanlar:

1. Satış Analizi
2. Sipariş Analizi
3. Ürün Analizi
4. Müşteri Analizi

Ortak tarih seçenekleri:

```text
Son 7 Gün
Son 30 Gün
Son 90 Gün
Özel Tarih
```

Seçilen tarih tüm analiz alanlarına ortak uygulanır.

Önceki eşdeğer dönemle karşılaştırma desteklenir.

Örnek:

```text
Önceki 30 güne göre +%12,4
```

Ürün kârlılığı, muhasebe analizi, churn, cohort ve CLV V1 kapsamı dışındadır.

---

## 04.9 — Ayarlar

Tek `/ayarlar` sayfası kullanılır.

Ana bölümler:
- İşletme
- Görünüm
- Uygulama

İşletme:
- İşletme adı
- E-posta
- Telefon
- Adres
- Para birimi

Görünüm:
- Sistem
- Açık
- Koyu tema

Uygulama:
- Demo verilerini sıfırlama / yeniden yükleme

Veri sıfırlama işlemi zorunlu onay gerektirir.

Rol, ekip, abonelik, faturalandırma, vergi ve muhasebe ayarları V1 kapsamında değildir.

---

## 04.10 — Ortak Sayfa Kuralları

- Listeye dönüşte filtre ve sıralama korunur.
- Mümkünse scroll konumu da korunur.
- Aktif filtreler açıkça gösterilir.
- Filtreleri Temizle aksiyonu bulunur.
- Gerçek boş durum ile filtre sonucu bulunamaması ayrıdır.
- Yükleme durumlarında skeleton kullanılabilir.
- Hatalarda bağlama uygun mesaj ve Tekrar Dene aksiyonu gösterilir.
- Kayıt/güncelleme işlemlerinde toast geri bildirimi kullanılır.
- Veri kaybı doğurabilecek işlemler confirmation gerektirir.
- Form hataları mümkün olduğunda alan seviyesinde gösterilir.
- Liste modülleri ortak tablo davranışı kullanır.
- V1'de pagination kullanılır; infinite scroll kullanılmaz.
- Türkçe tarih ve TL gösterim biçimleri kullanılır.

---

## 04.11 — Nihai Bilgi Mimarisi

NOVA V1 toplam **11 temel rota tipinden** oluşur.

Modüller birbirine bağlanır:

- Genel Bakış → Siparişler / Stok / Analizler
- Sipariş → Müşteri
- Müşteri → Sipariş
- Stok → Ürün
- Analizler → ilgili operasyon modülleri

V1 dışında bırakılan başlıca ekranlar:

```text
/giris
/kayit
/sifremi-unuttum
/bildirimler
/musteriler/yeni
/siparisler/[id]/duzenle
/urunler/[id]/duzenle
/stok/hareketler
/analizler/*
/ayarlar/kullanicilar
/ayarlar/roller
/ayarlar/faturalandirma
/ayarlar/abonelik
```

Bu belge NOVA V1 bilgi mimarisi ve sayfa yapısı için nihai referanstır.

**FINAL / LOCKED**
