import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import './CustomersPage.css'
import {
  customerDemoData,
  type CustomerDemoRecord,
  type CustomerStatus,
} from './customers/customerDemoData'

type CustomerFilter = '' | 'yeni' | 'tekrar' | 'pasif'

const itemsPerPage = 20

const quickFilters: { label: string; value: CustomerFilter }[] = [
  { label: 'Tümü', value: '' },
  { label: 'Yeni', value: 'yeni' },
  { label: 'Tekrar', value: 'tekrar' },
  { label: 'Pasif', value: 'pasif' },
]

const quickFilterLabels = new Map(quickFilters.map((filter) => [filter.value, filter.label]))
const validFilterValues = new Set<CustomerFilter>(quickFilters.map((filter) => filter.value))
const filterStatusMap: Record<Exclude<CustomerFilter, ''>, CustomerStatus> = {
  yeni: 'Yeni',
  pasif: 'Pasif',
  tekrar: 'Tekrar',
}

const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  currency: 'TRY',
  style: 'currency',
})

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
})

function formatCurrency(valueInKurus: number) {
  return currencyFormatter.format(valueInKurus / 100)
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`))
}

function customerDetailPath(id: string, queryString: string) {
  return `/musteriler/${id}${queryString ? `?${queryString}` : ''}`
}

function CustomerTable({
  customers,
  queryString,
}: {
  customers: CustomerDemoRecord[]
  queryString: string
}) {
  return (
    <table className="customers-table">
      <thead>
        <tr>
          <th scope="col">Müşteri</th>
          <th scope="col">İletişim</th>
          <th className="customers-table__number" scope="col">
            Sipariş Sayısı
          </th>
          <th className="customers-table__number" scope="col">
            Toplam Harcama
          </th>
          <th scope="col">Son Sipariş</th>
          <th scope="col">Durum</th>
          <th scope="col">Aksiyon</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td>
              <strong>{customer.name}</strong>
            </td>
            <td>
              <span className="customers-table__contact">{customer.phone}</span>
              <span className="customers-table__contact">{customer.email}</span>
            </td>
            <td className="customers-table__number">{customer.orderCount}</td>
            <td className="customers-table__number">
              {formatCurrency(customer.totalSpentInKurus)}
            </td>
            <td>
              <time dateTime={customer.lastOrderDate}>{formatDate(customer.lastOrderDate)}</time>
            </td>
            <td>
              <span className="customer-status">{customer.status}</span>
            </td>
            <td>
              <Link
                className="customers-detail-link"
                to={customerDetailPath(customer.id, queryString)}
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

function CustomerCards({
  customers,
  queryString,
}: {
  customers: CustomerDemoRecord[]
  queryString: string
}) {
  return (
    <ul className="customer-cards">
      {customers.map((customer) => (
        <li key={customer.id}>
          <article className="customer-card">
            <header>
              <strong>{customer.name}</strong>
              <span className="customer-status">{customer.status}</span>
            </header>
            <dl>
              <div>
                <dt>Telefon</dt>
                <dd>{customer.phone}</dd>
              </div>
              <div>
                <dt>E-posta</dt>
                <dd>{customer.email}</dd>
              </div>
              <div>
                <dt>Sipariş Sayısı</dt>
                <dd>{customer.orderCount}</dd>
              </div>
              <div>
                <dt>Toplam Harcama</dt>
                <dd>{formatCurrency(customer.totalSpentInKurus)}</dd>
              </div>
              <div>
                <dt>Son Sipariş</dt>
                <dd>
                  <time dateTime={customer.lastOrderDate}>
                    {formatDate(customer.lastOrderDate)}
                  </time>
                </dd>
              </div>
            </dl>
            <Link
              className="customers-detail-link"
              to={customerDetailPath(customer.id, queryString)}
            >
              Detayı Gör
            </Link>
          </article>
        </li>
      ))}
    </ul>
  )
}

function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedFilter = searchParams.get('durum') ?? ''
  const selectedFilter = validFilterValues.has(requestedFilter as CustomerFilter)
    ? (requestedFilter as CustomerFilter)
    : ''
  const query = searchParams.get('q') ?? ''

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')

    return customerDemoData.filter((customer) => {
      if (selectedFilter && customer.status !== filterStatusMap[selectedFilter]) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return [customer.name, customer.phone, customer.email].some((value) =>
        value.toLocaleLowerCase('tr-TR').includes(normalizedQuery),
      )
    })
  }, [query, selectedFilter])

  const requestedPageValue = Number(searchParams.get('sayfa') ?? '1')
  const requestedPage = Number.isInteger(requestedPageValue) ? requestedPageValue : 1
  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage))
  const currentPage = Math.min(Math.max(requestedPage, 1), pageCount)
  const visibleCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )
  const hasActiveFilters = Boolean(selectedFilter || query)
  const queryString = searchParams.toString()

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)

    if (selectedFilter) {
      nextParams.set('durum', selectedFilter)
    } else {
      nextParams.delete('durum')
    }

    if (currentPage === 1) {
      nextParams.delete('sayfa')
    } else {
      nextParams.set('sayfa', String(currentPage))
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [currentPage, searchParams, selectedFilter, setSearchParams])

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

  const clearFilters = () => setSearchParams({})

  return (
    <div className="customers-page">
      <header className="customers-page__header">
        <h1 id="page-title">Müşteriler</h1>
        <p>Müşteri ilişkilerini, sipariş sayılarını ve harcama özetlerini görüntüleyin.</p>
      </header>

      <section aria-labelledby="customer-segments-title" className="customer-segments-section">
        <h2 className="customers-visually-hidden" id="customer-segments-title">
          Müşteri hızlı segmentleri
        </h2>
        <div className="customer-segments">
          {quickFilters.map((filter) => (
            <button
              aria-pressed={selectedFilter === filter.value}
              key={filter.value || 'all'}
              onClick={() =>
                updateSearchParams({ durum: filter.value || null, sayfa: null })
              }
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Müşteri arama ve filtreleme" className="customers-toolbar">
        <div className="customers-field">
          <label htmlFor="customer-search">Müşterilerde ara</label>
          <input
            id="customer-search"
            onChange={(event) =>
              updateSearchParams({ q: event.target.value || null, sayfa: null }, { replace: true })
            }
            placeholder="Ad, telefon veya e-posta"
            type="search"
            value={query}
          />
        </div>

        {hasActiveFilters ? (
          <div className="customers-active-filters" aria-label="Aktif filtreler">
            <div>
              <strong>Aktif filtreler</strong>
              {selectedFilter ? (
                <span>Durum: {quickFilterLabels.get(selectedFilter)}</span>
              ) : null}
              {query ? <span>Arama: “{query}”</span> : null}
            </div>
            <button onClick={clearFilters} type="button">
              Filtreleri Temizle
            </button>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="customer-list-title" className="customers-list-section">
        <div className="customers-list-section__header">
          <h2 id="customer-list-title">Müşteri Listesi</h2>
          <p aria-live="polite">{filteredCustomers.length} müşteri</p>
        </div>

        {visibleCustomers.length > 0 ? (
          <div className="customers-list" aria-label="Müşteri kayıtları">
            <CustomerTable customers={visibleCustomers} queryString={queryString} />
            <CustomerCards customers={visibleCustomers} queryString={queryString} />
          </div>
        ) : (
          <div className="customers-no-results" role="status">
            <h3>Sonuç bulunamadı</h3>
            <p>Arama veya müşteri filtresini değiştirerek yeniden deneyin.</p>
            <button onClick={clearFilters} type="button">
              Filtreleri Temizle
            </button>
          </div>
        )}

        {filteredCustomers.length > itemsPerPage ? (
          <nav aria-label="Müşteri sayfaları" className="customers-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() =>
                updateSearchParams({
                  sayfa: currentPage - 1 === 1 ? null : String(currentPage - 1),
                })
              }
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
                  onClick={() =>
                    updateSearchParams({ sayfa: page === 1 ? null : String(page) })
                  }
                  type="button"
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === pageCount}
              onClick={() => updateSearchParams({ sayfa: String(currentPage + 1) })}
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

export default CustomersPage
