import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type {
  ProductListItem,
  ProductStatusFilter,
  ProductsResponse,
} from '../contracts/products'
import { apiJson } from '../lib/api'
import './ProductsPage.css'
import { productCategoryOptions } from './products/productDemoData'

type FilterControlsProps = {
  category: string
  containerId?: string
  idPrefix: string
  maximumPrice: string
  minimumPrice: string
  onCategoryChange: (value: string) => void
  onMaximumPriceChange: (value: string) => void
  onMinimumPriceChange: (value: string) => void
  onSearchChange: (value: string) => void
  query: string
}

const itemsPerPage = 20

const quickFilters = [
  { label: 'Tümü', value: '' },
  { label: 'Aktif', value: 'aktif' },
  { label: 'Pasif', value: 'pasif' },
  { label: 'Düşük Stok', value: 'dusuk' },
  { label: 'Tükendi', value: 'tukendi' },
]

const quickFilterLabels = new Map(quickFilters.map((filter) => [filter.value, filter.label]))
const categoryLabels = new Map<string, string>(
  productCategoryOptions.map((category) => [category.value, category.label]),
)
const currencyFormatter = new Intl.NumberFormat('tr-TR')

const publicationLabels = { active: 'Aktif', inactive: 'Pasif' } as const
const stockStatusLabels = { low: 'Düşük Stok', normal: 'Normal', out: 'Tükendi' } as const
const apiStatusByFilter: Record<string, ProductStatusFilter> = {
  aktif: 'active',
  dusuk: 'low',
  pasif: 'inactive',
  tukendi: 'out',
}

function formatCurrency(valueMinor: number) {
  return `${currencyFormatter.format(valueMinor / 100)} TL`
}

function parsePrice(value: string | null) {
  if (!value?.trim()) {
    return null
  }

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : null
}

function normalizePriceRange(minimumValue: string | null, maximumValue: string | null) {
  const parsedMinimumPrice = parsePrice(minimumValue)
  const parsedMaximumPrice = parsePrice(maximumValue)

  if (
    parsedMinimumPrice !== null &&
    parsedMaximumPrice !== null &&
    parsedMinimumPrice > parsedMaximumPrice
  ) {
    return {
      maximumPrice: String(parsedMinimumPrice),
      minimumPrice: String(parsedMaximumPrice),
    }
  }

  return {
    maximumPrice: parsedMaximumPrice === null ? '' : String(parsedMaximumPrice),
    minimumPrice: parsedMinimumPrice === null ? '' : String(parsedMinimumPrice),
  }
}

function createProductEditPath(productId: number, preservedQuery: string) {
  return `/urunler/${productId}${preservedQuery ? `?${preservedQuery}` : ''}`
}

function getCategoryLabel(category: string) {
  return categoryLabels.get(category) ?? category
}

function createProductsApiQuery({
  category,
  maximumPrice,
  minimumPrice,
  page,
  query,
  quickFilter,
}: {
  category: string
  maximumPrice: string
  minimumPrice: string
  page: number
  query: string
  quickFilter: string
}) {
  const apiSearchParams = new URLSearchParams({ page: String(page) })
  const parsedMinimumPrice = parsePrice(minimumPrice)
  const parsedMaximumPrice = parsePrice(maximumPrice)

  if (quickFilter) {
    apiSearchParams.set('status', apiStatusByFilter[quickFilter])
  }
  if (category) {
    apiSearchParams.set('category', category)
  }
  if (query.trim()) {
    apiSearchParams.set('q', query.trim())
  }
  if (parsedMinimumPrice !== null) {
    apiSearchParams.set('priceMinMinor', String(Math.round(parsedMinimumPrice * 100)))
  }
  if (parsedMaximumPrice !== null) {
    apiSearchParams.set('priceMaxMinor', String(Math.round(parsedMaximumPrice * 100)))
  }

  return apiSearchParams.toString()
}

