# 05 — NOVA | UI / DESIGN SYSTEM
**Durum:** FINAL / LOCKED  
**Amaç:** NOVA yönetim panelinin görsel dili, bileşen davranışları, responsive yapısı ve erişilebilirlik kurallarını tek sistem altında tanımlamak.

## 05.1 — Tasarım Yönü ve Görsel Karakter
- Modern, profesyonel, sakin ve veri odaklı SaaS yönetim paneli.
- Açık tema kullanılacak.
- Görsel hiyerarşi tipografi, boşluk, boyut ve yüzey ile kurulacak.
- Orta yoğunlukta arayüz kullanılacak.
- Renkler kontrollü kullanılacak.
- Gradient, glassmorphism, ağır shadow ve dekoratif efektler temel dil olmayacak.
- V1'de dark mode yok; token mimarisi ileride eklenmesine uygun olacak.

## 05.2 — Renk Sistemi
- Ana yüzeyler beyaz ve çok açık nötr griler.
- Primary renk mavi ailesi; başlangıç merkezi `#2563EB`.
- Primary yalnız ana aksiyon, aktif navigasyon, bağlantı ve focus durumlarında kullanılacak.
- `Success / Warning / Danger / Info` semantik anlam taşıyacak.
- Sidebar açık tema olacak.
- Durumlar yalnız renkle ifade edilmeyecek.

## 05.3 — Tipografi
- Ana font: `Inter`.
- Tek font ailesi; serif/dekoratif ikinci font yok.
- Ağırlıklar: `400 / 500 / 600`; `700` sınırlı vurgu.
- Gövde: `14 px`.
- Sayfa başlığı: `28 px`; bölüm: `20 px`; kart: `16 px`.
- KPI: `28–32 px`.
- Sayısal verilerde `tabular-nums`.
- Gereksiz uppercase ve uzun UI metinleri kullanılmayacak.

## 05.4 — Yerleşim / Grid / Container
- Desktop: `240 px` sabit sidebar + esnek ana içerik.
- Desktop içerik yatay padding: `32 px`.
- Okunabilir çalışma alanı yaklaşık `1600 px`.
- 12 kolon referans grid.
- Ana gap `24 px`, yoğun alanlarda `16 px`.
- `>=1024 px`: kalıcı sidebar; `<1024 px`: drawer.
- Referans breakpointler: `768 / 1024 / 1440 px`.
- KPI grid: desktop `4`, tablet `2`, mobil `1`.
- Mobil tablolar otomatik karta dönüşmeyecek; kolon azaltma/yatay scroll kullanılacak.

