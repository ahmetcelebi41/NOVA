import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import './ProductsPage.css'
import {
  productCategoryOptions,
  productDemoData,
  type ProductDemoRecord,
} from './products/productDemoData'

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

function formatCurrency(value: number) {
  return `${currencyFormatter.format(value)} TL`
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

function createProductEditPath(productId: string, preservedQuery: string) {
  return `/urunler/${productId}${preservedQuery ? `?${preservedQuery}` : ''}`
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
  products: ProductDemoRecord[]
}) {
  return (
    <ul className="products-cards">
      {products.map((product) => (
        <li key={product.id}>
          <Link
            aria-label={`${product.name}, ${product.category}, ${formatCurrency(product.price)}, ${product.stock} stok, ${product.publication}. Düzenle`}
            className="products-list__row"
            to={createProductEditPath(product.id, preservedQuery)}
          >
            <span data-label="Ürün">
              <strong>{product.name}</strong>
            </span>
            <span data-label="Kategori">{product.category}</span>
            <span className="products-list__number" data-label="Fiyat">
              {formatCurrency(product.price)}
            </span>
            <span className="products-list__number" data-label="Stok">
              {product.stock} · {product.stockStatus}
            </span>
            <span data-label="Yayın">
              <span className="products-status-text">{product.publication}</span>
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
  products: ProductDemoRecord[]
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
            <td>{product.category}</td>
            <td className="products-table__number">{formatCurrency(product.price)}</td>
            <td className="products-table__number">
              {product.stock} · {product.stockStatus}
            </td>
            <td>
              <span className="products-status-text">{product.publication}</span>
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

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')
    const parsedMinimumPrice = parsePrice(minimumPrice)
    const parsedMaximumPrice = parsePrice(maximumPrice)
    const selectedCategoryLabel = categoryLabels.get(selectedCategory)

    return productDemoData
      .filter((product) => {
        if (selectedQuickFilter === 'aktif' && product.publication !== 'Aktif') {
          return false
        }
        if (selectedQuickFilter === 'pasif' && product.publication !== 'Pasif') {
          return false
        }
        if (selectedQuickFilter === 'dusuk' && product.stockStatus !== 'Düşük Stok') {
          return false
        }
        if (selectedQuickFilter === 'tukendi' && product.stockStatus !== 'Tükendi') {
          return false
        }
        if (selectedCategoryLabel && product.category !== selectedCategoryLabel) {
          return false
        }
        if (parsedMinimumPrice !== null && product.price < parsedMinimumPrice) {
          return false
        }
        if (parsedMaximumPrice !== null && product.price > parsedMaximumPrice) {
          return false
        }
        if (!normalizedQuery) {
          return true
        }

        return [product.name, product.sku].some((value) =>
          value.toLocaleLowerCase('tr-TR').includes(normalizedQuery),
        )
      })
      .toSorted((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
  }, [maximumPrice, minimumPrice, query, selectedCategory, selectedQuickFilter])

  const requestedPage = Number.parseInt(searchParams.get('sayfa') ?? '1', 10)
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), pageCount)
    : 1
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )
  const hasActiveFilters = Boolean(
    selectedQuickFilter || selectedCategory || query || minimumPrice || maximumPrice,
  )
  const preservedQuery = searchParams.toString()

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)
    const normalizedPageParam = currentPage === 1 ? null : String(currentPage)
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
        <Link className="products-page__primary-action" to="/urunler/yeni">
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
            <p aria-live="polite">{filteredProducts.length} ürün</p>
          </div>
        </div>

        {visibleProducts.length > 0 ? (
          <div className="products-list" aria-label="Ürünler">
            <ProductsTable products={visibleProducts} preservedQuery={preservedQuery} />
            <ProductCards products={visibleProducts} preservedQuery={preservedQuery} />
          </div>
        ) : (
          <div className="products-no-results" role="status">
            <h3>Sonuç bulunamadı</h3>
            <p>Arama veya filtreleri değiştirerek yeniden deneyin.</p>
            <button onClick={() => setSearchParams({})} type="button">
              Filtreleri Temizle
            </button>
          </div>
        )}

        {filteredProducts.length > itemsPerPage ? (
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
