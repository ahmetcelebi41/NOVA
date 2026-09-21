import { useMemo, useState } from 'react'
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldError,
  type FieldErrors,
  type Resolver,
} from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import './OrderCreatePage.css'
import {
  deliveryMethods,
  orderCreateSchema,
  resolveCustomerMatch,
  type DeliveryMethod,
  type OrderCreateFormValues,
} from './orders/orderCreateSchema'
import { productDemoData, type ProductDemoRecord } from './products/productDemoData'
import { orderCreateDemoSettings } from './settings/settingsDemoData'

const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  currency: 'TRY',
  style: 'currency',
})

const defaultValues: OrderCreateFormValues = {
  address: '',
  customerName: '',
  deliveryDate: '',
  deliveryEndTime: '',
  deliveryMethod: '',
  deliveryStartTime: '',
  email: '',
  items: [],
  phone: '',
  productSearch: '',
}

type FieldMessageProps = {
  error?: FieldError
  id: string
}

type ProductFeedback = {
  kind: 'error' | 'status'
  message: string
}

function createZodResolver(): Resolver<OrderCreateFormValues> {
  return async (values) => {
    const result = orderCreateSchema.safeParse(values)

    if (result.success) {
      return { errors: {}, values: result.data }
    }

    const nestedErrors: Record<string, unknown> = {}

    result.error.issues.forEach((issue) => {
      const [fieldName, itemIndex, itemFieldName] = issue.path
      const fieldError: FieldError = {
        message: issue.message,
        type: issue.code,
      }

      if (
        fieldName === 'items' &&
        typeof itemIndex === 'number' &&
        typeof itemFieldName === 'string'
      ) {
        const itemErrors = (nestedErrors.items ?? []) as Array<
          Record<string, FieldError>
        >
        itemErrors[itemIndex] ??= {}
        itemErrors[itemIndex][itemFieldName] ??= fieldError
        nestedErrors.items = itemErrors
        return
      }

      if (typeof fieldName === 'string' && !nestedErrors[fieldName]) {
        nestedErrors[fieldName] = fieldError
      }
    })

    return {
      errors: nestedErrors as FieldErrors<OrderCreateFormValues>,
      values: {},
    }
  }
}