## 05.5 — Spacing, Radius, Shadow
- 4 px tabanlı spacing: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64`.
- Küçük eleman `6 px`, input/buton `8 px`, kart `12 px`.
- Pill yalnız gerektiğinde.
- Kartlarda belirgin shadow yok.
- Shadow yalnız dropdown, popover, modal ve drawer gibi yükseltilmiş katmanlarda.
- Elevation: `0 / 1 / 2`.

## 05.6 — Butonlar ve Aksiyon Hiyerarşisi
- `Primary / Secondary / Tertiary(Ghost) / Destructive`.
- Primary aynı görünüm alanında mümkün olduğunca tek ana aksiyon.
- Destructive yalnız silme, iptal veya geri dönüşü zor işlemlerde.
- Boyutlar: `32 / 40 / 48 px`; varsayılan `40 px`.
- Radius `8 px`; pill varsayılan değil.
- İkon yalnız anlam kattığında.
- Loading ve disabled durumları açık.
- Buton metni işlemin sonucunu anlatmalı.

## 05.7 — Form ve Input
- Standart input `40 px`, gerektiğinde `48 px`; radius `8 px`.
- Önemli alanlarda kalıcı label; placeholder label yerine geçmez.
- Validation mesajı alana yakın ve metinle gösterilir.
- Hata yalnız renkle ifade edilmez.
- Alanların çoğu zorunluysa opsiyoneller işaretlenir.
- Select/combobox/checkbox/radio/toggle işlevine uygun kullanılır.
- Desktop'ta yalnız ilişkili kısa alanlar yan yana; mobilde tek kolon.
- Kritik uzun formlarda kaydedilmemiş değişiklik uyarısı kullanılabilir.

## 05.8 — Kartlar, Tablolar ve Veri Bileşenleri
- Kart: beyaz yüzey, düşük kontrast border, `12 px` radius, `16–24 px` padding, belirgin shadow yok.
- KPI'da ana değer ön planda; semantik renk yönü değil anlamı temsil eder.
- Tablolar ana veri görünümüdür.
- Zebra stripe varsayılan değil; divider + hover.
- Metin sola, sayısal sütunlar sağa hizalı.
- İkincil satır aksiyonları overflow menüsünde.
- Sorting yalnız anlamlı sütunlarda.
- Aktif filtreler görünür.
- Infinite scroll yerine pagination.
- Empty, loading ve filtre sonucu boş durumları ayrıştırılır.

## 05.9 — Navigation / Sidebar / Header
- Menü sırası: `Genel Bakış → Siparişler → Ürünler → Stok → Müşteriler → Analizler → Ayarlar`.
- Sidebar `240 px`, açık tema.
- Outline ikon + metin.
- Aktif öğe soft primary yüzey ve metin vurgusuyla.
- Gereksiz kategori başlıkları yok.
- Header global yardımcı aksiyonlar ve kullanıcı alanını taşır; sayfa başlığı içerikte kalır.
- Breadcrumb yalnız detay/derin sayfalarda.
- `<1024 px`: drawer navigation.
- Liste bağlamı, filtre ve sıralama mümkün olduğunca korunur.
- V1'de global search ve işlevsiz notification center yok.

## 05.10 — Durum, Badge ve Feedback
- `Success / Warning / Danger / Info / Neutral`.
- Aynı anlam aynı renk ailesini kullanır.
- Status yalnız renkle anlatılmaz.
- Badge yaklaşık `24 px`, hafif tinted background ve okunaklı metin.
- Başarı: kısa toast; alan/form hatası: inline; sayfa seviyesi önemli durum: alert/banner.
- Confirmation yalnız silme, iptal, veri kaybı ve geri dönüşü zor işlemlerde.
- Normal CRUD işleminde ayrı success sayfası yok.

## 05.11 — İkonografi
- Tek ve tutarlı outline ikon sistemi; başlangıç tercihi `Lucide`.
- Boyutlar `16 / 20 / 24 px`; varsayılan `20 px`.
- Büyük dekoratif ikonlar temel dil değil.
- Sidebar'da ikon + metin.
- Icon-only kontrollerde erişilebilir isim ve yaklaşık `40×40 px` minimum hedef.
- Emoji UI ikonografisi olarak kullanılmaz.

## 05.12 — Responsive Sistem
- Mobile-first CSS; ana kullanım senaryosu desktop.
- Breakpointler: `480 / 768 / 1024 / 1440 px`.
- İçerik padding: mobil `16 px`, tablet `24 px`, desktop `32 px`.
- Mobil form tek kolon.
- Tablolar kart listesine çevrilmez; kolon azaltma + gerekirse yatay scroll.
- Toolbar/filtreler küçük ekranda yeniden gruplanır.
- Kritik işlev yalnız hover'a bağlı olmaz.
- Mobil etkileşim hedefi yaklaşık `44 px`.

## 05.13 — Interaction / Hover / Focus / Motion
- Hızlı, sade, öngörülebilir interaction.
- Hover yalnız uygun pointer cihazlarında.
- `:focus-visible`: `2 px` ring + `2–3 px` offset.
- Transition: `180 / 220 / 250 ms`.
- Dramatik scale, bounce ve ağır motion yok.
- Modal/drawer geçişleri kısa ve anlaşılır.
- Loading'de skeleton/lokal feedback öncelikli.
- `prefers-reduced-motion` desteklenir.
- Tooltip yalnız yardımcı açıklama içindir.

## 05.14 — Erişilebilirlik
- Referans: `WCAG 2.2 AA`.
- Normal metin kontrastı en az `4.5:1`, büyük metin en az `3:1`.
- Renk kritik bilgiyi tek başına taşımaz.
- Ana etkileşimler klavye ile erişilebilir.
- Native ve semantik HTML tercih edilir.
- Anlamsal heading hiyerarşisi korunur.
- Formlarda programatik label/hata ilişkileri.
- Modal/dialog doğru focus yönetimi.
- Icon-only kontroller erişilebilir isim taşır.
- Mobil hedef yaklaşık `44 px`.
- Reduced motion desteklenir; kullanıcı zoom'u engellenmez.

## 05.15 — Design Token Yapısı
- Renk, spacing, radius, tipografi, layout, motion, shadow ve z-index merkezi token sistemiyle yönetilecek.
- Bileşenler ham değer yerine mümkün olduğunca semantik token kullanacak.
- Radius: `6 / 8 / 12 / pill`; kart `12 px`.
- Layout tokenları: sidebar, responsive padding, yaklaşık `1600 px` max content.
- Motion: `180 / 220 / 250 ms`.
- Kontrollü z-index katmanları kullanılacak.
- Yalnız tekrar eden ve sistemsel değerler tokenlaştırılacak.

## 05.16 — Final Design System Özeti
Bu belge NOVA V1 arayüzünün görsel ve etkileşimsel temelini tanımlar. Yeni ekran ve bileşenler bu kuralları varsayılan kabul edecek. Değişiklik yalnız açık gerekçe ve yeni karar kaydıyla yapılacaktır.

**05 — NOVA | UI / DESIGN SYSTEM: FINAL / LOCKED**
