import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import './StockPage.css'
import {
  productDemoData,
  type ProductDemoRecord,
  type ProductStockStatus,
} from './products/productDemoData'

type StockFilter = '' | 'normal' | 'dusuk' | 'tukendi'

type StockFormValues = {
  stock: string
}

type StockActionsProps = {
  isOpen: boolean
  menuKey: string
  onOpenUpdate: (product: ProductDemoRecord) => void
  onToggle: (menuKey: string, trigger: HTMLButtonElement) => void
  product: ProductDemoRecord
}

const itemsPerPage = 20

const quickFilters: { label: string; value: StockFilter }[] = [
  { label: 'Tümü', value: '' },
  { label: 'Normal', value: 'normal' },
  { label: 'Düşük', value: 'dusuk' },
  { label: 'Tükendi', value: 'tukendi' },
]

const quickFilterLabels = new Map(quickFilters.map((filter) => [filter.value, filter.label]))
const validFilterValues = new Set<StockFilter>(quickFilters.map((filter) => filter.value))
const filterStatusMap: Record<Exclude<StockFilter, ''>, ProductStockStatus> = {
  dusuk: 'Düşük Stok',
  normal: 'Normal',
  tukendi: 'Tükendi',
}

const statusLabels: Record<ProductStockStatus, string> = {
  'Düşük Stok': 'Düşük',
  Normal: 'Normal',
  Tükendi: 'Tükendi',
}

const stockValueSchema = z
  .string()
  .trim()
  .min(1, 'Yeni stok değeri zorunludur.')
  .refine((value) => {
    const parsedValue = Number(value)
    return Number.isFinite(parsedValue) && Number.isInteger(parsedValue) && parsedValue >= 0
  }, 'Yeni stok değeri 0 veya daha büyük bir tam sayı olmalıdır.')

