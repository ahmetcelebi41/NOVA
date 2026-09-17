import { Link } from 'react-router-dom'
import SalesChart from './overview/SalesChart'
import './OverviewPage.css'

type Kpi = {
  href?: string
  label: string
  meta: string
  value: string
}

type OrderStatus = 'Yeni' | 'Hazırlanıyor' | 'Teslimata Hazır' | 'Tamamlandı'

type InventoryStatus = 'Düşük Stok' | 'Tükendi'

type RecentOrder = {
  amount: number
  customer: string
  date: string
  id: string
  number: string
  status: OrderStatus
}

const numberFormatter = new Intl.NumberFormat('tr-TR')
const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatCurrency(value: number) {
  return `${numberFormatter.format(value)} TL`
}

const kpis: Kpi[] = [
  {
    label: 'Bugünkü Satış',
    meta: 'Düne göre %12,4 artış',
    value: formatCurrency(18450),
  },
  {
    label: 'Bugünkü Sipariş',
    meta: 'Düne göre 3 sipariş fazla',
    value: '24',
  },
  {
    href: '/siparisler?durum=bekliyor',
    label: 'Bekleyen Sipariş',
    meta: 'İşlem bekleyen siparişler',
    value: '7',
  },
  {
    href: '/stok?durum=dusuk',
    label: 'Düşük Stoklu Ürün',
    meta: 'Kontrol gerektiren ürünler',
    value: '4',
  },
]

const orderStatuses: Array<{ count: number; label: OrderStatus }> = [
  { count: 8, label: 'Yeni' },
  { count: 6, label: 'Hazırlanıyor' },
  { count: 5, label: 'Teslimata Hazır' },
  { count: 18, label: 'Tamamlandı' },
]

const criticalInventory: Array<{
  name: string
  quantity: number
  status: InventoryStatus
}> = [
  { name: 'Antep Fıstıklı Baklava', quantity: 2, status: 'Düşük Stok' },
  { name: 'Frambuazlı Cheesecake', quantity: 0, status: 'Tükendi' },
  { name: 'Çikolatalı Makaron', quantity: 3, status: 'Düşük Stok' },
  { name: 'San Sebastian', quantity: 1, status: 'Düşük Stok' },
  { name: 'Limonlu Tart', quantity: 0, status: 'Tükendi' },
]

const recentOrders: RecentOrder[] = [
  {
    amount: 1280,
    customer: 'Elif Kaya',
    date: '2026-09-17T12:40:00+03:00',
    id: '1048',
    number: '#1048',
    status: 'Yeni',
  },
  {
    amount: 860,
    customer: 'Mert Demir',
    date: '2026-09-17T11:15:00+03:00',
    id: '1047',
    number: '#1047',
    status: 'Hazırlanıyor',
  },
  {
    amount: 2140,
    customer: 'Zeynep Şahin',
    date: '2026-09-17T10:05:00+03:00',
    id: '1046',
    number: '#1046',
    status: 'Teslimata Hazır',
  },
  {
    amount: 625,
    customer: 'Can Aydın',
    date: '2026-09-17T09:20:00+03:00',
    id: '1045',
    number: '#1045',
    status: 'Tamamlandı',
  },
  {
    amount: 1535,
    customer: 'Selin Arslan',
    date: '2026-09-16T18:35:00+03:00',
    id: '1044',
    number: '#1044',
    status: 'Tamamlandı',
  },
]

function KpiCard({ href, label, meta, value }: Kpi) {
  const content = (
    <>
      <span className="overview-kpi__label">{label}</span>
      <strong className="overview-kpi__value">{value}</strong>
      <span className="overview-kpi__meta">{meta}</span>
    </>
  )

  if (href) {
    return (
      <Link className="overview-kpi overview-kpi--linked" to={href}>
        {content}
      </Link>
    )
  }

  return <article className="overview-kpi">{content}</article>
}

function OverviewPage() {
  return (
    <div className="overview-page">
      <header className="overview-page__header">
        <h1 id="page-title">Genel Bakış</h1>
        <p>İşletmenizin bugünkü performansını ve işlem bekleyen alanları takip edin.</p>
      </header>

      <section aria-label="Temel performans göstergeleri" className="overview-kpis">
        {kpis.map((kpi) => (
          <KpiCard {...kpi} key={kpi.label} />
        ))}
      </section>

      <div className="overview-grid overview-grid--primary">
        <SalesChart />

        <section className="overview-section" aria-labelledby="order-status-title">
          <div className="overview-section__header">
            <div>
              <h2 id="order-status-title">Sipariş Durumları</h2>
              <p>Bugünkü operasyon özeti</p>
            </div>
          </div>

          <ul className="overview-status-list">
            {orderStatuses.map((status) => (
              <li key={status.label}>
                <span>{status.label}</span>
                <strong>{status.count}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="overview-grid overview-grid--secondary">
        <section className="overview-section" aria-labelledby="critical-stock-title">
          <div className="overview-section__header">
            <div>
              <h2 id="critical-stock-title">Kritik Stoklar</h2>
              <p>Hızlı müdahale gerektiren ürünler</p>
            </div>
          </div>

          <ul className="overview-inventory-list">
            {criticalInventory.map((item) => (
              <li key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.quantity} adet</span>
                </div>
                <span className="overview-status-text">{item.status}</span>
              </li>
            ))}
          </ul>

          <Link className="overview-section__action" to="/stok?durum=dusuk">
            Tüm düşük stokları görüntüle
          </Link>
        </section>

        <section className="overview-section" aria-labelledby="recent-orders-title">
          <div className="overview-section__header overview-section__header--action">
            <div>
              <h2 id="recent-orders-title">Son Siparişler</h2>
              <p>En yeni beş sipariş</p>
            </div>
            <Link className="overview-section__action" to="/siparisler">
              Tüm siparişleri görüntüle
            </Link>
          </div>

          <div className="overview-orders" aria-label="Son siparişler">
            <div className="overview-orders__header" aria-hidden="true">
              <span>Sipariş No</span>
              <span>Müşteri</span>
              <span>Tarih</span>
              <span>Tutar</span>
              <span>Durum</span>
            </div>
            <ul className="overview-orders__list">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    aria-label={`${order.number}, ${order.customer}, ${dateFormatter.format(new Date(order.date))}, ${formatCurrency(order.amount)}, ${order.status}`}
                    className="overview-orders__row"
                    to={`/siparisler/${order.id}`}
                  >
                    <span data-label="Sipariş No">
                      <strong>{order.number}</strong>
                    </span>
                    <span data-label="Müşteri">{order.customer}</span>
                    <span data-label="Tarih">
                      <time dateTime={order.date}>{dateFormatter.format(new Date(order.date))}</time>
                    </span>
                    <span data-label="Tutar">{formatCurrency(order.amount)}</span>
                    <span data-label="Durum">
                      <span className="overview-status-text">{order.status}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

export default OverviewPage
