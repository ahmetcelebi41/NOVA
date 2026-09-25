import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  useForm,
  type FieldError,
  type FieldErrors,
  type Resolver,
} from 'react-hook-form'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import type {
  CreateProductInput,
  ProductDetail,
  ProductDetailResponse,
  UpdateProductInput,
} from '../contracts/products'
import { ApiError, apiJson } from '../lib/api'
import './ProductEditorPage.css'
import { productCategoryOptions } from './products/productDemoData'
import {
  createProductFormSchema,
  type ProductFormSchema,
  type ProductFormValues,
} from './products/productFormSchema'

type ProductEditorPageProps = {
  mode: 'create' | 'edit'
}

type FieldMessageProps = {
  error?: FieldError
  id: string
}

function createZodResolver(schema: ProductFormSchema): Resolver<ProductFormValues> {
  return async (values) => {
    const result = schema.safeParse(values)

    if (result.success) {
      return { errors: {}, values: result.data }
    }

    const fieldErrors: Record<string, FieldError> = {}

    result.error.issues.forEach((issue) => {
      const fieldName = issue.path[0]

      if (typeof fieldName === 'string' && !fieldErrors[fieldName]) {
        fieldErrors[fieldName] = {
          message: issue.message,
          type: issue.code,
        }
      }
    })

    return {
      errors: fieldErrors as FieldErrors<ProductFormValues>,
      values: {},
    }
  }
}

function FieldMessage({ error, id }: FieldMessageProps) {
  if (!error?.message) {
    return null
  }

  return (
    <p className="product-editor-field__error" id={id} role="alert">
      {error.message}
    </p>
  )
}

function getDefaultValues(product?: ProductDetail): ProductFormValues {
  if (!product) {
    return {
      category: '',
      description: '',
      lowStockThreshold: '',
      name: '',
      price: '',
      publication: 'Aktif',
      sku: '',
      stock: '',
    }
  }

  const category = productCategoryOptions.find(
    (option) => option.value === product.category || option.label === product.category,
  )?.value

  return {
    category: category ?? '',
    description: product.description ?? '',
    lowStockThreshold: String(product.lowStockThreshold),
    name: product.name,
    price: String(product.priceMinor / 100),
    publication: product.publicationStatus === 'active' ? 'Aktif' : 'Pasif',
    sku: product.sku ?? '',
    stock: String(product.stockQuantity),
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () => reject(reader.error))
    reader.readAsDataURL(file)
  })
}

