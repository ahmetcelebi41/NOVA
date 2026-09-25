import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { OrderStatus, OverviewResponse } from '../contracts/index'
import { apiJson } from '../lib/api'
import SalesChart from './overview/SalesChart'
import './OverviewPage.css'

type Kpi = { href?: string; label: string; meta: string; value: string }

const currencyFormatter = new Intl.NumberFormat('tr-TR', { currency: 'TRY', style: 'currency' })
const percentageFormatter = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', hour: '2-digit', minute: '2-digit', month: 'short', timeZone: 'Europe/Istanbul', year: 'numeric' })
const orderStatusLabels: Record<OrderStatus, string> = { cancelled: 'İptal', completed: 'Tamamlandı', new: 'Yeni', preparing: 'Hazırlanıyor', ready_for_delivery: 'Teslimata Hazır' }
const stockStatusLabels = { low: 'Düşük Stok', out: 'Tükendi' } as const

function formatCurrency(valueMinor: number) { return currencyFormatter.format(valueMinor / 100) }
function salesComparison(current: number, previous: number) {
  if (previous === 0) return 'Dün karşılaştırılabilir satış yok'
  const change = ((current - previous) / previous) * 100
  if (change === 0) return 'Düne göre değişim yok'
  return `Düne göre %${percentageFormatter.format(Math.abs(change))} ${change > 0 ? 'artış' : 'azalış'}`
}
function orderComparison(current: number, previous: number) {
  const difference = current - previous
  if (difference === 0) return 'Düne göre değişim yok'
  return `Düne göre ${Math.abs(difference)} sipariş ${difference > 0 ? 'fazla' : 'az'}`
}

function KpiCard({ href, label, meta, value }: Kpi) {
  const content = <><span className="overview-kpi__label">{label}</span><strong className="overview-kpi__value">{value}</strong><span className="overview-kpi__meta">{meta}</span></>
  return href ? <Link className="overview-kpi overview-kpi--linked" to={href}>{content}</Link> : <article className="overview-kpi">{content}</article>
}

function OverviewContent({ data }: { data: OverviewResponse }) {
  const kpis: Kpi[] = [
    { label: 'Bugünkü Satış', meta: salesComparison(data.kpis.todaySalesMinor, data.kpis.yesterdaySalesMinor), value: formatCurrency(data.kpis.todaySalesMinor) },
    { label: 'Bugünkü Sipariş', meta: orderComparison(data.kpis.todayOrderCount, data.kpis.yesterdayOrderCount), value: String(data.kpis.todayOrderCount) },
    { href: '/siparisler?durum=bekliyor', label: 'Bekleyen Sipariş', meta: 'İşlem bekleyen siparişler', value: String(data.kpis.pendingOrderCount) },
    { href: '/stok?durum=dusuk', label: 'Düşük Stoklu Ürün', meta: 'Kontrol gerektiren ürünler', value: String(data.kpis.lowStockProductCount) },
  ]

  return <>
    <section aria-label="Temel performans göstergeleri" className="overview-kpis">{kpis.map((kpi) => <KpiCard {...kpi} key={kpi.label} />)}</section>
    <div className="overview-grid overview-grid--primary"><SalesChart salesPeriods={data.salesPeriods} /><section className="overview-section" aria-labelledby="order-status-title"><div className="overview-section__header"><div><h2 id="order-status-title">Sipariş Durumları</h2><p>Bugünkü operasyon özeti</p></div></div><ul className="overview-status-list">{data.orderStatuses.map((status) => <li key={status.status}><span>{orderStatusLabels[status.status]}</span><strong>{status.count}</strong></li>)}</ul></section></div>
    <div className="overview-grid overview-grid--secondary">
      <section className="overview-section" aria-labelledby="critical-stock-title"><div className="overview-section__header"><div><h2 id="critical-stock-title">Kritik Stoklar</h2><p>Hızlı müdahale gerektiren ürünler</p></div></div>{data.criticalInventory.length ? <ul className="overview-inventory-list">{data.criticalInventory.map((item) => <li key={item.id}><div><strong>{item.name}</strong><span>{item.stockQuantity} adet</span></div><span className="overview-status-text">{stockStatusLabels[item.status]}</span></li>)}</ul> : <p className="overview-empty">Kritik stok bulunmuyor.</p>}<Link className="overview-section__action" to="/stok?durum=dusuk">Tüm düşük stokları görüntüle</Link></section>
      <section className="overview-section" aria-labelledby="recent-orders-title"><div className="overview-section__header overview-section__header--action"><div><h2 id="recent-orders-title">Son Siparişler</h2><p>En yeni beş sipariş</p></div><Link className="overview-section__action" to="/siparisler">Tüm siparişleri görüntüle</Link></div>{data.recentOrders.length ? <div className="overview-orders" aria-label="Son siparişler"><div className="overview-orders__header" aria-hidden="true"><span>Sipariş No</span><span>Müşteri</span><span>Tarih</span><span>Tutar</span><span>Durum</span></div><ul className="overview-orders__list">{data.recentOrders.map((order) => <li key={order.id}><Link aria-label={`${order.orderNumber}, ${order.customerName}, ${dateFormatter.format(new Date(order.createdAt))}, ${formatCurrency(order.totalMinor)}, ${orderStatusLabels[order.status]}`} className="overview-orders__row" to={`/siparisler/${order.id}`}><span data-label="Sipariş No"><strong>{order.orderNumber}</strong></span><span data-label="Müşteri">{order.customerName}</span><span data-label="Tarih"><time dateTime={order.createdAt}>{dateFormatter.format(new Date(order.createdAt))}</time></span><span data-label="Tutar">{formatCurrency(order.totalMinor)}</span><span data-label="Durum"><span className="overview-status-text">{orderStatusLabels[order.status]}</span></span></Link></li>)}</ul></div> : <p className="overview-empty">Henüz sipariş bulunmuyor.</p>}</section>
    </div>
  </>
}

function OverviewPage() {
  const [reloadKey, setReloadKey] = useState(0)
  const [loadState, setLoadState] = useState<{ key: number; data: OverviewResponse | null; error: boolean }>({ key: -1, data: null, error: false })
  const isLoading = loadState.key !== reloadKey
  const data = isLoading ? null : loadState.data
  const hasError = !isLoading && loadState.error

  useEffect(() => {
    const controller = new AbortController()
    apiJson<OverviewResponse>('/api/overview', { signal: controller.signal })
      .then((response) => setLoadState({ key: reloadKey, data: response, error: false }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadState({ key: reloadKey, data: null, error: true })
      })
    return () => controller.abort()
  }, [reloadKey])

  return <div className="overview-page"><header className="overview-page__header"><h1 id="page-title">Genel Bakış</h1><p>İşletmenizin bugünkü performansını ve işlem bekleyen alanları takip edin.</p></header>{isLoading ? <section className="overview-section overview-state" role="status"><h2>Genel Bakış yükleniyor</h2><p>Lütfen bekleyin.</p></section> : hasError ? <section className="overview-section overview-state" role="alert"><h2>Genel Bakış yüklenemedi</h2><p>Bağlantıyı kontrol edip yeniden deneyin.</p><button onClick={() => setReloadKey((key) => key + 1)} type="button">Yeniden Dene</button></section> : data ? <OverviewContent data={data} /> : null}</div>
}

export default OverviewPage
