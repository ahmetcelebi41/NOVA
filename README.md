# NOVA

Küçük e-ticaret ve perakende işletmeleri için modern yönetim paneli. Eğitim ve portföy projesi olarak geliştirilmiştir.

## Özellikler

- Genel Bakış
- Siparişler
- Sipariş oluşturma
- Sipariş durum yönetimi ve iptal
- Ürün yönetimi
- Stok yönetimi ve hareket geçmişi
- Müşteriler
- Analizler
- Ayarlar

## Teknik Yapı

- React 19
- TypeScript
- Vite
- React Router
- Cloudflare Workers
- Cloudflare D1
- React Hook Form
- Zod

Proje dizinleri:

- Frontend: `src/`
- Worker API: `worker/`
- Shared contracts: `src/contracts/`
- D1 migrations: `migrations/`

## Öne Çıkan Teknik Noktalar

- Products, Stock, Customers, Orders ve Settings için gerçek D1 API entegrasyonu
- Atomik sipariş oluşturma
- Concurrent stok koruması ve oversell engelleme
- Inventory movement geçmişi
- Sipariş iptalinde atomik stok iadesi
- Historical customer/product snapshot yapısı
- Responsive dashboard
- Production Basic Auth
- Production ve development için ayrı D1 kaynakları

## Production

[https://nova-production.moonphase.workers.dev](https://nova-production.moonphase.workers.dev)

Production ortamı Basic Auth ile korunmaktadır.

- Production D1: `nova-prod`
- Development D1: `nova-dev`

## Local Development

```powershell
corepack.cmd pnpm install
corepack.cmd pnpm dev
```

## Build / Deploy

```powershell
corepack.cmd pnpm build
corepack.cmd pnpm run deploy:production
```

Production secret değerleri repository dışında, Cloudflare üzerinden yönetilir.

## Durum

Project status: **Production / Completed**

September 2026
