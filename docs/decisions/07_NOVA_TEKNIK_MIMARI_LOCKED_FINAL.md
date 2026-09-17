# 07 — NOVA | TEKNİK MİMARİ — LOCKED FINAL

**Durum:** FINAL / LOCKED  

## 07.1 — Teknoloji Yığını
Frontend: **React + TypeScript + Vite**. Routing: **React Router**. Stil: **CSS Modules + merkezi design tokenları**. Paket yöneticisi: **pnpm**. Sürümleme: **Git + GitHub**. Yayınlama: **Cloudflare**.

İhtiyaç kanıtlanmadan Redux, Zustand, UI framework veya utility-CSS eklenmez. Next.js/App Router kullanılmaz.

## 07.2 — Uygulama Mimarisi
NOVA, React Router tabanlı **SPA** olacaktır. Ortak yapı `DashboardLayout` altında `Sidebar + Topbar + Main Content/Outlet` şeklindedir.

Mimari **feature-based** olacaktır. İş alanına özel bileşen, hook ve mantık ilgili feature altında tutulur. Ortak bileşenler yalnız gerçekten tekrar kullanılıyorsa `components/` katmanına alınır. Route componentleri ince tutulur; iş mantığı sayfalara yığılmaz. Veri erişimi UI’dan ayrılır. Arama, filtre, sıralama ve sayfalama mümkün olduğunca URL ile senkron tutulur. Gerektiğinde route-level lazy loading kullanılır.

## 07.3 — Proje Yapısı
```text
NOVA/
├─ src/
│  ├─ app/ pages/ features/ components/
│  ├─ contracts/ lib/ hooks/ types/
│  ├─ constants/ styles/
│  └─ main.tsx
├─ worker/
│  ├─ routes/ middleware/ services/
│  ├─ repositories/ validation/ errors/ types/
│  └─ index.ts
├─ migrations/
├─ public/
├─ tests/
├─ vite.config.ts
├─ wrangler.jsonc
├─ package.json
└─ pnpm-lock.yaml
```

`@/` alias’ı `src/` kökünü gösterir. Derin göreli import ve gereksiz barrel file kullanılmaz.

## 07.4 — Veri Katmanı
Ana veritabanı **Cloudflare D1**, backend **Cloudflare Workers** olacaktır. React istemcisi D1’e doğrudan erişmez; tüm veri işlemleri Worker üzerindeki HTTP/JSON API’den geçer. Supabase gibi ikinci backend platformu V1’e eklenmez.

## 07.5 — Veri Modeli
Çekirdek tablolar: `categories`, `products`, `customers`, `orders`, `order_items`, `inventory_movements`, `settings`.

Kurallar:
- Para alanları kuruş bazlı `INTEGER`.
- `products.stock_quantity` güncel stok.
- `inventory_movements` stok geçmişi.
- Stok durumu miktar + ürün eşiğinden türetilir.
- Müşteri KPI’ları siparişlerden hesaplanır.
- `orders` ve `order_items` ayrıdır.
- Sipariş satırlarında ürün adı, SKU ve fiyat snapshot olarak korunur.
- `settings` tekil uygulama ayarıdır.

## 07.6 — Veri Erişim Mimarisi
V1’de ORM yoktur. **D1 Worker Binding API + prepared statements + parameter binding** kullanılır.

Akış: `Route → Service → Repository → D1`

Route HTTP ile, Service business rule ile, Repository SQL/veri erişimiyle ilgilenir. Dinamik SQL string interpolation ile oluşturulmaz. Kritik yazma işlemleri atomik yürütülür. Şema değişiklikleri `migrations/` altında versioned SQL migration olarak yönetilir. Production şeması elle değiştirilmez.

## 07.7 — Form ve Validasyon
Karmaşık formlarda **React Hook Form + Zod** kullanılır. Frontend validation UX içindir; API girdileri Worker tarafında yeniden doğrulanır.

Paylaşılan schema/type sözleşmeleri `src/contracts/` altında tutulur. Veri biçimi ve alanlar arası kurallar Zod ile; veritabanı veya sistem durumuna bağlı business rule’lar Service katmanında doğrulanır. Hatalarda form verisi korunur, ilk hatalı alana focus taşınır.

## 07.8 — State Yönetimi
- Local UI state → React
- Arama/filtre/sıralama/sayfalama → URL
- Form state → React Hook Form
- Server/API state → **TanStack Query**
- Düşük frekanslı app state → gerekirse Context
- Hesaplanabilir veri → derived
- Kullanıcı tercihi → gerekirse localStorage

Redux ve Zustand V1 başlangıcında kullanılmaz. localStorage iş verisinin kaynağı değildir. Query key yapısı modül bazında standartlaştırılır.

## 07.9 — Kimlik Doğrulama
Özel kullanıcı/parola sistemi geliştirilmeyecektir. Kimlik doğrulama **Cloudflare Access** ile sağlanır. V1 tek rol modelini korur; kullanıcı/rol/permission tabloları yoktur.

