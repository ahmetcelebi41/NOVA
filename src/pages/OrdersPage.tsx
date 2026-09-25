import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { OrderDateFilter, OrderListItem, OrderListResponse, OrderStatus, OrderStatusFilter } from '../contracts/orders'
import { apiJson } from '../lib/api'
import './OrdersPage.css'

type FilterControlsProps = { containerId?: string; dateFilter: string; idPrefix: string; onDateChange: (value: string) => void; onSearchChange: (value: string) => void; query: string }

const statusOptions = [
  { label: 'Tümü', value: '' }, { label: 'Yeni', value: 'yeni' },
  { label: 'Hazırlanıyor', value: 'hazirlaniyor' }, { label: 'Teslimata Hazır', value: 'hazir' },
  { label: 'Tamamlandı', value: 'tamamlandi' }, { label: 'İptal', value: 'iptal' },
]
const apiStatusByQuery = new Map<string, OrderStatusFilter>([
  ['bekliyor', 'pending'], ['yeni', 'new'], ['hazirlaniyor', 'preparing'],
  ['hazir', 'ready_for_delivery'], ['tamamlandi', 'completed'], ['iptal', 'cancelled'],
])
const orderStatusLabels: Record<OrderStatus, string> = {
  cancelled: 'İptal', completed: 'Tamamlandı', new: 'Yeni', preparing: 'Hazırlanıyor', ready_for_delivery: 'Teslimata Hazır',
}
const dateOptions = [
  { label: 'Tüm tarihler', value: '' }, { label: 'Bugün', value: 'bugun' },
  { label: 'Son 7 Gün', value: '7gun' }, { label: 'Son 30 Gün', value: '30gun' },
]
const dateFilterLabels = new Map(dateOptions.map((option) => [option.value, option.label]))
const statusFilterLabels = new Map(statusOptions.map((option) => [option.value, option.label]))
statusFilterLabels.set('bekliyor', 'Bekleyen Siparişler')
const currencyFormatter = new Intl.NumberFormat('tr-TR', { currency: 'TRY', style: 'currency' })
const dateFormatter = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', hour: '2-digit', minute: '2-digit', month: 'short', timeZone: 'Europe/Istanbul', year: 'numeric' })

function formatCurrency(valueMinor: number) { return currencyFormatter.format(valueMinor / 100) }
function formatProducts(order: OrderListItem) { return order.productNames.length ? order.productNames.join(', ') : `${order.itemCount} ürün` }
function createOrderDetailPath(orderId: number, query: string) { return `/siparisler/${orderId}${query ? `?${query}` : ''}` }

function createApiQuery(status: string, date: string, query: string, page: number) {
  const params = new URLSearchParams({ page: String(page) })
  const apiStatus = apiStatusByQuery.get(status)
  if (apiStatus) params.set('status', apiStatus)
  if (date) params.set('date', date as OrderDateFilter)
  if (query.trim()) params.set('q', query.trim())
  return params.toString()
}

function FilterControls({ containerId, dateFilter, idPrefix, onDateChange, onSearchChange, query }: FilterControlsProps) {
  return <div className="orders-filter-fields" id={containerId}><div className="orders-field orders-field--search"><label htmlFor={`${idPrefix}-order-search`}>Sipariş ara</label><input id={`${idPrefix}-order-search`} onChange={(event) => onSearchChange(event.target.value)} placeholder="Sipariş no, müşteri, telefon veya e-posta" type="search" value={query} /></div><div className="orders-field"><label htmlFor={`${idPrefix}-date-filter`}>Tarih</label><select id={`${idPrefix}-date-filter`} onChange={(event) => onDateChange(event.target.value)} value={dateFilter}>{dateOptions.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}</select></div><div className="orders-sort" aria-label="Sıralama"><span>Sıralama</span><strong>En Yeni</strong></div></div>
}

