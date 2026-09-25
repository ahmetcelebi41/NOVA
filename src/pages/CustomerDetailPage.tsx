import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type {
  CustomerDetailResponse,
  CustomerOrderStatus,
  CustomerRecentOrder,
  CustomerStatus,
} from '../contracts/customers'
import { ApiError, apiJson } from '../lib/api'
import './CustomerDetailPage.css'

const customerStatusLabels: Record<CustomerStatus, string> = { inactive: 'Pasif', new: 'Yeni', repeat: 'Tekrar' }
const orderStatusLabels: Record<CustomerOrderStatus, string> = {
  cancelled: 'İptal', completed: 'Tamamlandı', new: 'Yeni', preparing: 'Hazırlanıyor', ready_for_delivery: 'Teslimata Hazır',
}
const currencyFormatter = new Intl.NumberFormat('tr-TR', { currency: 'TRY', style: 'currency' })
const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', timeZone: 'Europe/Istanbul', year: 'numeric' })

function formatCurrency(valueMinor: number) { return currencyFormatter.format(valueMinor / 100) }
function formatDate(value: string) { return dateFormatter.format(new Date(value)) }
function orderProducts(order: CustomerRecentOrder) {
  if (!order.productNames.length) return `${order.itemCount} ürün`
  return order.productNames.join(', ')
}

function CustomerOrdersTable({ orders }: { orders: CustomerRecentOrder[] }) {
  return <table className="customer-orders-table"><thead><tr><th scope="col">Sipariş No</th><th scope="col">Tarih</th><th scope="col">Ürün</th><th className="customer-orders-table__number" scope="col">Tutar</th><th scope="col">Durum</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><Link to={`/siparisler/${order.id}`}>{order.orderNumber}</Link></td><td><time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time></td><td>{orderProducts(order)}</td><td className="customer-orders-table__number">{formatCurrency(order.totalMinor)}</td><td><span className="customer-order-status">{orderStatusLabels[order.status]}</span></td></tr>)}</tbody></table>
}

function CustomerOrderCards({ orders }: { orders: CustomerRecentOrder[] }) {
  return <ul className="customer-order-cards">{orders.map((order) => <li key={order.id}><article className="customer-order-card"><header><Link to={`/siparisler/${order.id}`}>{order.orderNumber}</Link><span className="customer-order-status">{orderStatusLabels[order.status]}</span></header><dl><div><dt>Tarih</dt><dd><time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time></dd></div><div><dt>Ürün</dt><dd>{orderProducts(order)}</dd></div><div><dt>Tutar</dt><dd>{formatCurrency(order.totalMinor)}</dd></div></dl></article></li>)}</ul>
}

function CustomerDetailContent({ data, listPath }: { data: CustomerDetailResponse; listPath: string }) {
  const { customer, metrics, recentOrders } = data
  return (
    <article className="customer-detail-page">
      <Link className="customer-detail-page__back" to={listPath}>Müşterilere geri dön</Link>
      <header className="customer-detail-page__header"><div><h1 id="page-title">{customer.name}</h1><p>Müşteri Detayı</p></div>{customer.status ? <span aria-label={`Müşteri durumu: ${customerStatusLabels[customer.status]}`}>{customerStatusLabels[customer.status]}</span> : null}</header>
      <section aria-labelledby="customer-summary-title" className="customer-detail-section"><h2 id="customer-summary-title">Müşteri Özeti</h2><dl className="customer-metrics"><div><dt>Geçerli Sipariş</dt><dd>{metrics.validOrderCount}</dd></div><div><dt>Tamamlanmış Sipariş</dt><dd>{metrics.completedOrderCount}</dd></div><div><dt>Toplam Harcama</dt><dd>{formatCurrency(metrics.totalSpendMinor)}</dd></div><div><dt>Ortalama Sipariş Tutarı</dt><dd>{metrics.completedOrderCount ? formatCurrency(metrics.averageOrderMinor) : '—'}</dd></div></dl></section>
      <section aria-labelledby="customer-contact-title" className="customer-detail-section"><h2 id="customer-contact-title">İletişim</h2><address className="customer-contact"><div><span>Telefon</span><strong>{customer.phone}</strong></div><div><span>E-posta</span><strong>{customer.email ?? '—'}</strong></div>{customer.address ? <div><span>Adres</span><strong>{customer.address}</strong></div> : null}</address></section>
      <section aria-labelledby="customer-orders-title" className="customer-detail-section"><div className="customer-orders-header"><div><h2 id="customer-orders-title">Son Siparişler</h2><p>En yeni {recentOrders.length} sipariş</p></div><Link to={`/siparisler?q=${encodeURIComponent(customer.name)}`}>Tüm siparişleri görüntüle</Link></div>{recentOrders.length ? <div className="customer-orders-list"><CustomerOrdersTable orders={recentOrders} /><CustomerOrderCards orders={recentOrders} /></div> : <p>Henüz sipariş bulunmuyor.</p>}</section>
    </article>
  )
}

function CustomerDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${id ?? ''}:${reloadKey}`
  const [loadState, setLoadState] = useState<{ key: string; data: CustomerDetailResponse | null; error: 'not-found' | 'request' | null }>({ key: '', data: null, error: null })
  const isLoading = loadState.key !== requestKey
  const data = isLoading ? null : loadState.data
  const error = isLoading ? null : loadState.error
  const preservedQuery = searchParams.toString()
  const listPath = `/musteriler${preservedQuery ? `?${preservedQuery}` : ''}`

  useEffect(() => {
    const controller = new AbortController()
    apiJson<CustomerDetailResponse>(`/api/customers/${id ?? ''}`, { signal: controller.signal })
      .then((response) => setLoadState({ key: requestKey, data: response, error: null }))
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return
        setLoadState({ key: requestKey, data: null, error: caught instanceof ApiError && caught.status === 404 ? 'not-found' : 'request' })
      })
    return () => controller.abort()
  }, [id, requestKey])

  if (isLoading) return <section className="customer-detail-not-found" aria-labelledby="page-title"><h1 id="page-title">Müşteri yükleniyor</h1><p>Lütfen bekleyin.</p></section>
  if (error) return <section aria-labelledby="page-title" className="customer-detail-not-found"><h1 id="page-title">{error === 'not-found' ? 'Müşteri bulunamadı' : 'Müşteri yüklenemedi'}</h1><p>{error === 'not-found' ? 'Aradığınız müşteri kaydı bulunamadı.' : 'Bağlantıyı kontrol edip yeniden deneyin.'}</p>{error === 'request' ? <button onClick={() => setReloadKey((key) => key + 1)} type="button">Yeniden Dene</button> : null}<Link to={listPath}>Müşterilere geri dön</Link></section>
  return data ? <CustomerDetailContent data={data} listPath={listPath} /> : null
}

export default CustomerDetailPage
