import { useEffect, useMemo, useState } from 'react'
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldError,
  type FieldErrors,
  type Resolver,
} from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { CreateOrderInput, OrderDetailResponse } from '../contracts/orders'
import type { ProductListItem, ProductsResponse } from '../contracts/products'
import type { SettingsResponse } from '../contracts/settings'
import { ApiError, apiJson } from '../lib/api'
import './OrderCreatePage.css'
import {
  deliveryMethods,
  orderCreateSchema,
  type DeliveryMethod,
  type OrderCreateFormValues,
} from './orders/orderCreateSchema'

const currencyFormatter = new Intl.NumberFormat('tr-TR', { currency: 'TRY', style: 'currency' })
const defaultValues: OrderCreateFormValues = {
  address: '', customerName: '', deliveryDate: '', deliveryEndTime: '', deliveryMethod: '',
  deliveryStartTime: '', email: '', items: [], phone: '', productSearch: '',
}
const businessErrorMessages: Record<string, string> = {
  CUSTOMER_MATCH_CONFLICT: 'Telefon ve e-posta farklı müşteri kayıtlarıyla eşleşiyor. Bilgileri kontrol edin.',
  ORDER_SETTINGS_NOT_CONFIGURED: 'Sipariş ayarları henüz yapılandırılmadı.',
  DELIVERY_METHOD_UNAVAILABLE: 'Seçilen teslimat yöntemi şu anda kullanılamıyor.',
  PRODUCT_UNAVAILABLE: 'Seçilen ürünlerden biri artık kullanılamıyor. Ürün listesini kontrol edin.',
  INSUFFICIENT_STOCK: 'Seçilen ürünlerden biri için yeterli stok bulunmuyor.',
  MINIMUM_ORDER_NOT_MET: 'Sipariş, minimum ürün ara toplamını karşılamıyor.',
  STOCK_CONFLICT: 'Stok aynı anda değişti. Güncel stoklarla yeniden deneyin.',
}

type ProductFeedback = { kind: 'error' | 'status'; message: string }
type FieldMessageProps = { error?: FieldError; id: string }

function createZodResolver(): Resolver<OrderCreateFormValues> {
  return async (values) => {
    const result = orderCreateSchema.safeParse(values)
    if (result.success) return { errors: {}, values: result.data }
    const nestedErrors: Record<string, unknown> = {}
    result.error.issues.forEach((issue) => {
      const [fieldName, itemIndex, itemFieldName] = issue.path
      const fieldError: FieldError = { message: issue.message, type: issue.code }
      if (fieldName === 'items' && typeof itemIndex === 'number' && typeof itemFieldName === 'string') {
        const itemErrors = (nestedErrors.items ?? []) as Array<Record<string, FieldError>>
        itemErrors[itemIndex] ??= {}
        itemErrors[itemIndex][itemFieldName] ??= fieldError
        nestedErrors.items = itemErrors
      } else if (typeof fieldName === 'string' && !nestedErrors[fieldName]) {
        nestedErrors[fieldName] = fieldError
      }
    })
    return { errors: nestedErrors as FieldErrors<OrderCreateFormValues>, values: {} }
  }
}

function FieldMessage({ error, id }: FieldMessageProps) {
  return error?.message ? <p className="order-create-field__error" id={id} role="alert">{error.message}</p> : null
}
function formatCurrency(valueMinor: number) { return currencyFormatter.format(valueMinor / 100) }
function getTodayInputValue() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}
function methodAvailable(method: DeliveryMethod, settings: SettingsResponse) {
  return method === 'Teslimat' ? settings.deliveryEnabled : settings.pickupEnabled
}

function OrderCreatePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const resolver = useMemo(() => createZodResolver(), [])
  const todayInputValue = useMemo(() => getTodayInputValue(), [])
  const [productFeedback, setProductFeedback] = useState<ProductFeedback | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [settingsReloadKey, setSettingsReloadKey] = useState(0)
  const [productsReloadKey, setProductsReloadKey] = useState(0)
  const [settingsState, setSettingsState] = useState<{ key: number; data: SettingsResponse | null; error: boolean }>({ key: -1, data: null, error: false })
  const [productsState, setProductsState] = useState<{ key: string; data: ProductsResponse | null; error: boolean }>({ key: '', data: null, error: false })
  const [productCache, setProductCache] = useState<Record<string, ProductListItem>>({})
  const {
    clearErrors, control, formState: { errors, isSubmitted, isSubmitting }, getValues,
    handleSubmit, register, setError, setValue, trigger,
  } = useForm<OrderCreateFormValues>({ defaultValues, resolver, shouldFocusError: true })
  const { append, fields, remove } = useFieldArray({ control, name: 'items' })
  const deliveryMethod = useWatch({ control, name: 'deliveryMethod' })
  const items = useWatch({ control, name: 'items' })
  const productSearch = useWatch({ control, name: 'productSearch' })
  const listPath = `/siparisler${location.search}`
  const productQuery = new URLSearchParams({ page: '1', status: 'active' })
  if (productSearch.trim()) productQuery.set('q', productSearch.trim())
  const productApiQuery = productQuery.toString()
  const productRequestKey = `${productApiQuery}:${productsReloadKey}`
  const settingsLoading = settingsState.key !== settingsReloadKey
  const settings = settingsLoading ? null : settingsState.data
  const productsLoading = productsState.key !== productRequestKey
  const productResponse = productsLoading ? null : productsState.data
  const availableDeliveryMethods = settings ? deliveryMethods.filter((method) => methodAvailable(method, settings)) : []

  useEffect(() => {
    const controller = new AbortController()
    apiJson<SettingsResponse>('/api/settings', { signal: controller.signal })
      .then((data) => setSettingsState({ key: settingsReloadKey, data, error: false }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setSettingsState({ key: settingsReloadKey, data: null, error: true })
      })
    return () => controller.abort()
  }, [settingsReloadKey])

  useEffect(() => {
    const controller = new AbortController()
    apiJson<ProductsResponse>(`/api/products?${productApiQuery}`, { signal: controller.signal })
      .then((data) => {
        setProductsState({ key: productRequestKey, data, error: false })
        setProductCache((current) => {
          const next = { ...current }
          data.items.forEach((product) => { next[String(product.id)] = product })
          return next
        })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setProductsState({ key: productRequestKey, data: null, error: true })
      })
    return () => controller.abort()
  }, [productApiQuery, productRequestKey])

  const subtotal = items.reduce((total, item) => {
    const product = productCache[item.productId]
    const quantity = Number(item.quantity)
    return product && Number.isInteger(quantity) && quantity > 0 ? total + product.priceMinor * quantity : total
  }, 0)
  const deliveryFee = deliveryMethod === 'Teslimat' ? settings?.deliveryFeeMinor ?? 0 : 0
  const grandTotal = subtotal + deliveryFee
  const minimumOrderMet = settings ? subtotal >= settings.minimumOrderMinor : false

  const revalidateAfterProductChange = () => { if (isSubmitted) void trigger() }
  const addProduct = (product: ProductListItem) => {
    setSubmitError(null)
    if (product.publicationStatus !== 'active' || product.stockQuantity === 0) {
      setProductFeedback({ kind: 'error', message: `${product.name} seçilemez.` }); return
    }
    const currentItems = getValues('items')
    const index = currentItems.findIndex((item) => item.productId === String(product.id))
    if (index >= 0) {
      const quantity = Number(currentItems[index].quantity)
      if (!Number.isInteger(quantity) || quantity < 1) { setProductFeedback({ kind: 'error', message: `${product.name} için önce geçerli bir adet girin.` }); return }
      if (quantity >= product.stockQuantity) { setProductFeedback({ kind: 'error', message: `${product.name} için mevcut stok sınırına ulaşıldı.` }); return }
      setValue(`items.${index}.quantity`, String(quantity + 1), { shouldDirty: true })
      setProductFeedback({ kind: 'status', message: `${product.name} adedi artırıldı.` })
    } else {
      append({ productId: String(product.id), quantity: '1' })
      setProductFeedback({ kind: 'status', message: `${product.name} siparişe eklendi.` })
    }
    clearErrors('productSearch'); revalidateAfterProductChange()
  }
  const removeProduct = (index: number, name: string) => {
    remove(index); setProductFeedback({ kind: 'status', message: `${name} siparişten kaldırıldı.` }); setSubmitError(null); revalidateAfterProductChange()
  }

  const submitOrder = async (values: OrderCreateFormValues) => {
    if (!settings) { setSubmitError('Sipariş ayarları yüklenmeden sipariş oluşturulamaz.'); return }
    let invalidItem = false
    values.items.forEach((item, index) => {
      const product = productCache[item.productId]
      const quantity = Number(item.quantity)
      if (!product || product.publicationStatus !== 'active') {
        setError(`items.${index}.quantity`, { message: 'Bu ürün artık kullanılamıyor.', type: 'validate' }); invalidItem = true
      } else if (quantity > product.stockQuantity) {
        setError(`items.${index}.quantity`, { message: `En fazla ${product.stockQuantity} adet seçebilirsiniz.`, type: 'validate' }); invalidItem = true
      }
    })
    if (invalidItem) return
    const body: CreateOrderInput = {
      customer: { name: values.customerName, phone: values.phone, ...(values.email ? { email: values.email } : {}) },
      items: values.items.map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity) })),
      delivery: {
        method: values.deliveryMethod === 'Teslimat' ? 'delivery' : 'pickup',
        ...(values.deliveryMethod === 'Teslimat' ? { address: values.address } : {}),
        date: values.deliveryDate, startTime: values.deliveryStartTime, endTime: values.deliveryEndTime,
      },
    }
    setSubmitError(null)
    try {
      const response = await apiJson<OrderDetailResponse>('/api/orders', { method: 'POST', body: JSON.stringify(body) })
      navigate(`/siparisler/${response.order.id}${location.search}`)
    } catch (caught) {
      const code = caught instanceof ApiError ? caught.code : null
      setSubmitError(businessErrorMessages[code ?? ''] ?? 'Sipariş oluşturulamadı. Bilgileri kontrol edip yeniden deneyin.')
      if (code === 'ORDER_SETTINGS_NOT_CONFIGURED' || code === 'DELIVERY_METHOD_UNAVAILABLE' || code === 'MINIMUM_ORDER_NOT_MET') setSettingsReloadKey((key) => key + 1)
      if (code === 'PRODUCT_UNAVAILABLE' || code === 'INSUFFICIENT_STOCK' || code === 'STOCK_CONFLICT') setProductsReloadKey((key) => key + 1)
    }
  }

  return <div className="order-create-page">
    <Link className="order-create-page__back" to={listPath}>Siparişlere dön</Link>
    <header className="order-create-page__header"><h1 id="page-title">Sipariş Oluştur</h1><p>Müşteri, ürün ve teslimat bilgilerini tek formda hazırlayın.</p></header>
    {!settingsLoading && (settingsState.error || !settings || availableDeliveryMethods.length === 0) ? <div className="order-create-page__settings-error" role="alert">Sipariş ve teslimat ayarları hazır değil. <button onClick={() => setSettingsReloadKey((key) => key + 1)} type="button">Yeniden Dene</button></div> : null}
    <form className="order-create-form" noValidate onChange={() => setSubmitError(null)} onSubmit={handleSubmit(submitOrder)}>
      <div className="order-create-form__main-column">
        <section className="order-create-section" aria-labelledby="customer-title"><h2 id="customer-title">Müşteri</h2><div className="order-create-fields order-create-fields--two-columns">
          <div className="order-create-field order-create-field--wide"><label htmlFor="order-customer-name">Ad</label><input aria-describedby={errors.customerName ? 'order-customer-name-error' : undefined} aria-invalid={Boolean(errors.customerName)} autoComplete="name" id="order-customer-name" required type="text" {...register('customerName')} /><FieldMessage error={errors.customerName} id="order-customer-name-error" /></div>
          <div className="order-create-field"><label htmlFor="order-customer-phone">Telefon</label><input aria-describedby={errors.phone ? 'order-customer-phone-error' : undefined} aria-invalid={Boolean(errors.phone)} autoComplete="tel" id="order-customer-phone" required type="tel" {...register('phone')} /><FieldMessage error={errors.phone} id="order-customer-phone-error" /></div>
          <div className="order-create-field"><label htmlFor="order-customer-email">E-posta (opsiyonel)</label><input aria-describedby={errors.email ? 'order-customer-email-error' : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" id="order-customer-email" type="email" {...register('email')} /><FieldMessage error={errors.email} id="order-customer-email-error" /></div>
        </div></section>
        <section className="order-create-section" aria-labelledby="products-title"><h2 id="products-title">Ürünler</h2><div className="order-create-field"><label htmlFor="order-product-search">Ürün ara</label><input aria-describedby={errors.productSearch ? 'order-product-search-error' : undefined} aria-invalid={Boolean(errors.productSearch)} autoComplete="off" id="order-product-search" type="search" {...register('productSearch')} /><FieldMessage error={errors.productSearch} id="order-product-search-error" /></div>
          {productsState.error && !productsLoading ? <p className="order-create-product-feedback order-create-product-feedback--error" role="alert">Ürünler yüklenemedi. <button onClick={() => setProductsReloadKey((key) => key + 1)} type="button">Yeniden Dene</button></p> : productsLoading ? <p className="order-create-section__note" role="status">Ürünler yükleniyor…</p> : <ul className="order-create-product-results" aria-label="Ürün arama sonuçları">{productResponse?.items.map((product) => { const unavailable = product.stockQuantity === 0; return <li key={product.id}><div><strong>{product.name}</strong><span>{product.category}</span></div><div className="order-create-product-results__stock"><strong>{formatCurrency(product.priceMinor)}</strong><span>{unavailable ? 'Tükendi' : `Stok: ${product.stockQuantity}`}</span></div><button aria-label={unavailable ? `${product.name} tükendi` : `${product.name} ürününü ekle`} disabled={unavailable} onClick={() => addProduct(product)} type="button">{unavailable ? 'Tükendi' : 'Ekle'}</button></li> })}</ul>}
          {!productsLoading && !productsState.error && productResponse?.items.length === 0 ? <p className="order-create-section__note">Aramayla eşleşen aktif ürün yok.</p> : null}
          {productFeedback ? <p className={`order-create-product-feedback order-create-product-feedback--${productFeedback.kind}`} role={productFeedback.kind === 'error' ? 'alert' : 'status'}>{productFeedback.message}</p> : null}
          <div className="order-create-selected-products"><h3>Seçilen Ürünler</h3>{fields.length === 0 ? <p className="order-create-section__note">Henüz ürün eklenmedi.</p> : <ul>{fields.map((field, index) => { const product = productCache[field.productId]; const quantityError = errors.items?.[index]?.quantity; const quantity = Number(items[index]?.quantity); const lineTotal = product && Number.isInteger(quantity) && quantity > 0 ? product.priceMinor * quantity : 0; const stockId = `order-item-${index}-stock`; const errorId = `order-item-${index}-quantity-error`; return <li key={field.id}><div className="order-create-selected-products__identity"><strong>{product?.name ?? 'Ürün bulunamadı'}</strong><span>{product ? formatCurrency(product.priceMinor) : '—'}</span></div><div className="order-create-field order-create-selected-products__quantity"><label htmlFor={`order-item-${index}-quantity`}>Adet</label><input aria-describedby={`${stockId}${quantityError ? ` ${errorId}` : ''}`} aria-invalid={Boolean(quantityError)} id={`order-item-${index}-quantity`} inputMode="numeric" max={product?.stockQuantity} min="1" step="1" type="number" {...register(`items.${index}.quantity`)} /><span id={stockId}>En fazla {product?.stockQuantity ?? 0}</span><FieldMessage error={quantityError} id={errorId} /></div><strong className="order-create-selected-products__total">{formatCurrency(lineTotal)}</strong><button onClick={() => removeProduct(index, product?.name ?? 'Ürün')} type="button">Kaldır</button></li> })}</ul>}</div>
        </section>
        <section className="order-create-section" aria-labelledby="delivery-method-title"><h2 id="delivery-method-title">Teslimat Yöntemi</h2><fieldset className="order-create-methods"><legend className="order-create-visually-hidden">Teslimat yöntemi seçimi</legend>{availableDeliveryMethods.map((method) => <label key={method}><input aria-describedby={errors.deliveryMethod ? 'order-delivery-method-error' : undefined} aria-invalid={Boolean(errors.deliveryMethod)} type="radio" value={method} {...register('deliveryMethod')} /><span><strong>{method}</strong><small>{method === 'Teslimat' ? `${formatCurrency(settings?.deliveryFeeMinor ?? 0)} teslimat ücreti` : 'Teslimat ücreti yok'}</small></span></label>)}</fieldset><FieldMessage error={errors.deliveryMethod} id="order-delivery-method-error" /></section>
        <section className="order-create-section" aria-labelledby="delivery-info-title"><h2 id="delivery-info-title">Teslimat Bilgileri</h2>{!deliveryMethod ? <p className="order-create-section__note">Teslimat bilgilerini girmek için önce teslimat yöntemini seçin.</p> : <div className="order-create-fields order-create-fields--two-columns">{deliveryMethod === 'Teslimat' ? <div className="order-create-field order-create-field--wide"><label htmlFor="order-delivery-address">Teslimat adresi</label><textarea aria-describedby={errors.address ? 'order-delivery-address-error' : undefined} aria-invalid={Boolean(errors.address)} autoComplete="street-address" id="order-delivery-address" required rows={3} {...register('address')} /><FieldMessage error={errors.address} id="order-delivery-address-error" /></div> : null}<div className="order-create-field order-create-field--wide"><label htmlFor="order-delivery-date">Tarih</label><input aria-describedby={errors.deliveryDate ? 'order-delivery-date-error' : undefined} aria-invalid={Boolean(errors.deliveryDate)} id="order-delivery-date" min={todayInputValue} required type="date" {...register('deliveryDate')} /><FieldMessage error={errors.deliveryDate} id="order-delivery-date-error" /></div><fieldset className="order-create-time-range order-create-field--wide"><legend>Saat aralığı</legend><div><div className="order-create-field"><label htmlFor="order-delivery-start-time">Başlangıç</label><input aria-describedby={errors.deliveryStartTime ? 'order-delivery-start-time-error' : undefined} aria-invalid={Boolean(errors.deliveryStartTime)} id="order-delivery-start-time" required type="time" {...register('deliveryStartTime')} /><FieldMessage error={errors.deliveryStartTime} id="order-delivery-start-time-error" /></div><div className="order-create-field"><label htmlFor="order-delivery-end-time">Bitiş</label><input aria-describedby={errors.deliveryEndTime ? 'order-delivery-end-time-error' : undefined} aria-invalid={Boolean(errors.deliveryEndTime)} id="order-delivery-end-time" required type="time" {...register('deliveryEndTime')} /><FieldMessage error={errors.deliveryEndTime} id="order-delivery-end-time-error" /></div></div></fieldset></div>}</section>
      </div>
      <aside className="order-create-summary" aria-labelledby="order-summary-title"><h2 id="order-summary-title">Sipariş Özeti</h2><dl><div><dt>Ara Toplam</dt><dd>{formatCurrency(subtotal)}</dd></div><div><dt>Teslimat</dt><dd>{formatCurrency(deliveryFee)}</dd></div><div className="order-create-summary__total"><dt>Genel Toplam</dt><dd>{formatCurrency(grandTotal)}</dd></div></dl>{settings ? <p className={minimumOrderMet ? 'order-create-summary__minimum' : 'order-create-summary__minimum order-create-summary__minimum--unmet'}>Minimum ürün ara toplamı: {formatCurrency(settings.minimumOrderMinor)}</p> : null}<button disabled={!settings || availableDeliveryMethods.length === 0 || isSubmitting} type="submit">{isSubmitting ? 'Sipariş Oluşturuluyor…' : 'Sipariş Oluştur'}</button>{submitError ? <p className="order-create-summary__error" role="alert">{submitError}</p> : null}</aside>
    </form>
  </div>
}

export default OrderCreatePage