function StockActions({
  isOpen,
  menuKey,
  onOpenUpdate,
  onToggle,
  product,
}: StockActionsProps) {
  const menuId = `stock-actions-${menuKey}`

  return (
    <div className="stock-actions" data-stock-actions={menuKey}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`${product.name} için stok aksiyonlarını aç`}
        className="stock-actions__trigger"
        onClick={(event) => onToggle(menuKey, event.currentTarget)}
        type="button"
      >
        ⋯
      </button>

      {isOpen ? (
        <div className="stock-actions__menu" id={menuId} role="menu">
          <button onClick={() => onOpenUpdate(product)} role="menuitem" type="button">
            Stok Güncelle
          </button>
          <Link role="menuitem" to={`/urunler/${product.id}`}>
            Ürünü Düzenle
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function StockCards({
  openMenuKey,
  onOpenUpdate,
  onToggleMenu,
  products,
}: {
  openMenuKey: string | null
  onOpenUpdate: (product: ProductDemoRecord) => void
  onToggleMenu: (menuKey: string, trigger: HTMLButtonElement) => void
  products: ProductDemoRecord[]
}) {
  return (
    <ul className="stock-cards">
      {products.map((product) => {
        const menuKey = `card-${product.id}`

        return (
          <li key={product.id}>
            <div className="stock-card">
              <div className="stock-card__product">
                <strong>{product.name}</strong>
                <span>{product.sku}</span>
              </div>
              <dl>
                <div>
                  <dt>Kategori</dt>
                  <dd>{product.category}</dd>
                </div>
                <div>
                  <dt>Mevcut Stok</dt>
                  <dd>{product.stock}</dd>
                </div>
                <div>
                  <dt>Düşük Stok Eşiği</dt>
                  <dd>{product.lowStockThreshold}</dd>
                </div>
                <div>
                  <dt>Stok Durumu</dt>
                  <dd className="stock-status">{statusLabels[product.stockStatus]}</dd>
                </div>
              </dl>
              <div className="stock-card__actions">
                <span>Aksiyon</span>
                <StockActions
                  isOpen={openMenuKey === menuKey}
                  menuKey={menuKey}
                  onOpenUpdate={onOpenUpdate}
                  onToggle={onToggleMenu}
                  product={product}
                />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function StockTable({
  openMenuKey,
  onOpenUpdate,
  onToggleMenu,
  products,
}: {
  openMenuKey: string | null
  onOpenUpdate: (product: ProductDemoRecord) => void
  onToggleMenu: (menuKey: string, trigger: HTMLButtonElement) => void
  products: ProductDemoRecord[]
}) {
  return (
    <table className="stock-table">
      <thead>
        <tr>
          <th scope="col">Ürün</th>
          <th scope="col">Kategori</th>
          <th className="stock-table__number" scope="col">
            Mevcut Stok
          </th>
          <th className="stock-table__number" scope="col">
            Düşük Stok Eşiği
          </th>
          <th scope="col">Stok Durumu</th>
          <th scope="col">Aksiyon</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => {
          const menuKey = `table-${product.id}`

          return (
            <tr key={product.id}>
              <td>
                <strong>{product.name}</strong>
                <span className="stock-table__sku">{product.sku}</span>
              </td>
              <td>{product.category}</td>
              <td className="stock-table__number">{product.stock}</td>
              <td className="stock-table__number">{product.lowStockThreshold}</td>
              <td>
                <span className="stock-status">{statusLabels[product.stockStatus]}</span>
              </td>
              <td>
                <StockActions
                  isOpen={openMenuKey === menuKey}
                  menuKey={menuKey}
                  onOpenUpdate={onOpenUpdate}
                  onToggle={onToggleMenu}
                  product={product}
                />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function StockUpdateDialog({
  onClose,
  product,
  returnFocusTo,
}: {
  onClose: () => void
  product: ProductDemoRecord
  returnFocusTo: HTMLButtonElement | null
}) {
  const dialogRef = useRef<HTMLElement>(null)
  const [validated, setValidated] = useState(false)
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setFocus,
  } = useForm<StockFormValues>({
    defaultValues: { stock: String(product.stock) },
  })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => setFocus('stock'))

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )
      const firstElement = focusableElements?.[0]
      const lastElement = focusableElements?.[focusableElements.length - 1]

      if (!firstElement || !lastElement) {
        return
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      window.requestAnimationFrame(() => returnFocusTo?.focus())
    }
  }, [onClose, returnFocusTo, setFocus])

  const submit = (values: StockFormValues) => {
    const result = stockValueSchema.safeParse(values.stock)

    if (!result.success) {
      setValidated(false)
      setError('stock', {
        message: result.error.issues[0]?.message,
        type: 'validate',
      })
      setFocus('stock')
      return
    }

    setValidated(true)
  }

  return (
    <div className="stock-dialog-layer">
      <section
        aria-describedby="stock-dialog-description"
        aria-labelledby="stock-dialog-title"
        aria-modal="true"
        className="stock-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <header>
          <h2 id="stock-dialog-title">Stok Güncelle</h2>
          <p>{product.name}</p>
        </header>

        <dl className="stock-dialog__summary">
          <div>
            <dt>Mevcut stok</dt>
            <dd>{product.stock}</dd>
          </div>
          <div>
            <dt>Stok durumu</dt>
            <dd>{statusLabels[product.stockStatus]}</dd>
          </div>
        </dl>

        <form noValidate onSubmit={handleSubmit(submit)}>
          <div className="stock-dialog__field">
            <label htmlFor="stock-threshold">Düşük stok eşiği</label>
            <input id="stock-threshold" readOnly type="number" value={product.lowStockThreshold} />
          </div>

          <div className="stock-dialog__field">
            <label htmlFor="new-stock">Yeni stok</label>
            <input
              aria-describedby={errors.stock ? 'new-stock-error' : 'stock-dialog-description'}
              aria-invalid={errors.stock ? true : undefined}
              id="new-stock"
              inputMode="numeric"
              min="0"
              required
              step="1"
              type="number"
              {...register('stock', {
                onChange: () => setValidated(false),
              })}
            />
            {errors.stock?.message ? (
              <p className="stock-dialog__error" id="new-stock-error" role="alert">
                {errors.stock.message}
              </p>
            ) : null}
          </div>

          <p className="stock-dialog__note" id="stock-dialog-description">
            Bu demo işlem değeri doğrular; ürün stoğunu kalıcı olarak değiştirmez.
          </p>

          {validated ? (
            <p className="stock-dialog__result" role="status">
              Yeni stok değeri doğrulandı. Demo veride değişiklik yapılmadı.
            </p>
          ) : null}

          <div className="stock-dialog__actions">
            <button onClick={onClose} type="button">
              İptal
            </button>
            <button className="stock-dialog__submit" type="submit">
              Değeri Doğrula
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function StockPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null)
  const [modalReturnFocusTo, setModalReturnFocusTo] = useState<HTMLButtonElement | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductDemoRecord | null>(null)
  const actionContainerRef = useRef<HTMLElement | null>(null)
  const actionTriggerRef = useRef<HTMLButtonElement | null>(null)
  const requestedFilter = searchParams.get('durum') ?? ''
  const selectedFilter = validFilterValues.has(requestedFilter as StockFilter)
    ? (requestedFilter as StockFilter)
    : ''
  const query = searchParams.get('q') ?? ''

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>, options: { replace?: boolean } = {}) => {
      const nextParams = new URLSearchParams(searchParams)

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          nextParams.set(key, value)
        } else {
          nextParams.delete(key)
        }
      })

      setSearchParams(nextParams, options)
    },
    [searchParams, setSearchParams],
  )

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')

    return productDemoData
      .filter((product) => {
        if (selectedFilter && product.stockStatus !== filterStatusMap[selectedFilter]) {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        return [product.name, product.sku].some((value) =>
          value.toLocaleLowerCase('tr-TR').includes(normalizedQuery),
        )
      })
      .toSorted(
        (first, second) =>
          first.stock - second.stock || first.name.localeCompare(second.name, 'tr-TR'),
      )
  }, [query, selectedFilter])

  const requestedPageValue = Number(searchParams.get('sayfa') ?? '1')
  const requestedPage = Number.isInteger(requestedPageValue) ? requestedPageValue : 1
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  const currentPage = Math.min(Math.max(requestedPage, 1), pageCount)
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )
  const hasActiveFilters = Boolean(selectedFilter || query)

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

  useEffect(() => {
    if (!openMenuKey) {
      return
    }

    const closeMenu = (returnFocus: boolean) => {
      setOpenMenuKey(null)

      if (returnFocus) {
        window.requestAnimationFrame(() => actionTriggerRef.current?.focus())
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!actionContainerRef.current?.contains(event.target as Node)) {
        closeMenu(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu(true)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenuKey])

  const toggleMenu = (menuKey: string, trigger: HTMLButtonElement) => {
    if (openMenuKey === menuKey) {
      setOpenMenuKey(null)
      return
    }

    actionTriggerRef.current = trigger
    actionContainerRef.current = trigger.closest<HTMLElement>('[data-stock-actions]')
    setOpenMenuKey(menuKey)
  }

  const openUpdateDialog = (product: ProductDemoRecord) => {
    setModalReturnFocusTo(actionTriggerRef.current)
    setOpenMenuKey(null)
    setSelectedProduct(product)
  }

  const closeUpdateDialog = useCallback(() => {
    setSelectedProduct(null)
  }, [])

  const setFilter = (filter: StockFilter) => {
    updateSearchParams({ durum: filter || null, sayfa: null })
  }

  const setPage = (page: number) => {
    updateSearchParams({ sayfa: page === 1 ? null : String(page) })
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  return (
    <div className="stock-page">
      <div inert={selectedProduct ? true : undefined}>
        <header className="stock-page__header">
          <h1 id="page-title">Stok</h1>
          <p>Ürün stoklarını izleyin ve güncelleme değerlerini doğrulayın.</p>
        </header>

        <section aria-labelledby="stock-quick-filters-title" className="stock-quick-section">
          <h2 className="stock-visually-hidden" id="stock-quick-filters-title">
            Stok hızlı filtreleri
          </h2>
          <div className="stock-quick-filters">
            {quickFilters.map((filter) => (
              <button
                aria-pressed={selectedFilter === filter.value}
                key={filter.value || 'all'}
                onClick={() => setFilter(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Stok arama, filtreleme ve sıralama" className="stock-toolbar">
          <div className="stock-field">
            <label htmlFor="stock-search">Stokta ara</label>
            <input
              id="stock-search"
              onChange={(event) =>
                updateSearchParams({ q: event.target.value || null, sayfa: null }, { replace: true })
              }
              placeholder="Ürün adı veya SKU"
              type="search"
              value={query}
            />
          </div>
          <div className="stock-sort" aria-label="Sıralama">
            <span>Sıralama</span>
            <strong>Stok: Az → Çok</strong>
          </div>

          {hasActiveFilters ? (
            <div className="stock-active-filters" aria-label="Aktif filtreler">
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

        <section aria-labelledby="stock-list-title" className="stock-list-section">
          <div className="stock-list-section__header">
            <div>
              <h2 id="stock-list-title">Stok Listesi</h2>
              <p aria-live="polite">{filteredProducts.length} ürün</p>
            </div>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="stock-list" aria-label="Stok ürünleri">
              <StockTable
                openMenuKey={openMenuKey}
                onOpenUpdate={openUpdateDialog}
                onToggleMenu={toggleMenu}
                products={visibleProducts}
              />
              <StockCards
                openMenuKey={openMenuKey}
                onOpenUpdate={openUpdateDialog}
                onToggleMenu={toggleMenu}
                products={visibleProducts}
              />
            </div>
          ) : (
            <div className="stock-no-results" role="status">
              <h3>Sonuç bulunamadı</h3>
              <p>Arama veya stok filtresini değiştirerek yeniden deneyin.</p>
              <button onClick={clearFilters} type="button">
                Filtreleri Temizle
              </button>
            </div>
          )}

          {filteredProducts.length > itemsPerPage ? (
            <nav aria-label="Stok sayfaları" className="stock-pagination">
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

      {selectedProduct ? (
        <StockUpdateDialog
          onClose={closeUpdateDialog}
          product={selectedProduct}
          returnFocusTo={modalReturnFocusTo}
        />
      ) : null}
    </div>
  )
}

export default StockPage
