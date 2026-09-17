# 02 — NOVA | HEDEFLER & KAPSAM — LOCKED FINAL

**Durum:** FINAL / LOCKED  
**Sürüm:** V1

## 02.1 — Amaç

NOVA V1'in amacı, küçük ölçekli bir e-ticaret veya perakende işletmesinin günlük yönetim senaryosunu gerçekçi biçimde karşılayan, eğitim ve portföy değeri yüksek, tamamlanmış ve tutarlı bir ürün deneyimi oluşturmaktır.

Kapsam mümkün olan en fazla özelliği değil; kullanılabilirlik, veri akışı, görsel kalite ve teknik kalite bakımından dengeli bir ilk sürümü hedefler.

## 02.2 — Hedef Kullanıcı ve Rol

V1 tek rol üzerinden tasarlanır:

**Yönetici / İşletme Sahibi**

Karmaşık rol ve yetki modeli V1 kapsamında değildir.

## 02.3 — V1 Ana Modülleri

- Genel Bakış
- Siparişler
- Ürünler
- Müşteriler
- Stok
- Analizler
- Ayarlar

Bu modüller küçük ölçekli işletmenin günlük satış, sipariş, ürün, müşteri ve stok takibini destekleyen bütünlüklü bir yönetim deneyimi oluşturur.

## 02.4 — MVP Yaklaşımı

Bir özelliğin V1'e alınması için en az bir koşulu karşılaması gerekir:

- temel kullanıcı akışı için gerekli olması,
- gerçek yönetim paneli kullanımını öğretmesi,
- portföy değerini belirgin biçimde artırması,
- başka bir kritik özelliğin çalışması için gerekli olması.

Bu koşulları karşılamayan veya maliyeti faydasından yüksek olan özellikler sonraki fazlara bırakılır.

Özellikler değerlendirilirken şu sınıflar kullanılır:

### ZORUNLU

Temel kullanıcı akışı için gereklidir.

### DEĞERLİ

Eğitim veya portföy değerini artırır ancak temel akışı engellemez.

### SONRA

V1 için gerekli değildir veya maliyeti faydasından yüksektir.

## 02.5 — Veri ve Ürün Davranışı

Gerçekçi demo veriler; ekran hiyerarşisini, tabloları, filtreleri, grafikleri, responsive davranışı ve kullanıcı akışlarını doğrulamak için kullanılabilir.

NOVA yalnız görsel sunumdan oluşmaz. V1 kapsamındaki gerçek veri akışları ve temel CRUD işlevleri çalışan ürün davranışları olarak ele alınır.

## 02.6 — Tasarım ve Kalite Hedefi

Tasarım, kullanılabilirlik, veri akışı ve teknik kalite birlikte değerlendirilir.

Öncelik sırası:

1. anlaşılabilirlik,
2. bilgi hiyerarşisi,
3. kullanılabilirlik,
4. tutarlılık,
5. görsel kalite,
6. animasyon ve dekorasyon.

Gösterişli fakat okunması veya kullanılması zor bir yönetim paneli başarılı kabul edilmez.

## 02.7 — Mimari Kapsam İlkesi

Mimari ileride genişletilebilir olmalıdır; ancak V1 gelecekteki ihtimaller gerekçe gösterilerek gereksiz biçimde karmaşıklaştırılmaz.

Yeni bir bağımlılık veya servis değerlendirilirken gereklilik, bakım durumu, geliştirme katkısı, mimari maliyet ve sağlayıcı bağımlılığı dikkate alınır. Yalnızca popüler olduğu için paket veya servis eklenmez.

Ücretsiz veya zorunlu kredi gerektirmeyen çözümler önceliklidir.

## 02.8 — V1 Kapsamı Dışındaki Varsayılanlar

- gerçek finans veya muhasebe sistemi,
- gerçek ödeme kuruluşu entegrasyonu,
- kargo sağlayıcı entegrasyonu,
- çok mağazalı kurumsal yapı,
- karmaşık rol tabanlı erişim kontrolü,
- ERP entegrasyonu,
- native mobil uygulama,
- gerçek zamanlı çok operatörlü senkronizasyon,
- mikroservis mimarisi.

Bu başlıklar ancak açıkça yeniden değerlendirilirse sonraki fazlarda kapsama alınabilir.

## 02.9 — Kodlama Öncesi Kapsam Kontrolü

Bir sayfa geliştirilmeden önce en az şu noktalar net olmalıdır:

- sayfanın amacı ve yanıtladığı kullanıcı sorusu,
- ana içerik blokları,
- veri ihtiyacı,
- masaüstü ve mobil davranış,
- boş, hata ve yüklenme durumları.

Bu kararlar net değilse doğrudan kodlamaya geçilmez.

## 02.10 — Başarı Kriteri

NOVA V1 aşağıdaki koşullarda başarılı kabul edilir:

- ana kullanıcı akışları çalışıyorsa,
- tasarım tutarlı ve kullanılabilir ise,
- veri akışları ile demo veriler inandırıcıysa,
- responsive davranış doğruysa,
- temel erişilebilirlik sorunları giderilmişse,
- kod ve mimari kararlar açıklanabiliyorsa,
- production ortamında çalışıyorsa,
- proje kararları dokümante edilmişse.

Amaç çok sayıda özellik değil, **yüksek tamamlanmışlık ve tutarlılık düzeyidir**.

## 02.11 — Nihai Karar

Bu belge NOVA V1 hedefleri ve kapsamı için nihai referanstır.

**FINAL / LOCKED kararlar açıkça yeniden açılmadıkça değiştirilmez.**