function ProductEditorForm({
  listPath,
  mode,
  product,
}: {
  listPath: string
  mode: ProductEditorPageProps['mode']
  product?: ProductDetail
}) {
  const isCreateMode = mode === 'create'
  const navigate = useNavigate()
  const location = useLocation()
  const schema = useMemo(() => createProductFormSchema(), [])
  const resolver = useMemo(() => createZodResolver(schema), [schema])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(product?.imageUrl ?? null)
  const [persistedImageUrl, setPersistedImageUrl] = useState<string | null>(product?.imageUrl ?? null)
  const [imageFileName, setImageFileName] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageDirty, setImageDirty] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSucceeded, setSubmitSucceeded] = useState(false)
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    setFocus,
  } = useForm<ProductFormValues>({
    defaultValues: getDefaultValues(product),
    resolver,
    shouldFocusError: true,
  })

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    },
    [],
  )

  const releasePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    releasePreview()

    if (file) {
      const previewUrl = URL.createObjectURL(file)
      previewUrlRef.current = previewUrl
      setImagePreviewUrl(previewUrl)
      setImageFileName(file.name)
      setImageFile(file)
    } else {
      setImagePreviewUrl(product?.imageUrl ?? null)
      setImageFileName('')
      setImageFile(null)
    }

    setImageDirty(true)
    setSubmitError('')
    setSubmitSucceeded(false)
  }

  const removeImage = () => {
    releasePreview()

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setImagePreviewUrl(null)
    setImageFileName('')
    setImageFile(null)
    setImageDirty(true)
    setSubmitError('')
    setSubmitSucceeded(false)
  }

  const hasUnsavedChanges = isDirty || imageDirty

  const submit = async (values: ProductFormValues) => {
    setSubmitError('')
    setSubmitSucceeded(false)

    let imageUrl = persistedImageUrl

    if (imageDirty) {
      try {
        imageUrl = imageFile ? await readFileAsDataUrl(imageFile) : null
      } catch {
        setSubmitError('Ürün görseli okunamadı. Görseli yeniden seçip tekrar deneyin.')
        return
      }
    }

    const commonInput = {
      category: values.category,
      description: values.description || null,
      imageUrl,
      lowStockThreshold: Number(values.lowStockThreshold),
      name: values.name,
      priceMinor: Math.round(Number(values.price) * 100),
      publicationStatus: values.publication === 'Aktif' ? 'active' as const : 'inactive' as const,
      sku: values.sku || null,
    }

    try {
      const response = isCreateMode
        ? await apiJson<ProductDetailResponse>('/api/products', {
            body: JSON.stringify({
              ...commonInput,
              stockQuantity: Number(values.stock),
            } satisfies CreateProductInput),
            method: 'POST',
          })
        : await apiJson<ProductDetailResponse>(`/api/products/${product?.id}`, {
            body: JSON.stringify(commonInput satisfies UpdateProductInput),
            method: 'PATCH',
          })

      if (isCreateMode) {
        navigate(`/urunler/${response.item.id}${location.search}`, { replace: true })
        return
      }

      reset(getDefaultValues(response.item))
      setImagePreviewUrl(response.item.imageUrl)
      setPersistedImageUrl(response.item.imageUrl)
      setImageFile(null)
      setImageFileName('')
      setImageDirty(false)
      setSubmitSucceeded(true)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'SKU_CONFLICT') {
        setError('sku', {
          message: 'Bu SKU başka bir üründe kullanılıyor.',
          type: 'server',
        })
        setFocus('sku')
        return
      }

      if (error instanceof ApiError && error.code === 'PRODUCT_NOT_FOUND') {
        setSubmitError('Ürün artık mevcut değil. Listeye dönüp yeniden deneyin.')
      } else if (error instanceof ApiError && error.code === 'INVALID_PRODUCT_INPUT') {
        setSubmitError('Ürün bilgileri kaydedilemedi. Alanları kontrol edip yeniden deneyin.')
      } else {
        setSubmitError('Ürün kaydedilemedi. Bağlantıyı kontrol edip yeniden deneyin.')
      }
    }
  }

  return (
    <div className="product-editor-page">
      <Link className="product-editor-page__back" to={listPath}>
        Ürünlere dön
      </Link>

      <header className="product-editor-page__header">
        <h1 id="page-title">{isCreateMode ? 'Yeni Ürün' : 'Ürün Düzenle'}</h1>
        <p>
          {isCreateMode
            ? 'Katalog için yeni ürün bilgilerini hazırlayın.'
            : `${product?.name} ürününün katalog bilgilerini düzenleyin.`}
        </p>
      </header>

      <form
        className="product-editor-form"
        noValidate
        onChange={() => {
          setSubmitError('')
          setSubmitSucceeded(false)
        }}
        onSubmit={handleSubmit(submit)}
      >
        <div className="product-editor-form__main-column">
          <section className="product-editor-section" aria-labelledby="basic-info-title">
            <h2 id="basic-info-title">Temel Bilgiler</h2>
            <div className="product-editor-fields product-editor-fields--two-columns">
              <div className="product-editor-field product-editor-field--wide">
                <label htmlFor="product-name">Ürün adı</label>
                <input
                  aria-describedby={errors.name ? 'product-name-error' : undefined}
                  aria-invalid={errors.name ? true : undefined}
                  id="product-name"
                  required
                  type="text"
                  {...register('name')}
                />
                <FieldMessage error={errors.name} id="product-name-error" />
              </div>

              <div className="product-editor-field">
                <label htmlFor="product-sku">SKU (opsiyonel)</label>
                <input
                  aria-describedby={errors.sku ? 'product-sku-error' : undefined}
                  aria-invalid={errors.sku ? true : undefined}
                  id="product-sku"
                  type="text"
                  {...register('sku')}
                />
                <FieldMessage error={errors.sku} id="product-sku-error" />
              </div>

              <div className="product-editor-field">
                <label htmlFor="product-category">Kategori</label>
                <select
                  aria-describedby={errors.category ? 'product-category-error' : undefined}
                  aria-invalid={errors.category ? true : undefined}
                  id="product-category"
                  required
                  {...register('category')}
                >
                  <option value="">Kategori seçin</option>
                  {productCategoryOptions.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <FieldMessage error={errors.category} id="product-category-error" />
              </div>

              <div className="product-editor-field product-editor-field--wide">
                <label htmlFor="product-description">Açıklama (opsiyonel)</label>
                <textarea id="product-description" rows={4} {...register('description')} />
              </div>
            </div>
          </section>

          <section className="product-editor-section" aria-labelledby="pricing-title">
            <h2 id="pricing-title">Fiyatlandırma</h2>
            <div className="product-editor-field product-editor-field--compact">
              <label htmlFor="product-price">Satış fiyatı (TL)</label>
              <input
                aria-describedby={errors.price ? 'product-price-error' : undefined}
                aria-invalid={errors.price ? true : undefined}
                id="product-price"
                inputMode="decimal"
                min="0"
                required
                step="0.01"
                type="number"
                {...register('price')}
              />
              <FieldMessage error={errors.price} id="product-price-error" />
            </div>
          </section>

          <section className="product-editor-section" aria-labelledby="stock-title">
            <h2 id="stock-title">Stok Yönetimi</h2>
            <div className="product-editor-fields product-editor-fields--two-columns">
              <div className="product-editor-field">
                <label htmlFor="product-stock">Stok adedi</label>
                <input
                  aria-describedby={errors.stock ? 'product-stock-error' : undefined}
                  aria-invalid={errors.stock ? true : undefined}
                  id="product-stock"
                  inputMode="numeric"
                  min="0"
                  readOnly={!isCreateMode}
                  required
                  step="1"
                  type="number"
                  {...register('stock')}
                />
                <FieldMessage error={errors.stock} id="product-stock-error" />
              </div>

              <div className="product-editor-field">
                <label htmlFor="product-low-stock-threshold">Düşük stok eşiği</label>
                <input
                  aria-describedby={
                    errors.lowStockThreshold ? 'product-low-stock-threshold-error' : undefined
                  }
                  aria-invalid={errors.lowStockThreshold ? true : undefined}
                  id="product-low-stock-threshold"
                  inputMode="numeric"
                  min="0"
                  required
                  step="1"
                  type="number"
                  {...register('lowStockThreshold')}
                />
                <FieldMessage
                  error={errors.lowStockThreshold}
                  id="product-low-stock-threshold-error"
                />
              </div>
            </div>
            <p className="product-editor-section__note">
              {isCreateMode
                ? 'Başlangıç stoğunu burada girin. Sonraki stok değişiklikleri Stok modülünden yönetilir.'
                : 'Mevcut stok salt okunurdur. Operasyonel stok değişiklikleri Stok modülünden yapılır.'}
            </p>
            {!isCreateMode && product ? (
              <Link className="product-editor-section__stock-link" to={`/stok?q=${encodeURIComponent(product.sku ?? product.name)}`}>
                Stok modülünde aç
              </Link>
            ) : null}
          </section>
        </div>

        <div className="product-editor-form__side-column">
          <section className="product-editor-section" aria-labelledby="image-title">
            <h2 id="image-title">Ürün Görseli</h2>
            <div className="product-editor-field">
              <label htmlFor="product-image">Ana ürün görseli (opsiyonel)</label>
              <input
                accept="image/jpeg,image/png,image/webp"
                id="product-image"
                onChange={handleImageChange}
                ref={fileInputRef}
                type="file"
              />
            </div>

            {imagePreviewUrl ? (
              <div className="product-editor-image-preview">
                <img
                  alt={imageFileName ? `${imageFileName} yerel önizlemesi` : `${product?.name ?? 'Ürün'} görseli`}
                  src={imagePreviewUrl}
                />
                {imageFileName ? <p>{imageFileName}</p> : null}
                <button onClick={removeImage} type="button">
                  Görseli kaldır
                </button>
              </div>
            ) : (
              <p className="product-editor-section__note">
                Tek bir JPEG, PNG veya WebP görseli seçebilir ve ürünle birlikte kaydedebilirsiniz.
              </p>
            )}
          </section>

          <section className="product-editor-section" aria-labelledby="publication-title">
            <h2 id="publication-title">Yayın Durumu</h2>
            <fieldset className="product-editor-publication">
              <legend className="product-editor-visually-hidden">Yayın durumu seçimi</legend>
              <label>
                <input type="radio" value="Aktif" {...register('publication')} />
                <span>
                  <strong>Aktif</strong>
                  <small>Ürün katalogda kullanılabilir.</small>
                </span>
              </label>
              <label>
                <input type="radio" value="Pasif" {...register('publication')} />
                <span>
                  <strong>Pasif</strong>
                  <small>Ürün katalog kayıtlarında korunur.</small>
                </span>
              </label>
            </fieldset>
          </section>

          <section className="product-editor-section" aria-labelledby="actions-title">
            <h2 id="actions-title">Aksiyonlar</h2>
            <button
              className="product-editor-form__submit"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <p className="product-editor-section__note">
              Ürün bilgileri ve yayın durumu kataloğa kaydedilir.
            </p>
            {hasUnsavedChanges ? (
              <p className="product-editor-form__dirty-note">
                Kaydedilmemiş değişiklikleriniz var.
              </p>
            ) : null}
            {submitSucceeded ? (
              <p className="product-editor-form__success" role="status">
                Ürün bilgileri kaydedildi.
              </p>
            ) : null}
            {submitError ? (
              <p className="product-editor-field__error" role="alert">
                {submitError}
              </p>
            ) : null}
          </section>
        </div>
      </form>
    </div>
  )
}