function OrderCards({ orders, query }: { orders: OrderListItem[]; query: string }) {
  return <ul className="orders-cards">{orders.map((order) => <li key={order.id}><Link aria-label={`${order.orderNumber}, ${order.customerName}, ${dateFormatter.format(new Date(order.createdAt))}, ${formatProducts(order)}, ${formatCurrency(order.totalMinor)}, ${orderStatusLabels[order.status]}. Detayı gör`} className="orders-list__row" to={createOrderDetailPath(order.id, query)}><span data-label="Sipariş No"><strong>{order.orderNumber}</strong></span><span data-label="Müşteri">{order.customerName}</span><span data-label="Tarih"><time dateTime={order.createdAt}>{dateFormatter.format(new Date(order.createdAt))}</time></span><span data-label="Ürün">{formatProducts(order)}</span><span className="orders-list__amount" data-label="Tutar">{formatCurrency(order.totalMinor)}</span><span data-label="Durum"><span className="orders-status-text">{orderStatusLabels[order.status]}</span></span><span className="orders-list__action" data-label="Aksiyon">Detayı Gör</span></Link></li>)}</ul>
}

function OrdersTable({ orders, query }: { orders: OrderListItem[]; query: string }) {
  return <table className="orders-table"><thead><tr><th scope="col">Sipariş No</th><th scope="col">Müşteri</th><th scope="col">Tarih</th><th scope="col">Ürün</th><th className="orders-table__amount" scope="col">Tutar</th><th scope="col">Durum</th><th scope="col">Aksiyon</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.orderNumber}</strong></td><td>{order.customerName}</td><td><time dateTime={order.createdAt}>{dateFormatter.format(new Date(order.createdAt))}</time></td><td>{formatProducts(order)}</td><td className="orders-table__amount">{formatCurrency(order.totalMinor)}</td><td><span className="orders-status-text">{orderStatusLabels[order.status]}</span></td><td><Link aria-label={`${order.orderNumber} siparişinin detayını gör`} className="orders-table__action" to={createOrderDetailPath(order.id, query)}>Detayı Gör</Link></td></tr>)}</tbody></table>
}