Worker, `Cf-Access-Jwt-Assertion` JWT’sini middleware seviyesinde doğrular; gerekirse `jose` kullanılır. Auth state localStorage veya global store’da tutulmaz. Local auth production’dan kesin olarak ayrılır.

## 07.10 — Loading, Error ve Empty State
İlk yüklemelerde uygun skeleton, küçük mutation’larda action-level loading kullanılır. Cache’de veri varken background refetch ekranı boşaltmaz.

Gerçek empty state ile filtre sonucu empty state ayrılır. Worker API standart hata sözleşmesi ve anlamlı HTTP durum kodları kullanır. Business/client hataları otomatik retry edilmez; geçici ağ/5xx hatalarında sınırlı retry uygulanabilir. Render/runtime hataları Error Boundary ile izole edilir.

## 07.11 — Güvenlik ve Veri Bütünlüğü
Server trust boundary esastır. Hassas değerler **Cloudflare Secrets** içinde tutulur; Vite client bundle’ına secret konmaz.

Admin frontend ve API mümkün olduğunca same-origin çalışır; permissive CORS kullanılmaz. Access JWT’ye ek olarak state-changing isteklerde CSRF koruması uygulanır. V1’de raw HTML ve `dangerouslySetInnerHTML` kullanılmaz.

Frontend’den gelen fiyat, stok, toplam, teslimat ücreti vb. authoritative kabul edilmez; Worker yeniden doğrular/hesaplar. Zod + Service business rules + D1 `NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY` constraint’leri birlikte kullanılır. Kritik mutation’lar atomiktir. Loglarda secret/token tutulmaz.

## 07.12 — Performans
Performans yaklaşımı ölçüme dayalıdır. Route-level lazy loading kullanılır. Filtreleme, sıralama ve pagination sunucu/veritabanı tarafında yapılır; büyük veri setleri istemciye gereksiz taşınmaz.

D1 sorguları yalnız gerekli kolonları okur. Index’ler gerçek sorgu kalıplarına göre eklenir. TanStack Query cache/refetch ayarları modül ihtiyacına göre yapılır. Görseller uygun boyutlarda optimize edilir.

## 07.13 — Test ve Kalite
Temel kalite kapısı: **TypeScript + ESLint + production build**.

Unit/integration: **Vitest**. Kritik E2E: **Playwright**. Öncelik validation, hesaplama, stok ve sipariş business rule’larındadır. Responsive, loading, error, empty-state, keyboard/focus ve temel accessibility manuel QA ile de doğrulanır.

## 07.14 — Git ve Codex Akışı
Ana branch `main`’dir. Küçük/düşük riskli işler kontrollü biçimde main üzerinde; büyük/riskli işler kısa ömürlü feature/fix branch’lerinde yapılabilir.

Her görev öncesi workspace, branch ve `git status` doğrulanır. Çalışan kod görev gerektirmedikçe değiştirilmez. Bir görev tek mantıksal değişiklik setidir; kapsam dışı refactor yapılmaz. Commit mesajları sade Conventional Commit biçimini izler. Kod değişiklikleri uygun typecheck/lint/test/build kontrollerinden geçer. Codex promptları amaç, kapsam, değiştirilmeyecek alanlar, kabul kriterleri ve QA içerir. FINAL/LOCKED kararlar Codex tarafından kendiliğinden değiştirilmez.

## 07.15 — Cloudflare Yayınlama
NOVA, **React/Vite SPA + Worker API + Static Assets** birleşik Cloudflare Workers deployment modeliyle yayınlanır. Resmi Cloudflare Vite Plugin kullanılır.

`/api/*` Worker API’ye, diğer uygulama rotaları SPA’ya yönlenir. `wrangler.jsonc` ana yapılandırmadır.

Ortamlar: **Local / Staging / Production**. Her ortam kendi D1 kaynağını kullanır; staging production D1’i paylaşmaz. Production Worker bütünüyle Cloudflare Access ile korunur. Frontend ve API same-origin çalışır.

Public yazılabilir demo V1 başlangıcında kurulmaz; gerekirse ayrı `demo` environment tasarlanır. Deployment öncesi kalite kontrolleri ve staging QA yapılır. Migration’larda mümkün olduğunca additive ve geri dönüşü kolay yaklaşım tercih edilir.

## 07.16 — Nihai Karar
07.1–07.15 kararları NOVA V1 için birbirleriyle uyumlu, uygulanabilir ve gereksiz karmaşıklıktan arındırılmış teknik temel olarak kabul edilmiştir.

Bu doküman bundan sonraki geliştirme için **varsayılan teknik referanstır**. Bir değişiklik gerektiğinde kilitli karar sessizce aşılmaz; önce mimari karar bilinçli olarak yeniden değerlendirilir.

**FINAL / LOCKED**
