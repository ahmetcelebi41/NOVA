# 03 — NOVA | CLOUDFLARE VE MODEL STRATEJİSİ — V1

## 1. Cloudflare kararı

NOVA production ortamında **Cloudflare ekosistemini** kullanacaktır.

Bu karar LOCKED olabilir.

Ancak bugün şu karar LOCKED değildir:

> “NOVA mutlaka Cloudflare Pages kullanacak.”

Nedeni: doğru Cloudflare ürünü uygulamanın teknik mimarisine bağlıdır.

---

## 2. Cloudflare seçenekleri

### Cloudflare Pages

Statik export üreten uygulama için uygundur.

NOVA tamamen client-side / statik demo veriyle çalışırsa basit ve mantıklı seçenek olabilir.

### Cloudflare Workers

Server-side davranış, API, dinamik veri veya tam yığın Next.js ihtiyacı oluşursa daha uygun olabilir.

Cloudflare’ın 2026 dokümantasyonu yeni full-stack Next.js uygulamalarında Workers tarafını öne çıkarmaktadır.

### Diğer Cloudflare servisleri

Gerekirse ileride değerlendirilebilir:

- D1 — ilişkisel veri
- R2 — obje/dosya depolama
- KV — key/value veri
- Workers — API / server işlevleri

Bunlar proje başlangıcında sırf mevcut oldukları için kullanılmaz.

---

## 3. Nihai deployment kararı ne zaman verilecek?

`07 — NOVA | TEKNİK MİMARİ` aşamasında.

Şu sorular cevaplandıktan sonra:

- uygulama statik mi?
- veri kalıcı olacak mı?
- auth olacak mı?
- API gerekiyor mu?
- server-side rendering gerekiyor mu?
- demo veri yeterli mi?

---

## 4. Model kullanım stratejisi

NOVA’da her görev için en pahalı / en ağır model kullanılmaz.

### ChatGPT

**GPT-5.6 Sol — High**
- mimari
- kritik tasarım kararları
- karmaşık hata analizi
- kapsam değişiklikleri

**GPT-5.6 Sol — Medium**
- normal proje planlaması
- belge hazırlama
- UI kararlarının çoğu
- kod inceleme

### Codex

**GPT-5.6 Sol — High**
- büyük refactor
- zor hata
- mimari değişiklik
- çok dosyalı kritik geliştirme

**GPT-5.6 Terra — Medium**
- normal sayfa geliştirme
- component geliştirme
- form / tablo / filtre
- test ekleme

**GPT-5.6 Luna veya Terra — Low / hızlı**
- basit metin
- küçük CSS
- rename
- mekanik düzenleme

Model kullanılabilirliği değişirse görev tipi korunur, güncel eşdeğer model seçilir.

---

## 5. Her sohbet geçişindeki hatırlatma

Her ana bölüm sonunda şu format kullanılacaktır:

### GEÇİŞ

**Tamamlanan:**  
`XX — NOVA | ...`

**Sonraki sohbet:**  
`YY — NOVA | ...`

**Amaç:**  
Kısa açıklama.

**ChatGPT:**  
Model + düşünme seviyesi.

**Codex:**  
Kullanılacak / kullanılmayacak. Kullanılacaksa model + seviye.

---

## 6. Önemli ayrım

ChatGPT ve Codex aynı görevi yapmaya zorlanmaz.

### ChatGPT
- karar
- analiz
- tasarım mantığı
- mimari plan
- görev tanımı
- QA değerlendirmesi

### Codex
- repo üzerinde uygulama
- kod değişikliği
- test
- refactor
- terminal doğrulaması

Bu ayrım token/kota kullanımını daha verimli tutar.

---

## 7. Kaynak notu

Bu belge hazırlanırken 16 Eylül 2026 itibarıyla:

- OpenAI, GPT-5.6 Sol / Terra / Luna modellerinin Codex kullanılabilirliğini dokümante etmektedir.
- Cloudflare, statik Next.js export için Pages yolunu sürdürürken full-stack Next.js için Workers/vinext yolunu önermektedir.

Teknoloji seçimi yapılacağı zaman güncel dokümantasyon yeniden kontrol edilir.
