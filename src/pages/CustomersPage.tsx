import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type {
  CustomerListItem,
  CustomerListResponse,
  CustomerStatus,
} from '../contracts/customers'
import { apiJson } from '../lib/api'
import './CustomersPage.css'

type CustomerFilter = '' | 'yeni' | 'tekrar' | 'pasif'

const quickFilters: { label: string; value: CustomerFilter }[] = [
  { label: 'Tümü', value: '' },
  { label: 'Yeni', value: 'yeni' },
  { label: 'Tekrar', value: 'tekrar' },
  { label: 'Pasif', value: 'pasif' },
]

const quickFilterLabels = new Map(quickFilters.map((filter) => [filter.value, filter.label]))
const validFilterValues = new Set<CustomerFilter>(quickFilters.map((filter) => filter.value))
const apiStatusByFilter: Record<Exclude<CustomerFilter, ''>, CustomerStatus> = {
  yeni: 'new',
  pasif: 'inactive',
  tekrar: 'repeat',
}
const customerStatusLabels: Record<CustomerStatus, string> = {
  inactive: 'Pasif',
  new: 'Yeni',
  repeat: 'Tekrar',
}

const currencyFormatter = new Intl.NumberFormat('tr-TR', { currency: 'TRY', style: 'currency' })
const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
})