function ProductEditorPage({ mode }: ProductEditorPageProps) {
  const { id } = useParams()
  const location = useLocation()
  const [loadState, setLoadState] = useState<{
    error: boolean
    notFound: boolean
    product: ProductDetail | undefined
    requestKey: string
  }>({ error: false, notFound: false, product: undefined, requestKey: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const listPath = `/urunler${location.search}`
  const hasValidId = Boolean(id && /^\d+$/.test(id) && Number(id) > 0)
  const requestKey = mode === 'edit' && hasValidId ? `${id}|${reloadKey}` : ''
  const isLoading = mode === 'edit' && hasValidId && loadState.requestKey !== requestKey
  const product = isLoading ? undefined : loadState.product
  const loadError = !isLoading && loadState.requestKey === requestKey && loadState.error
  const notFound = mode === 'edit' && (!hasValidId || (
    loadState.requestKey === requestKey && loadState.notFound
  ))

  useEffect(() => {
    if (mode !== 'edit' || !hasValidId) {
      return
    }

    const controller = new AbortController()

    void apiJson<ProductDetailResponse>(`/api/products/${id}`, { signal: controller.signal })
      .then((response) => setLoadState({
        error: false,
        notFound: false,
        product: response.item,
        requestKey,
      }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setLoadState({
          error: !(error instanceof ApiError && error.code === 'PRODUCT_NOT_FOUND'),
          notFound: error instanceof ApiError && error.code === 'PRODUCT_NOT_FOUND',
          product: undefined,
          requestKey,
        })
      })

    return () => controller.abort()
  }, [hasValidId, id, mode, requestKey])

  if (mode === 'edit' && isLoading) {
    return (
      <section className="product-editor-not-found" aria-labelledby="page-title" role="status">
        <h1 id="page-title">Ürün yükleniyor</h1>
        <p>Ürün bilgileri hazırlanıyor…</p>
      </section>
    )
  }

  if (mode === 'edit' && loadError) {
    return (
      <section className="product-editor-not-found" aria-labelledby="page-title" role="alert">
        <h1 id="page-title">Ürün yüklenemedi</h1>
        <p>Bağlantıyı kontrol edip yeniden deneyin.</p>
        <button onClick={() => setReloadKey((value) => value + 1)} type="button">
          Yeniden Dene
        </button>
        <Link to={listPath}>Ürünlere dön</Link>
      </section>
    )
  }

  if (mode === 'edit' && (notFound || !product)) {
    return (
      <section className="product-editor-not-found" aria-labelledby="page-title">
        <h1 id="page-title">Ürün bulunamadı</h1>
        <p>Aradığınız ürün kaydı mevcut değil.</p>
        <Link to={listPath}>Ürünlere dön</Link>
      </section>
    )
  }

  return (
    <ProductEditorForm
      key={`${mode}-${product?.id ?? 'new'}`}
      listPath={listPath}
      mode={mode}
      product={product}
    />
  )
}

export default ProductEditorPage
