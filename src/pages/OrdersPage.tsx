import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import './OrdersPage.css'
import {
  orderDemoData,
  orderReferenceTimestamp,
  orderTodayStartTimestamp,
  type OrderDemoRecord,
  type OrderStatus,
} from './orders/orderDemoData'

type FilterControlsProps = {
  containerId?: string
  dateFilter: string
  idPrefix: string
  onDateChange: (value: string) => void
  onSearchChange: (value: string) => void
  query: string
}

const itemsPerPage = 20

const statusOptions: Array<{ label: string; value: string }> = [
  { label: 'Tümü', value: '' },
  { label: 'Yeni', value: 'yeni' },
  { label: 'Hazırlanıyor', value: 'hazirlaniyor' },
  { label: 'Teslimata Hazır', value: 'hazir' },
  { label: 'Tamamlandı', value: 'tamamlandi' },
  { label: 'İptal', value: 'iptal' },
]

const statusesByQuery = new Map<string, OrderStatus[]>([
  ['bekliyor', ['Yeni', 'Hazırlanıyor', 'Teslimata Hazır']],
  ['yeni', ['Yeni']],
  ['hazirlaniyor', ['Hazırlanıyor']],
  ['hazir', ['Teslimata Hazır']],
  ['tamamlandi', ['Tamamlandı']],
  ['iptal', ['İptal']],
])

const dateOptions = [
  { label: 'Tüm tarihler', value: '' },
  { label: 'Bugün', value: 'bugun' },
  { label: 'Son 7 Gün', value: '7gun' },
  { label: 'Son 30 Gün', value: '30gun' },
]

const dateFilterLabels = new Map(dateOptions.map((option) => [option.value, option.label]))
const statusFilterLabels = new Map(statusOptions.map((option) => [option.value, option.label]))
statusFilterLabels.set('bekliyor', 'Bekleyen Siparişler')

const numberFormatter = new Intl.NumberFormat('tr-TR')

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: 'short',
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
})

function formatCurrency(value: number) {
  return `${numberFormatter.format(value)} TL`
}