function formatCurrency(valueMinor: number) {
  return currencyFormatter.format(valueMinor / 100)
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function customerDetailPath(id: number, queryString: string) {
  return `/musteriler/${id}${queryString ? `?${queryString}` : ''}`
}

function createApiQuery(filter: CustomerFilter, query: string, page: number) {
  const params = new URLSearchParams({ page: String(page) })
  if (filter) params.set('status', apiStatusByFilter[filter])
  if (query.trim()) params.set('q', query.trim())
  return params.toString()
}

function CustomerTable({ customers, queryString }: { customers: CustomerListItem[]; queryString: string }) {
  return (
    <table className="customers-table">
      <thead><tr><th scope="col">Müşteri</th><th scope="col">İletişim</th><th className="customers-table__number" scope="col">Sipariş Sayısı</th><th className="customers-table__number" scope="col">Toplam Harcama</th><th scope="col">Son Sipariş</th><th scope="col">Durum</th><th scope="col">Aksiyon</th></tr></thead>
      <tbody>
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td><strong>{customer.name}</strong></td>
            <td><span className="customers-table__contact">{customer.phone}</span><span className="customers-table__contact">{customer.email ?? '—'}</span></td>
            <td className="customers-table__number">{customer.orderCount}</td>
            <td className="customers-table__number">{formatCurrency(customer.totalSpendMinor)}</td>
            <td>{customer.lastOrderAt ? <time dateTime={customer.lastOrderAt}>{formatDate(customer.lastOrderAt)}</time> : '—'}</td>
            <td>{customer.status ? <span className="customer-status">{customerStatusLabels[customer.status]}</span> : null}</td>
            <td><Link className="customers-detail-link" to={customerDetailPath(customer.id, queryString)}>Detayı Gör</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CustomerCards({ customers, queryString }: { customers: CustomerListItem[]; queryString: string }) {
  return (
    <ul className="customer-cards">
      {customers.map((customer) => (
        <li key={customer.id}>
          <article className="customer-card">
            <header><strong>{customer.name}</strong>{customer.status ? <span className="customer-status">{customerStatusLabels[customer.status]}</span> : null}</header>
            <dl>
              <div><dt>Telefon</dt><dd>{customer.phone}</dd></div>
              <div><dt>E-posta</dt><dd>{customer.email ?? '—'}</dd></div>
              <div><dt>Sipariş Sayısı</dt><dd>{customer.orderCount}</dd></div>
              <div><dt>Toplam Harcama</dt><dd>{formatCurrency(customer.totalSpendMinor)}</dd></div>
              <div><dt>Son Sipariş</dt><dd>{customer.lastOrderAt ? <time dateTime={customer.lastOrderAt}>{formatDate(customer.lastOrderAt)}</time> : '—'}</dd></div>
            </dl>
            <Link className="customers-detail-link" to={customerDetailPath(customer.id, queryString)}>Detayı Gör</Link>
          </article>
        </li>
      ))}
    </ul>
  )
}

function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [reloadKey, setReloadKey] = useState(0)
  const [loadState, setLoadState] = useState<{ key: string; data: CustomerListResponse | null; error: boolean }>({ key: '', data: null, error: false })
  const requestedFilter = searchParams.get('durum') ?? ''
  const selectedFilter = validFilterValues.has(requestedFilter as CustomerFilter) ? requestedFilter as CustomerFilter : ''
  const query = searchParams.get('q') ?? ''
  const requestedPageValue = Number(searchParams.get('sayfa') ?? '1')
  const requestedPage = Number.isInteger(requestedPageValue) && requestedPageValue > 0 ? requestedPageValue : 1
  const apiQuery = createApiQuery(selectedFilter, query, requestedPage)
  const requestKey = `${apiQuery}:${reloadKey}`
  const isLoading = loadState.key !== requestKey
  const response = isLoading ? null : loadState.data
  const hasError = !isLoading && loadState.error
  const currentPage = response?.page ?? requestedPage
  const pageCount = Math.max(1, response?.totalPages ?? 1)
  const customers = response?.items ?? []
  const totalItems = response?.totalItems ?? 0
  const hasActiveFilters = Boolean(selectedFilter || query)
  const queryString = searchParams.toString()

  useEffect(() => {
    const controller = new AbortController()
    apiJson<CustomerListResponse>(`/api/customers?${apiQuery}`, { signal: controller.signal })
      .then((data) => setLoadState({ key: requestKey, data, error: false }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadState({ key: requestKey, data: null, error: true })
      })
    return () => controller.abort()
  }, [apiQuery, requestKey])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)
    if (requestedFilter && !validFilterValues.has(requestedFilter as CustomerFilter)) nextParams.delete('durum')
    const normalizedPage = response && requestedPage > pageCount ? pageCount : requestedPage
    if (normalizedPage === 1) nextParams.delete('sayfa')
    else nextParams.set('sayfa', String(normalizedPage))
    if (nextParams.toString() !== searchParams.toString()) setSearchParams(nextParams, { replace: true })
  }, [pageCount, requestedFilter, requestedPage, response, searchParams, setSearchParams])

  const updateSearchParams = (updates: Record<string, string | null>, options: { replace?: boolean } = {}) => {
    const nextParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => value ? nextParams.set(key, value) : nextParams.delete(key))
    setSearchParams(nextParams, options)
  }

  return (
    <div className="customers-page">
      <header className="customers-page__header"><h1 id="page-title">Müşteriler</h1><p>Müşteri ilişkilerini, sipariş sayılarını ve harcama özetlerini görüntüleyin.</p></header>
      <section aria-labelledby="customer-segments-title" className="customer-segments-section">
        <h2 className="customers-visually-hidden" id="customer-segments-title">Müşteri hızlı segmentleri</h2>
        <div className="customer-segments">{quickFilters.map((filter) => <button aria-pressed={selectedFilter === filter.value} key={filter.value || 'all'} onClick={() => updateSearchParams({ durum: filter.value || null, sayfa: null })} type="button">{filter.label}</button>)}</div>
      </section>
      <section aria-label="Müşteri arama ve filtreleme" className="customers-toolbar">
        <div className="customers-field"><label htmlFor="customer-search">Müşterilerde ara</label><input id="customer-search" onChange={(event) => updateSearchParams({ q: event.target.value || null, sayfa: null }, { replace: true })} placeholder="Ad, telefon veya e-posta" type="search" value={query} /></div>
        {hasActiveFilters ? <div className="customers-active-filters" aria-label="Aktif filtreler"><div><strong>Aktif filtreler</strong>{selectedFilter ? <span>Durum: {quickFilterLabels.get(selectedFilter)}</span> : null}{query ? <span>Arama: “{query}”</span> : null}</div><button onClick={() => setSearchParams({})} type="button">Filtreleri Temizle</button></div> : null}
      </section>
      <section aria-labelledby="customer-list-title" className="customers-list-section">
        <div className="customers-list-section__header"><h2 id="customer-list-title">Müşteri Listesi</h2><p aria-live="polite">{isLoading ? 'Yükleniyor…' : `${totalItems} müşteri`}</p></div>
        {hasError ? <div className="customers-no-results" role="alert"><h3>Müşteriler yüklenemedi</h3><p>Bağlantıyı kontrol edip yeniden deneyin.</p><button onClick={() => setReloadKey((key) => key + 1)} type="button">Yeniden Dene</button></div> : isLoading ? <div className="customers-no-results" role="status"><h3>Müşteriler yükleniyor</h3><p>Lütfen bekleyin.</p></div> : customers.length ? <div className="customers-list" aria-label="Müşteri kayıtları"><CustomerTable customers={customers} queryString={queryString} /><CustomerCards customers={customers} queryString={queryString} /></div> : <div className="customers-no-results" role="status"><h3>Sonuç bulunamadı</h3><p>Arama veya müşteri filtresini değiştirerek yeniden deneyin.</p>{hasActiveFilters ? <button onClick={() => setSearchParams({})} type="button">Filtreleri Temizle</button> : null}</div>}
        {!isLoading && !hasError && pageCount > 1 ? <nav aria-label="Müşteri sayfaları" className="customers-pagination"><button disabled={currentPage === 1} onClick={() => updateSearchParams({ sayfa: currentPage - 1 === 1 ? null : String(currentPage - 1) })} type="button">Önceki</button><div>{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <button aria-current={page === currentPage ? 'page' : undefined} aria-label={`${page}. sayfa`} key={page} onClick={() => updateSearchParams({ sayfa: page === 1 ? null : String(page) })} type="button">{page}</button>)}</div><button disabled={currentPage === pageCount} onClick={() => updateSearchParams({ sayfa: String(currentPage + 1) })} type="button">Sonraki</button><span>Sayfa {currentPage} / {pageCount} · Sayfa başına {response?.pageSize ?? 20} kayıt</span></nav> : null}
      </section>
    </div>
  )
}

export default CustomersPage