function FieldMessage({ error, id }: FieldMessageProps) {
  if (!error?.message) {
    return null
  }

  return (
    <p className="order-create-field__error" id={id} role="alert">
      {error.message}
    </p>
  )
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

function getTodayInputValue() {
  const today = new Date()
  const year = String(today.getFullYear())
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getProduct(productId: string) {
  return productDemoData.find((product) => product.id === productId)
}

function isMethodAvailable(method: DeliveryMethod) {
  return method === 'Teslimat'
    ? orderCreateDemoSettings.deliveryEnabled
    : orderCreateDemoSettings.pickupEnabled
}

function OrderCreatePage() {
  const location = useLocation()
  const resolver = useMemo(() => createZodResolver(), [])
  const todayInputValue = useMemo(() => getTodayInputValue(), [])
  const [productFeedback, setProductFeedback] = useState<ProductFeedback | null>(null)
  const [submitValidated, setSubmitValidated] = useState(false)
  const {
    clearErrors,
    control,
    formState: { errors, isSubmitted, isSubmitting },
    getValues,
    handleSubmit,
    register,
    setValue,
    trigger,
  } = useForm<OrderCreateFormValues>({
    defaultValues,
    resolver,
    shouldFocusError: true,
  })
  const { append, fields, remove } = useFieldArray({ control, name: 'items' })
  const deliveryMethod = useWatch({ control, name: 'deliveryMethod' })
  const email = useWatch({ control, name: 'email' })
  const items = useWatch({ control, name: 'items' })
  const phone = useWatch({ control, name: 'phone' })
  const productSearch = useWatch({ control, name: 'productSearch' })
  const customerMatch = useMemo(
    () => resolveCustomerMatch(phone, email),
    [email, phone],
  )
  const settingsReady =
    (orderCreateDemoSettings.deliveryEnabled || orderCreateDemoSettings.pickupEnabled) &&
    Number.isFinite(orderCreateDemoSettings.deliveryFee) &&
    orderCreateDemoSettings.deliveryFee >= 0 &&
    Number.isFinite(orderCreateDemoSettings.minimumOrderAmount) &&
    orderCreateDemoSettings.minimumOrderAmount >= 0
  const availableDeliveryMethods = deliveryMethods.filter(isMethodAvailable)
  const listPath = `/siparisler${location.search}`

  const selectableProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase('tr-TR')

    return productDemoData.filter(
      (product) =>
        product.publication === 'Aktif' &&
        (!query || product.name.toLocaleLowerCase('tr-TR').includes(query)),
    )
  }, [productSearch])

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const product = getProduct(item.productId)
        const quantity = Number(item.quantity)

        if (!product || !Number.isInteger(quantity) || quantity < 1) {
          return total
        }

        return total + product.price * quantity
      }, 0),
    [items],
  )
  const deliveryFee =
    deliveryMethod === 'Teslimat' ? orderCreateDemoSettings.deliveryFee : 0
  const grandTotal = subtotal + deliveryFee
  const minimumOrderMet = subtotal >= orderCreateDemoSettings.minimumOrderAmount

  const revalidateAfterProductChange = () => {
    if (isSubmitted) {
      void trigger()
    }
  }

  const addProduct = (product: ProductDemoRecord) => {
    setSubmitValidated(false)

    if (
      product.publication !== 'Aktif' ||
      product.stockStatus === 'Tükendi' ||
      product.stock === 0
    ) {
      setProductFeedback({ kind: 'error', message: `${product.name} seçilemez.` })
      return
    }

    const currentItems = getValues('items')
    const existingIndex = currentItems.findIndex(
      (item) => item.productId === product.id,
    )

    if (existingIndex >= 0) {
      const currentQuantity = Number(currentItems[existingIndex].quantity)

      if (!Number.isInteger(currentQuantity) || currentQuantity < 1) {
        setProductFeedback({
          kind: 'error',
          message: `${product.name} için önce geçerli bir adet girin.`,
        })
        return
      }

      if (currentQuantity >= product.stock) {
        setProductFeedback({
          kind: 'error',
          message: `${product.name} için mevcut stok sınırına ulaşıldı.`,
        })
        return
      }

      setValue(`items.${existingIndex}.quantity`, String(currentQuantity + 1), {
        shouldDirty: true,
      })
      setProductFeedback({
        kind: 'status',
        message: `${product.name} adedi artırıldı.`,
      })
    } else {
      append({ productId: product.id, quantity: '1' })
      setProductFeedback({
        kind: 'status',
        message: `${product.name} siparişe eklendi.`,
      })
    }

    clearErrors('productSearch')
    revalidateAfterProductChange()
  }

  const removeProduct = (index: number, productName: string) => {
    remove(index)
    setSubmitValidated(false)
    setProductFeedback({
      kind: 'status',
      message: `${productName} siparişten kaldırıldı.`,
    })
    revalidateAfterProductChange()
  }

  return (
    <div className="order-create-page">
      <Link className="order-create-page__back" to={listPath}>
        Siparişlere dön
      </Link>

      <header className="order-create-page__header">
        <h1 id="page-title">Sipariş Oluştur</h1>
        <p>Müşteri, ürün ve teslimat bilgilerini tek formda hazırlayın.</p>
      </header>

      {!settingsReady ? (
        <div className="order-create-page__settings-error" role="alert">
          Kritik sipariş ve teslimat ayarları hazır değil. Sipariş oluşturma şu anda
          kullanılamıyor.
        </div>
      ) : null}

      <form
        className="order-create-form"
        noValidate
        onChange={() => {
          setProductFeedback(null)
          setSubmitValidated(false)
        }}
        onSubmit={handleSubmit(
          async () => setSubmitValidated(true),
          () => setSubmitValidated(false),
        )}
      >
        <div className="order-create-form__main-column">
          <section className="order-create-section" aria-labelledby="customer-title">
            <h2 id="customer-title">Müşteri</h2>
            <div className="order-create-fields order-create-fields--two-columns">
              <div className="order-create-field order-create-field--wide">
                <label htmlFor="order-customer-name">Ad</label>
                <input
                  aria-describedby={
                    errors.customerName ? 'order-customer-name-error' : undefined
                  }
                  aria-invalid={errors.customerName ? true : undefined}
                  autoComplete="name"
                  id="order-customer-name"
                  required
                  type="text"
                  {...register('customerName')}
                />
                <FieldMessage
                  error={errors.customerName}
                  id="order-customer-name-error"
                />
              </div>

              <div className="order-create-field">
                <label htmlFor="order-customer-phone">Telefon</label>
                <input
                  aria-describedby={
                    errors.phone ? 'order-customer-phone-error' : undefined
                  }
                  aria-invalid={errors.phone ? true : undefined}
                  autoComplete="tel"
                  id="order-customer-phone"
                  required
                  type="tel"
                  {...register('phone')}
                />
                <FieldMessage error={errors.phone} id="order-customer-phone-error" />
              </div>

              <div className="order-create-field">
                <label htmlFor="order-customer-email">E-posta (opsiyonel)</label>
                <input
                  aria-describedby={
                    errors.email ? 'order-customer-email-error' : undefined
                  }
                  aria-invalid={errors.email ? true : undefined}
                  autoComplete="email"
                  id="order-customer-email"
                  type="email"
                  {...register('email')}
                />
                <FieldMessage error={errors.email} id="order-customer-email-error" />
              </div>
            </div>

            {phone || email ? (
              <div
                className={`order-create-customer-match order-create-customer-match--${customerMatch.kind}`}
                role={customerMatch.kind === 'conflict' ? 'alert' : 'status'}
              >
                {customerMatch.kind === 'conflict' ? (
                  <p>
                    Telefon {customerMatch.phoneCustomer.name}, e-posta ise{' '}
                    {customerMatch.emailCustomer.name} kaydıyla eşleşiyor. Çakışmayı
                    giderin.
                  </p>
                ) : customerMatch.kind === 'matched' ? (
                  <p>
                    {customerMatch.source} ile {customerMatch.customer.name} kaydı
                    eşleşti. Form bilgileri sipariş snapshot’ında korunur.
                  </p>
                ) : (
                  <p>Bu bilgiler yeni müşteri senaryosu olarak değerlendirilecek.</p>
                )}
              </div>
            ) : null}
          </section>

          <section className="order-create-section" aria-labelledby="products-title">
            <h2 id="products-title">Ürünler</h2>
            <div className="order-create-field">
              <label htmlFor="order-product-search">Ürün ara</label>
              <input
                aria-describedby={
                  errors.productSearch ? 'order-product-search-error' : undefined
                }
                aria-invalid={errors.productSearch ? true : undefined}
                autoComplete="off"
                id="order-product-search"
                type="search"
                {...register('productSearch')}
              />
              <FieldMessage
                error={errors.productSearch}
                id="order-product-search-error"
              />
            </div>

            <ul className="order-create-product-results" aria-label="Ürün arama sonuçları">
              {selectableProducts.map((product) => {
                const unavailable = product.stockStatus === 'Tükendi' || product.stock === 0

                return (
                  <li key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.category}</span>
                    </div>
                    <div className="order-create-product-results__stock">
                      <strong>{formatCurrency(product.price)}</strong>
                      <span>{unavailable ? 'Tükendi' : `Stok: ${product.stock}`}</span>
                    </div>
                    <button
                      aria-label={
                        unavailable
                          ? `${product.name} tükendi`
                          : `${product.name} ürününü ekle`
                      }
                      disabled={unavailable}
                      onClick={() => addProduct(product)}
                      type="button"
                    >
                      {unavailable ? 'Tükendi' : 'Ekle'}
                    </button>
                  </li>
                )
              })}
            </ul>

            {selectableProducts.length === 0 ? (
              <p className="order-create-section__note">Aramayla eşleşen aktif ürün yok.</p>
            ) : null}

            {productFeedback ? (
              <p
                className={`order-create-product-feedback order-create-product-feedback--${productFeedback.kind}`}
                role={productFeedback.kind === 'error' ? 'alert' : 'status'}
              >
                {productFeedback.message}
              </p>
            ) : null}

            <div className="order-create-selected-products">
              <h3>Seçilen Ürünler</h3>
              {fields.length === 0 ? (
                <p className="order-create-section__note">Henüz ürün eklenmedi.</p>
              ) : (
                <ul>
                  {fields.map((field, index) => {
                    const product = getProduct(field.productId)
                    const quantityError = errors.items?.[index]?.quantity
                    const quantity = Number(items[index]?.quantity)
                    const lineTotal =
                      product && Number.isInteger(quantity) && quantity > 0
                        ? product.price * quantity
                        : 0
                    const stockDescriptionId = `order-item-${index}-stock`
                    const errorId = `order-item-${index}-quantity-error`
                    const describedBy = [
                      stockDescriptionId,
                      quantityError ? errorId : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')

                    return (
                      <li key={field.id}>
                        <div className="order-create-selected-products__identity">
                          <strong>{product?.name ?? 'Ürün bulunamadı'}</strong>
                          <span>{product ? formatCurrency(product.price) : '—'}</span>
                        </div>
                        <div className="order-create-field order-create-selected-products__quantity">
                          <label htmlFor={`order-item-${index}-quantity`}>Adet</label>
                          <input
                            aria-describedby={describedBy || undefined}
                            aria-invalid={quantityError ? true : undefined}
                            id={`order-item-${index}-quantity`}
                            inputMode="numeric"
                            max={product?.stock}
                            min="1"
                            step="1"
                            type="number"
                            {...register(`items.${index}.quantity`)}
                          />
                          <span id={stockDescriptionId}>En fazla {product?.stock ?? 0}</span>
                          <FieldMessage error={quantityError} id={errorId} />
                        </div>
                        <strong className="order-create-selected-products__total">
                          {formatCurrency(lineTotal)}
                        </strong>
                        <button
                          onClick={() => removeProduct(index, product?.name ?? 'Ürün')}
                          type="button"
                        >
                          Kaldır
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="order-create-section" aria-labelledby="delivery-method-title">
            <h2 id="delivery-method-title">Teslimat Yöntemi</h2>
            <fieldset className="order-create-methods">
              <legend className="order-create-visually-hidden">
                Teslimat yöntemi seçimi
              </legend>
              {availableDeliveryMethods.map((method) => (
                <label key={method}>
                  <input
                    aria-describedby={
                      errors.deliveryMethod ? 'order-delivery-method-error' : undefined
                    }
                    aria-invalid={errors.deliveryMethod ? true : undefined}
                    type="radio"
                    value={method}
                    {...register('deliveryMethod')}
                  />
                  <span>
                    <strong>{method}</strong>
                    <small>
                      {method === 'Teslimat'
                        ? `${formatCurrency(orderCreateDemoSettings.deliveryFee)} teslimat ücreti`
                        : 'Teslimat ücreti yok'}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
            <FieldMessage
              error={errors.deliveryMethod}
              id="order-delivery-method-error"
            />
          </section>

          <section className="order-create-section" aria-labelledby="delivery-info-title">
            <h2 id="delivery-info-title">Teslimat Bilgileri</h2>
            {!deliveryMethod ? (
              <p className="order-create-section__note">
                Teslimat bilgilerini girmek için önce teslimat yöntemini seçin.
              </p>
            ) : (
              <div className="order-create-fields order-create-fields--two-columns">
                {deliveryMethod === 'Teslimat' ? (
                  <div className="order-create-field order-create-field--wide">
                    <label htmlFor="order-delivery-address">Teslimat adresi</label>
                    <textarea
                      aria-describedby={
                        errors.address ? 'order-delivery-address-error' : undefined
                      }
                      aria-invalid={errors.address ? true : undefined}
                      autoComplete="street-address"
                      id="order-delivery-address"
                      required
                      rows={3}
                      {...register('address')}
                    />
                    <FieldMessage
                      error={errors.address}
                      id="order-delivery-address-error"
                    />
                  </div>
                ) : null}

                <div className="order-create-field order-create-field--wide">
                  <label htmlFor="order-delivery-date">Tarih</label>
                  <input
                    aria-describedby={
                      errors.deliveryDate ? 'order-delivery-date-error' : undefined
                    }
                    aria-invalid={errors.deliveryDate ? true : undefined}
                    id="order-delivery-date"
                    min={todayInputValue}
                    required
                    type="date"
                    {...register('deliveryDate')}
                  />
                  <FieldMessage
                    error={errors.deliveryDate}
                    id="order-delivery-date-error"
                  />
                </div>

                <fieldset className="order-create-time-range order-create-field--wide">
                  <legend>Saat aralığı</legend>
                  <div>
                    <div className="order-create-field">
                      <label htmlFor="order-delivery-start-time">Başlangıç</label>
                      <input
                        aria-describedby={
                          errors.deliveryStartTime
                            ? 'order-delivery-start-time-error'
                            : undefined
                        }
                        aria-invalid={errors.deliveryStartTime ? true : undefined}
                        id="order-delivery-start-time"
                        required
                        type="time"
                        {...register('deliveryStartTime')}
                      />
                      <FieldMessage
                        error={errors.deliveryStartTime}
                        id="order-delivery-start-time-error"
                      />
                    </div>

                    <div className="order-create-field">
                      <label htmlFor="order-delivery-end-time">Bitiş</label>
                      <input
                        aria-describedby={
                          errors.deliveryEndTime
                            ? 'order-delivery-end-time-error'
                            : undefined
                        }
                        aria-invalid={errors.deliveryEndTime ? true : undefined}
                        id="order-delivery-end-time"
                        required
                        type="time"
                        {...register('deliveryEndTime')}
                      />
                      <FieldMessage
                        error={errors.deliveryEndTime}
                        id="order-delivery-end-time-error"
                      />
                    </div>
                  </div>
                </fieldset>
              </div>
            )}
          </section>
        </div>

        <aside className="order-create-summary" aria-labelledby="order-summary-title">
          <h2 id="order-summary-title">Sipariş Özeti</h2>
          <dl>
            <div>
              <dt>Ara Toplam</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div>
              <dt>Teslimat</dt>
              <dd>{formatCurrency(deliveryFee)}</dd>
            </div>
            <div className="order-create-summary__total">
              <dt>Genel Toplam</dt>
              <dd>{formatCurrency(grandTotal)}</dd>
            </div>
          </dl>

          <p
            className={
              minimumOrderMet
                ? 'order-create-summary__minimum'
                : 'order-create-summary__minimum order-create-summary__minimum--unmet'
            }
          >
            Minimum ürün ara toplamı:{' '}
            {formatCurrency(orderCreateDemoSettings.minimumOrderAmount)}
          </p>
          <p className="order-create-summary__status">
            Başlangıç sipariş durumu: <strong>Yeni</strong>
          </p>

          <button disabled={!settingsReady || isSubmitting} type="submit">
            {isSubmitting ? 'Sipariş Oluşturuluyor…' : 'Sipariş Oluştur'}
          </button>
          <p className="order-create-summary__note">
            Bu demo form doğrulama yapar; sipariş, müşteri ve stok verileri kalıcı olarak
            değiştirilmez.
          </p>
          {submitValidated ? (
            <p className="order-create-summary__success" role="status">
              Form doğrulandı. Gerçek sipariş kaydı ve Sipariş Detayı yönlendirmesi backend
              entegrasyonunda tamamlanacaktır.
            </p>
          ) : null}
        </aside>
      </form>
    </div>
  )
}

export default OrderCreatePage