function FilterControls({
  containerId,
  dateFilter,
  idPrefix,
  onDateChange,
  onSearchChange,
  query,
}: FilterControlsProps) {
  const searchId = `${idPrefix}-order-search`
  const dateId = `${idPrefix}-date-filter`

  return (
    <div className="orders-filter-fields" id={containerId}>
      <div className="orders-field orders-field--search">
        <label htmlFor={searchId}>Sipariş ara</label>
        <input
          id={searchId}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Sipariş no, müşteri, telefon veya e-posta"
          type="search"
          value={query}
        />
      </div>

      <div className="orders-field">
        <label htmlFor={dateId}>Tarih</label>
        <select
          id={dateId}
          onChange={(event) => onDateChange(event.target.value)}
          value={dateFilter}
        >
          {dateOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="orders-sort" aria-label="Sıralama">
        <span>Sıralama</span>
        <strong>En Yeni</strong>
      </div>
    </div>
  )
}

function createOrderDetailPath(orderId: string, preservedQuery: string) {
  return `/siparisler/${orderId}${preservedQuery ? `?${preservedQuery}` : ''}`
}

function OrderCards({
  orderItems,
  preservedQuery,
}: {
  orderItems: OrderDemoRecord[]
  preservedQuery: string
}) {
  return (
    <ul className="orders-cards">
      {orderItems.map((order) => (
        <li key={order.id}>
          <Link
            aria-label={`${order.number}, ${order.customer}, ${dateFormatter.format(new Date(order.date))}, ${order.product}, ${formatCurrency(order.amount)}, ${order.status}. Detayı gör`}
            className="orders-list__row"
            to={createOrderDetailPath(order.id, preservedQuery)}
          >
            <span data-label="Sipariş No">
              <strong>{order.number}</strong>
            </span>
            <span data-label="Müşteri">{order.customer}</span>
            <span data-label="Tarih">
              <time dateTime={order.date}>{dateFormatter.format(new Date(order.date))}</time>
            </span>
            <span data-label="Ürün">{order.product}</span>
            <span className="orders-list__amount" data-label="Tutar">
              {formatCurrency(order.amount)}
            </span>
            <span data-label="Durum">
              <span className="orders-status-text">{order.status}</span>
            </span>
            <span className="orders-list__action" data-label="Aksiyon">
              Detayı Gör
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function OrdersTable({
  orderItems,
  preservedQuery,
}: {
  orderItems: OrderDemoRecord[]
  preservedQuery: string
}) {
  return (
    <table className="orders-table">
      <thead>
        <tr>
          <th scope="col">Sipariş No</th>
          <th scope="col">Müşteri</th>
          <th scope="col">Tarih</th>
          <th scope="col">Ürün</th>
          <th className="orders-table__amount" scope="col">
            Tutar
          </th>
          <th scope="col">Durum</th>
          <th scope="col">Aksiyon</th>
        </tr>
      </thead>
      <tbody>
        {orderItems.map((order) => (
          <tr key={order.id}>
            <td>
              <strong>{order.number}</strong>
            </td>
            <td>{order.customer}</td>
            <td>
              <time dateTime={order.date}>{dateFormatter.format(new Date(order.date))}</time>
            </td>
            <td>{order.product}</td>
            <td className="orders-table__amount">{formatCurrency(order.amount)}</td>
            <td>
              <span className="orders-status-text">{order.status}</span>
            </td>
            <td>
              <Link
                aria-label={`${order.number} siparişinin detayını gör`}
                className="orders-table__action"
                to={createOrderDetailPath(order.id, preservedQuery)}
              >
                Detayı Gör
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mobileFiltersRef = useRef<HTMLDetailsElement>(null)
  const mobileFiltersSummaryRef = useRef<HTMLElement>(null)
  const requestedStatus = searchParams.get('durum') ?? ''
  const requestedDate = searchParams.get('tarih') ?? ''
  const selectedStatus = statusesByQuery.has(requestedStatus) ? requestedStatus : ''
  const selectedDate = dateFilterLabels.has(requestedDate) ? requestedDate : ''
  const query = searchParams.get('q') ?? ''

  const updateSearchParams = (
    updates: Record<string, string | null>,
    options: { replace?: boolean } = {},
  ) => {
    const nextParams = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    })

    setSearchParams(nextParams, options)
  }

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')
    const dateThreshold =
      selectedDate === 'bugun'
        ? orderTodayStartTimestamp
        : selectedDate === '7gun'
          ? orderReferenceTimestamp - 7 * 24 * 60 * 60 * 1000
          : selectedDate === '30gun'
            ? orderReferenceTimestamp - 30 * 24 * 60 * 60 * 1000
            : null

    return orderDemoData
      .filter((order) => {
        const matchingStatuses = statusesByQuery.get(selectedStatus)
        if (matchingStatuses && !matchingStatuses.includes(order.status)) {
          return false
        }

        if (dateThreshold !== null && new Date(order.date).getTime() < dateThreshold) {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        return [order.number, order.customer, order.phone, order.email].some((value) =>
          value.toLocaleLowerCase('tr-TR').includes(normalizedQuery),
        )
      })
      .toSorted((first, second) => Date.parse(second.date) - Date.parse(first.date))
  }, [query, selectedDate, selectedStatus])

  const requestedPage = Number.parseInt(searchParams.get('sayfa') ?? '1', 10)
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage))
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), pageCount)
    : 1
  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )
  const hasActiveFilters = Boolean(selectedStatus || selectedDate || query)
  const preservedQuery = searchParams.toString()

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)
    let shouldNormalize = false

    if (requestedStatus && !statusesByQuery.has(requestedStatus)) {
      nextParams.delete('durum')
      shouldNormalize = true
    }

    if (requestedDate && !dateFilterLabels.has(requestedDate)) {
      nextParams.delete('tarih')
      shouldNormalize = true
    }

    const currentPageParam = searchParams.get('sayfa')
    const normalizedPageParam = currentPage === 1 ? null : String(currentPage)

    if (currentPageParam !== normalizedPageParam) {
      if (normalizedPageParam) {
        nextParams.set('sayfa', normalizedPageParam)
      } else {
        nextParams.delete('sayfa')
      }
      shouldNormalize = true
    }

    if (shouldNormalize) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [currentPage, requestedDate, requestedStatus, searchParams, setSearchParams])

  const setFilter = (key: 'durum' | 'tarih', value: string) => {
    updateSearchParams({ [key]: value || null, sayfa: null })
  }

  const setQuery = (value: string) => {
    updateSearchParams({ q: value || null, sayfa: null }, { replace: true })
  }

  const setPage = (page: number) => {
    updateSearchParams({ sayfa: page === 1 ? null : String(page) })
  }

  const handleMobileFiltersKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key === 'Escape' && mobileFiltersRef.current?.open) {
      event.preventDefault()
      mobileFiltersRef.current.open = false
      mobileFiltersSummaryRef.current?.focus()
    }
  }

  return (
    <div className="orders-page">
      <header className="orders-page__header">
        <div>
          <h1 id="page-title">Siparişler</h1>
          <p>Siparişleri bulun, filtreleyin ve detaylarını görüntüleyin.</p>
        </div>
        <Link className="orders-page__primary-action" to="/siparisler/yeni">
          Yeni Sipariş
        </Link>
      </header>

      <section aria-labelledby="order-status-filters-title" className="orders-status-section">
        <h2 className="orders-visually-hidden" id="order-status-filters-title">
          Sipariş durumları
        </h2>
        <div className="orders-status-filters">
          {statusOptions.map((status) => (
            <button
              aria-pressed={selectedStatus === status.value}
              key={status.value || 'all'}
              onClick={() => setFilter('durum', status.value)}
              type="button"
            >
              {status.label}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Sipariş arama, filtreleme ve sıralama" className="orders-toolbar">
        <div className="orders-toolbar__desktop">
          <FilterControls
            dateFilter={selectedDate}
            idPrefix="desktop"
            onDateChange={(value) => setFilter('tarih', value)}
            onSearchChange={setQuery}
            query={query}
          />
        </div>

        <details
          className="orders-filter-drawer"
          onKeyDown={handleMobileFiltersKeyDown}
          ref={mobileFiltersRef}
        >
          <summary aria-controls="mobile-order-filter-fields" ref={mobileFiltersSummaryRef}>
            Arama, filtre ve sıralama
          </summary>
          <FilterControls
            containerId="mobile-order-filter-fields"
            dateFilter={selectedDate}
            idPrefix="mobile"
            onDateChange={(value) => setFilter('tarih', value)}
            onSearchChange={setQuery}
            query={query}
          />
        </details>

        {hasActiveFilters ? (
          <div className="orders-active-filters" aria-label="Aktif filtreler">
            <div>
              <strong>Aktif filtreler</strong>
              {selectedStatus ? (
                <span>Durum: {statusFilterLabels.get(selectedStatus) ?? selectedStatus}</span>
              ) : null}
              {selectedDate ? (
                <span>Tarih: {dateFilterLabels.get(selectedDate) ?? selectedDate}</span>
              ) : null}
              {query ? <span>Arama: “{query}”</span> : null}
            </div>
            <button onClick={() => setSearchParams({})} type="button">
              Filtreleri Temizle
            </button>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="orders-list-title" className="orders-list-section">
        <div className="orders-list-section__header">
          <div>
            <h2 id="orders-list-title">Sipariş Listesi</h2>
            <p aria-live="polite">{filteredOrders.length} sipariş</p>
          </div>
        </div>

        {visibleOrders.length > 0 ? (
          <div className="orders-list" aria-label="Siparişler">
            <OrdersTable orderItems={visibleOrders} preservedQuery={preservedQuery} />
            <OrderCards orderItems={visibleOrders} preservedQuery={preservedQuery} />
          </div>
        ) : (
          <div className="orders-no-results" role="status">
            <h3>Sonuç bulunamadı</h3>
            <p>Arama veya filtreleri değiştirerek yeniden deneyin.</p>
            <button onClick={() => setSearchParams({})} type="button">
              Filtreleri Temizle
            </button>
          </div>
        )}

        {filteredOrders.length > itemsPerPage ? (
          <nav aria-label="Sipariş sayfaları" className="orders-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              type="button"
            >
              Önceki
            </button>
            <div>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                <button
                  aria-current={page === currentPage ? 'page' : undefined}
                  aria-label={`${page}. sayfa`}
                  key={page}
                  onClick={() => setPage(page)}
                  type="button"
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
              type="button"
            >
              Sonraki
            </button>
            <span>
              Sayfa {currentPage} / {pageCount} · Sayfa başına {itemsPerPage} kayıt
            </span>
          </nav>
        ) : null}
      </section>
    </div>
  )
}

export default OrdersPage
