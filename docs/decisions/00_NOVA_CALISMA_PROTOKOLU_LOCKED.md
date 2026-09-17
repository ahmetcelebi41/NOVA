# 00 — NOVA | ÇALIŞMA PROTOKOLÜ — LOCKED

## 1. Amaç

Bu belge NOVA projesinde nasıl çalışacağımızı tanımlar. ELORA projesinde işe yarayan disiplin korunur; ancak ELORA’nın teknik veya tasarım kararları NOVA’ya otomatik taşınmaz.

Temel ilke: **aynı çalışma disiplini, projeye özel kararlar.**

---

## 2. Çalışma biçimi

NOVA kontrollü ve aşamalı ilerler.

Her ana konu ayrı sohbet/bölüm olarak ele alınır:

1. Proje Özeti
2. Hedefler & Kapsam
3. Kullanıcı & Senaryolar
4. Sayfa Yapısı
5. UI / Tasarım Sistemi
6. Sayfa Tasarımları
7. Teknik Mimari
8. Codex & Geliştirme
9. Test & Kalite Kontrol
10. Yayınlama

Bir bölüm yeterince netleşmeden sonraki bölüme geçilmez.

---

## 3. Karar sistemi

Kararlar üç seviyede tutulur:

### TASLAK
Henüz tartışılıyor.

### ONAYLANDI
Kullanıcı tarafından kabul edildi ancak ileride gerekirse yeniden değerlendirilebilir.

### LOCKED
Projenin mevcut temel kararıdır. Yeni ve güçlü bir gerekçe olmadan değiştirilmez.

LOCKED karar eski olduğu için korunmaz. Yeni bilgi kararın yanlış olduğunu gösterirse yeniden değerlendirilir.

---

## 4. `.md` belge kuralı

Proje kararları Markdown (`.md`) belgeleriyle tutulur.

Kurallar:

- Tek bir `.md` dosyası **8000 karakteri geçmez**.
- Belgeler kısa, uygulanabilir ve karar odaklı olur.
- Aynı bilgi farklı dosyalarda gereksiz yere tekrarlanmaz.
- Dosya adı Türkçe ve anlaşılır olur.
- Teknik terimin yaygın İngilizcesi gerektiğinde parantez içinde verilebilir.
- Nihai karar belgelerinde `LOCKED` veya `FINAL` ifadesi kullanılabilir.

8000 karakter sınırı içerik kalitesini bozuyorsa belge mantıklı alt belgelere ayrılır.

---

## 5. Sohbet geçişi kuralı

Her ana sohbet/bölüm tamamlandığında geçiş mesajında şunlar bulunur:

- Tamamlanan bölüm
- Kilitlenen temel kararlar
- Sonraki sohbetin tam adı
- Sonraki sohbetin amacı
- Önerilen ChatGPT modeli / düşünme seviyesi
- Codex kullanılacaksa önerilen model / çalışma seviyesi

Örnek:

> Sonraki sohbet: `07 — NOVA | TEKNİK MİMARİ`  
> ChatGPT: GPT-5.6 Sol — High  
> Codex: Henüz kullanılmayacak.

Model önerileri sabit değildir; görevin karmaşıklığına göre yeniden değerlendirilir.

---

## 6. Model kullanım ilkesi

### Strateji, mimari ve kritik kararlar
- ChatGPT: **GPT-5.6 Sol**
- Düşünme: **High**

### Normal planlama ve belge düzenleme
- ChatGPT: **GPT-5.6 Sol**
- Düşünme: **Medium**

### Codex — karmaşık geliştirme
- Tercih: **GPT-5.6 Sol**
- Seviye: **High**
- Kullanım: mimari değişiklik, zor hata, büyük refactor, veri akışı

### Codex — normal geliştirme
- Tercih: **GPT-5.6 Terra**
- Seviye: **Medium**
- Kullanım: bileşen, sayfa, test, küçük/orta özellik

### Codex — mekanik ve düşük riskli işler
- Tercih: **GPT-5.6 Luna veya Terra**
- Seviye: **Low / hızlı**
- Kullanım: isim değiştirme, küçük CSS düzeltmesi, basit metin değişikliği

Amaç her görevde en güçlü modeli kullanmak değil; **gereken kadar güçlü modeli kullanmak**.

---

## 7. Kodlama kuralı

Kodlamaya geçildiğinde:

1. Önce mevcut durum doğrulanır.
2. Sorun veya görev açıkça tanımlanır.
3. Minimum gerekli değişiklik yapılır.
4. Çalışan sistem gereksiz yere yeniden yazılmaz.
5. Değişiklik sonrası test yapılır.
6. Sonuç başarılıysa commit alınır.
7. Büyük değişiklikler tek commit altında karıştırılmaz.

---

## 8. Türkçe çalışma standardı

Proje yönetimi, sayfa adları ve karar belgeleri mümkün olduğunca Türkçe tutulur.

Örnek:

- Dashboard → Genel Bakış
- Orders → Siparişler
- Products → Ürünler
- Inventory → Stok Yönetimi
- Customers → Müşteriler
- Analytics → Satış Analizi
- Settings → Ayarlar

Kod içinde ekosistemin doğal standardı olan İngilizce isimler kullanılabilir. Türkçeleştirme kod okunabilirliğini bozacaksa zorlanmaz.

---

## 9. ELORA’dan alınacak ve alınmayacak şeyler

### Alınacak
- kontrollü aşamalar
- ayrı karar belgeleri
- LOCKED sistemi
- görsel QA
- Git temizliği
- küçük ve doğrulanabilir geliştirme adımları
- ücretsiz çözümleri önceleme

### Otomatik alınmayacak
- ELORA renkleri
- ELORA tipografisi
- ELORA sayfa yapısı
- statik export kararı
- mevcut component mimarisi
- breakpoint değerleri
- teknoloji seçimi

NOVA kendi ihtiyaçlarına göre tasarlanır.

---

## 10. Ana prensip

**Önce karar → sonra belge → sonra uygulama → sonra test → sonra kilitleme.**