function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mobileFiltersRef = useRef<HTMLDetailsElement>(null)
  const mobileFiltersSummaryRef = useRef<HTMLElement>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [loadState, setLoadState] = useState<{ key: string; data: OrderListResponse | null; error: boolean }>({ key: '', data: null, error: false })
  const requestedStatus = searchParams.get('durum') ?? ''
  const requestedDate = searchParams.get('tarih') ?? ''
  const selectedStatus = apiStatusByQuery.has(requestedStatus) ? requestedStatus : ''
  const selectedDate = dateFilterLabels.has(requestedDate) ? requestedDate : ''
  const query = searchParams.get('q') ?? ''
  const requestedPageValue = Number(searchParams.get('sayfa') ?? '1')
  const requestedPage = Number.isInteger(requestedPageValue) && requestedPageValue > 0 ? requestedPageValue : 1
  const apiQuery = createApiQuery(selectedStatus, selectedDate, query, requestedPage)
  const requestKey = `${apiQuery}:${reloadKey}`
  const isLoading = loadState.key !== requestKey
  const response = isLoading ? null : loadState.data
  const hasError = !isLoading && loadState.error
  const orders = response?.items ?? []
  const totalItems = response?.totalItems ?? 0
  const currentPage = response?.page ?? requestedPage
  const pageCount = Math.max(1, response?.totalPages ?? 1)
  const hasActiveFilters = Boolean(selectedStatus || selectedDate || query)
  const preservedQuery = searchParams.toString()

  useEffect(() => {
    const controller = new AbortController()
    apiJson<OrderListResponse>(`/api/orders?${apiQuery}`, { signal: controller.signal })
      .then((data) => setLoadState({ key: requestKey, data, error: false }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadState({ key: requestKey, data: null, error: true })
      })
    return () => controller.abort()
  }, [apiQuery, requestKey])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (requestedStatus && !apiStatusByQuery.has(requestedStatus)) next.delete('durum')
    if (requestedDate && !dateFilterLabels.has(requestedDate)) next.delete('tarih')
    const page = response && requestedPage > pageCount ? pageCount : requestedPage
    if (page === 1) next.delete('sayfa'); else next.set('sayfa', String(page))
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true })
  }, [pageCount, requestedDate, requestedPage, requestedStatus, response, searchParams, setSearchParams])

  const updateSearchParams = (updates: Record<string, string | null>, options: { replace?: boolean } = {}) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    setSearchParams(next, options)
  }
  const setFilter = (key: 'durum' | 'tarih', value: string) => updateSearchParams({ [key]: value || null, sayfa: null })
  const setPage = (page: number) => updateSearchParams({ sayfa: page === 1 ? null : String(page) })
  const handleMobileFiltersKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => { if (event.key === 'Escape' && mobileFiltersRef.current?.open) { event.preventDefault(); mobileFiltersRef.current.open = false; mobileFiltersSummaryRef.current?.focus() } }

  return <div className="orders-page">
    <header className="orders-page__header"><div><h1 id="page-title">Siparişler</h1><p>Siparişleri bulun, filtreleyin ve detaylarını görüntüleyin.</p></div><Link className="orders-page__primary-action" to="/siparisler/yeni">Yeni Sipariş</Link></header>
    <section aria-labelledby="order-status-filters-title" className="orders-status-section"><h2 className="orders-visually-hidden" id="order-status-filters-title">Sipariş durumları</h2><div className="orders-status-filters">{statusOptions.map((status) => <button aria-pressed={selectedStatus === status.value} key={status.value || 'all'} onClick={() => setFilter('durum', status.value)} type="button">{status.label}</button>)}</div></section>
    <section aria-label="Sipariş arama, filtreleme ve sıralama" className="orders-toolbar"><div className="orders-toolbar__desktop"><FilterControls dateFilter={selectedDate} idPrefix="desktop" onDateChange={(value) => setFilter('tarih', value)} onSearchChange={(value) => updateSearchParams({ q: value || null, sayfa: null }, { replace: true })} query={query} /></div><details className="orders-filter-drawer" onKeyDown={handleMobileFiltersKeyDown} ref={mobileFiltersRef}><summary aria-controls="mobile-order-filter-fields" ref={mobileFiltersSummaryRef}>Arama, filtre ve sıralama</summary><FilterControls containerId="mobile-order-filter-fields" dateFilter={selectedDate} idPrefix="mobile" onDateChange={(value) => setFilter('tarih', value)} onSearchChange={(value) => updateSearchParams({ q: value || null, sayfa: null }, { replace: true })} query={query} /></details>{hasActiveFilters ? <div className="orders-active-filters" aria-label="Aktif filtreler"><div><strong>Aktif filtreler</strong>{selectedStatus ? <span>Durum: {statusFilterLabels.get(selectedStatus)}</span> : null}{selectedDate ? <span>Tarih: {dateFilterLabels.get(selectedDate)}</span> : null}{query ? <span>Arama: “{query}”</span> : null}</div><button onClick={() => setSearchParams({})} type="button">Filtreleri Temizle</button></div> : null}</section>
    <section aria-labelledby="orders-list-title" className="orders-list-section"><div className="orders-list-section__header"><div><h2 id="orders-list-title">Sipariş Listesi</h2><p aria-live="polite">{isLoading ? 'Yükleniyor…' : `${totalItems} sipariş`}</p></div></div>{hasError ? <div className="orders-no-results" role="alert"><h3>Siparişler yüklenemedi</h3><p>Bağlantıyı kontrol edip yeniden deneyin.</p><button onClick={() => setReloadKey((key) => key + 1)} type="button">Yeniden Dene</button></div> : isLoading ? <div className="orders-no-results" role="status"><h3>Siparişler yükleniyor</h3><p>Lütfen bekleyin.</p></div> : orders.length ? <div className="orders-list" aria-label="Siparişler"><OrdersTable orders={orders} query={preservedQuery} /><OrderCards orders={orders} query={preservedQuery} /></div> : <div className="orders-no-results" role="status"><h3>Sonuç bulunamadı</h3><p>Arama veya filtreleri değiştirerek yeniden deneyin.</p>{hasActiveFilters ? <button onClick={() => setSearchParams({})} type="button">Filtreleri Temizle</button> : null}</div>}{!isLoading && !hasError && pageCount > 1 ? <nav aria-label="Sipariş sayfaları" className="orders-pagination"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} type="button">Önceki</button><div>{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <button aria-current={page === currentPage ? 'page' : undefined} aria-label={`${page}. sayfa`} key={page} onClick={() => setPage(page)} type="button">{page}</button>)}</div><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} type="button">Sonraki</button><span>Sayfa {currentPage} / {pageCount} · Sayfa başına {response?.pageSize ?? 20} kayıt</span></nav> : null}</section>
  </div>
}

export default OrdersPage