function FilterControls({
  category,
  containerId,
  idPrefix,
  maximumPrice,
  minimumPrice,
  onCategoryChange,
  onMaximumPriceChange,
  onMinimumPriceChange,
  onSearchChange,
  query,
}: FilterControlsProps) {
  const searchId = `${idPrefix}-product-search`
  const categoryId = `${idPrefix}-product-category`
  const minimumPriceId = `${idPrefix}-minimum-price`
  const maximumPriceId = `${idPrefix}-maximum-price`

  return (
    <div className="products-filter-fields" id={containerId}>
      <div className="products-field products-field--search">
        <label htmlFor={searchId}>Ürün ara</label>
        <input
          id={searchId}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Ürün adı veya SKU"
          type="search"
          value={query}
        />
      </div>

      <div className="products-field">
        <label htmlFor={categoryId}>Kategori</label>
        <select
          id={categoryId}
          onChange={(event) => onCategoryChange(event.target.value)}
          value={category}
        >
          <option value="">Tüm kategoriler</option>
          {productCategoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="products-price-fields" role="group" aria-label="Fiyat aralığı">
        <div className="products-field">
          <label htmlFor={minimumPriceId}>Minimum fiyat</label>
          <input
            id={minimumPriceId}
            inputMode="decimal"
            min="0"
            onChange={(event) => onMinimumPriceChange(event.target.value)}
            type="number"
            value={minimumPrice}
          />
        </div>
        <div className="products-field">
          <label htmlFor={maximumPriceId}>Maksimum fiyat</label>
          <input
            id={maximumPriceId}
            inputMode="decimal"
            min="0"
            onChange={(event) => onMaximumPriceChange(event.target.value)}
            type="number"
            value={maximumPrice}
          />
        </div>
      </div>

      <div className="products-sort" aria-label="Sıralama">
        <span>Sıralama</span>
        <strong>En Yeni Eklenen</strong>
      </div>
    </div>
  )
}

function ProductCards({
  preservedQuery,
  products,
}: {
  preservedQuery: string
  products: ProductListItem[]
}) {
  return (
    <ul className="products-cards">
      {products.map((product) => (
        <li key={product.id}>
          <Link
            aria-label={`${product.name}, ${getCategoryLabel(product.category)}, ${formatCurrency(product.priceMinor)}, ${product.stockQuantity} stok, ${publicationLabels[product.publicationStatus]}. Düzenle`}
            className="products-list__row"
            to={createProductEditPath(product.id, preservedQuery)}
          >
            <span data-label="Ürün">
              <strong>{product.name}</strong>
            </span>
            <span data-label="Kategori">{getCategoryLabel(product.category)}</span>
            <span className="products-list__number" data-label="Fiyat">
              {formatCurrency(product.priceMinor)}
            </span>
            <span className="products-list__number" data-label="Stok">
              {product.stockQuantity} · {stockStatusLabels[product.stockStatus]}
            </span>
            <span data-label="Yayın">
              <span className="products-status-text">
                {publicationLabels[product.publicationStatus]}
              </span>
            </span>
            <span className="products-list__action" data-label="Aksiyon">
              Düzenle
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ProductsTable({
  preservedQuery,
  products,
}: {
  preservedQuery: string
  products: ProductListItem[]
}) {
  return (
    <table className="products-table">
      <thead>
        <tr>
          <th scope="col">Ürün</th>
          <th scope="col">Kategori</th>
          <th className="products-table__number" scope="col">
            Fiyat
          </th>
          <th className="products-table__number" scope="col">
            Stok
          </th>
          <th scope="col">Yayın</th>
          <th scope="col">Aksiyon</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>
              <Link
                className="products-table__product-link"
                to={createProductEditPath(product.id, preservedQuery)}
              >
                <strong>{product.name}</strong>
              </Link>
            </td>
            <td>{getCategoryLabel(product.category)}</td>
            <td className="products-table__number">{formatCurrency(product.priceMinor)}</td>
            <td className="products-table__number">
              {product.stockQuantity} · {stockStatusLabels[product.stockStatus]}
            </td>
            <td>
              <span className="products-status-text">
                {publicationLabels[product.publicationStatus]}
              </span>
            </td>
            <td>
              <Link
                aria-label={`${product.name} ürününü düzenle`}
                className="products-table__action"
                to={createProductEditPath(product.id, preservedQuery)}
              >
                Düzenle
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loadState, setLoadState] = useState<{
    error: boolean
    requestKey: string
    response: ProductsResponse | null
  }>({ error: false, requestKey: '', response: null })
  const [reloadKey, setReloadKey] = useState(0)
  const mobileFiltersRef = useRef<HTMLDetailsElement>(null)
  const mobileFiltersSummaryRef = useRef<HTMLElement>(null)
  const requestedQuickFilter = searchParams.get('durum') ?? ''
  const requestedCategory = searchParams.get('kategori') ?? ''
  const selectedQuickFilter = quickFilterLabels.has(requestedQuickFilter)
    ? requestedQuickFilter
    : ''
  const selectedCategory = categoryLabels.has(requestedCategory) ? requestedCategory : ''
  const query = searchParams.get('q') ?? ''
  const { maximumPrice, minimumPrice } = normalizePriceRange(
    searchParams.get('fiyatMin'),
    searchParams.get('fiyatMax'),
  )

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

  const requestedPage = Number.parseInt(searchParams.get('sayfa') ?? '1', 10)
  const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const apiQuery = createProductsApiQuery({
    category: selectedCategory,
    maximumPrice,
    minimumPrice,
    page: currentPage,
    query,
    quickFilter: selectedQuickFilter,
  })
  const requestKey = `${apiQuery}|${reloadKey}`
  const isLoading = loadState.requestKey !== requestKey
  const loadError = !isLoading && loadState.error
  const response = isLoading ? null : loadState.response
  const pageCount = Math.max(1, response?.totalPages ?? 1)
  const visibleProducts = response?.items ?? []
  const hasActiveFilters = Boolean(
    selectedQuickFilter || selectedCategory || query || minimumPrice || maximumPrice,
  )
  const preservedQuery = searchParams.toString()

  useEffect(() => {
    const controller = new AbortController()

    void apiJson<ProductsResponse>(`/api/products?${apiQuery}`, {
      signal: controller.signal,
    })
      .then((nextResponse) => setLoadState({
        error: false,
        requestKey,
        response: nextResponse,
      }))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setLoadState({ error: true, requestKey, response: null })
        }
      })

    return () => controller.abort()
  }, [apiQuery, requestKey])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)
    const normalizedCurrentPage = response?.totalPages && currentPage > response.totalPages
      ? response.totalPages
      : currentPage
    const normalizedPageParam = normalizedCurrentPage === 1 ? null : String(normalizedCurrentPage)
    const normalizedValues: Record<string, string | null> = {
      durum: selectedQuickFilter || null,
      kategori: selectedCategory || null,
      fiyatMin: minimumPrice || null,
      fiyatMax: maximumPrice || null,
      sayfa: normalizedPageParam,
    }

    Object.entries(normalizedValues).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    })

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [
    currentPage,
    maximumPrice,
    minimumPrice,
    response?.totalPages,
    searchParams,
    selectedCategory,
    selectedQuickFilter,
    setSearchParams,
  ])

  const setFilter = (key: 'durum' | 'kategori', value: string) => {
    updateSearchParams({ [key]: value || null, sayfa: null })
  }

  const setInputFilter = (key: 'q' | 'fiyatMin' | 'fiyatMax', value: string) => {
    updateSearchParams({ [key]: value || null, sayfa: null }, { replace: true })
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
    <div className="products-page">
      <header className="products-page__header">
        <div>
          <h1 id="page-title">Ürünler</h1>
          <p>Ürünleri bulun, filtreleyin ve düzenleme ekranına ulaşın.</p>
        </div>
        <Link
          className="products-page__primary-action"
          to={`/urunler/yeni${preservedQuery ? `?${preservedQuery}` : ''}`}
        >
          Yeni Ürün
        </Link>
      </header>

      <section aria-labelledby="product-quick-filters-title" className="products-quick-section">
        <h2 className="products-visually-hidden" id="product-quick-filters-title">
          Ürün hızlı filtreleri
        </h2>
        <div className="products-quick-filters">
          {quickFilters.map((filter) => (
            <button
              aria-pressed={selectedQuickFilter === filter.value}
              key={filter.value || 'all'}
              onClick={() => setFilter('durum', filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Ürün arama, filtreleme ve sıralama" className="products-toolbar">
        <div className="products-toolbar__desktop">
          <FilterControls
            category={selectedCategory}
            idPrefix="desktop"
            maximumPrice={maximumPrice}
            minimumPrice={minimumPrice}
            onCategoryChange={(value) => setFilter('kategori', value)}
            onMaximumPriceChange={(value) => setInputFilter('fiyatMax', value)}
            onMinimumPriceChange={(value) => setInputFilter('fiyatMin', value)}
            onSearchChange={(value) => setInputFilter('q', value)}
            query={query}
          />
        </div>

        <details
          className="products-filter-drawer"
          onKeyDown={handleMobileFiltersKeyDown}
          ref={mobileFiltersRef}
        >
          <summary aria-controls="mobile-product-filter-fields" ref={mobileFiltersSummaryRef}>
            Arama, filtre ve sıralama
          </summary>
          <FilterControls
            category={selectedCategory}
            containerId="mobile-product-filter-fields"
            idPrefix="mobile"
            maximumPrice={maximumPrice}
            minimumPrice={minimumPrice}
            onCategoryChange={(value) => setFilter('kategori', value)}
            onMaximumPriceChange={(value) => setInputFilter('fiyatMax', value)}
            onMinimumPriceChange={(value) => setInputFilter('fiyatMin', value)}
            onSearchChange={(value) => setInputFilter('q', value)}
            query={query}
          />
        </details>

        {hasActiveFilters ? (
          <div className="products-active-filters" aria-label="Aktif filtreler">
            <div>
              <strong>Aktif filtreler</strong>
              {selectedQuickFilter ? (
                <span>Durum: {quickFilterLabels.get(selectedQuickFilter) ?? selectedQuickFilter}</span>
              ) : null}
              {selectedCategory ? (
                <span>Kategori: {categoryLabels.get(selectedCategory) ?? selectedCategory}</span>
              ) : null}
              {minimumPrice ? <span>Minimum fiyat: {minimumPrice} TL</span> : null}
              {maximumPrice ? <span>Maksimum fiyat: {maximumPrice} TL</span> : null}
              {query ? <span>Arama: “{query}”</span> : null}
            </div>
            <button onClick={() => setSearchParams({})} type="button">
              Filtreleri Temizle
            </button>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="products-list-title" className="products-list-section">
        <div className="products-list-section__header">
          <div>
            <h2 id="products-list-title">Ürün Listesi</h2>
            <p aria-live="polite">
              {isLoading ? 'Ürünler yükleniyor…' : `${response?.totalItems ?? 0} ürün`}
            </p>
          </div>
        </div>

        {loadError ? (
          <div className="products-no-results" role="alert">
            <h3>Ürünler yüklenemedi</h3>
            <p>Bağlantıyı kontrol edip yeniden deneyin.</p>
            <button onClick={() => setReloadKey((value) => value + 1)} type="button">
              Yeniden Dene
            </button>
          </div>
        ) : isLoading ? (
          <div className="products-no-results" role="status">
            <h3>Ürünler yükleniyor</h3>
            <p>Liste hazırlanıyor…</p>
          </div>
        ) : visibleProducts.length > 0 ? (
          <div className="products-list" aria-label="Ürünler">
            <ProductsTable products={visibleProducts} preservedQuery={preservedQuery} />
            <ProductCards products={visibleProducts} preservedQuery={preservedQuery} />
          </div>
        ) : (
          <div className="products-no-results" role="status">
            <h3>{hasActiveFilters ? 'Sonuç bulunamadı' : 'Henüz ürün yok'}</h3>
            <p>
              {hasActiveFilters
                ? 'Arama veya filtreleri değiştirerek yeniden deneyin.'
                : 'İlk ürününüzü oluşturarak kataloğu hazırlamaya başlayın.'}
            </p>
            {hasActiveFilters ? (
              <button onClick={() => setSearchParams({})} type="button">
                Filtreleri Temizle
              </button>
            ) : null}
          </div>
        )}

        {!isLoading && !loadError && (response?.totalItems ?? 0) > itemsPerPage ? (
          <nav aria-label="Ürün sayfaları" className="products-pagination">
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

export default ProductsPage
