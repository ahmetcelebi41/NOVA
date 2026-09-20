import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  useForm,
  type FieldError,
  type FieldErrors,
  type Resolver,
} from 'react-hook-form'
import { Link, useLocation, useParams } from 'react-router-dom'
import './ProductEditorPage.css'
import {
  productCategoryOptions,
  productDemoData,
  type ProductDemoRecord,
} from './products/productDemoData'
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

function getDefaultValues(product?: ProductDemoRecord): ProductFormValues {
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
    (option) => option.label === product.category,
  )?.value

  return {
    category: category ?? '',
    description: product.description ?? '',
    lowStockThreshold: String(product.lowStockThreshold),
    name: product.name,
    price: String(product.price),
    publication: product.publication,
    sku: product.sku,
    stock: String(product.stock),
  }
}

function ProductEditorForm({
  listPath,
  mode,
  product,
}: {
  listPath: string
  mode: ProductEditorPageProps['mode']
  product?: ProductDemoRecord
}) {
  const isCreateMode = mode === 'create'
  const schema = useMemo(() => createProductFormSchema(product?.id), [product?.id])
  const resolver = useMemo(() => createZodResolver(schema), [schema])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageFileName, setImageFileName] = useState('')
  const [imageDirty, setImageDirty] = useState(false)
  const [submitValidated, setSubmitValidated] = useState(false)
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
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
    } else {
      setImagePreviewUrl(null)
      setImageFileName('')
    }

    setImageDirty(true)
    setSubmitValidated(false)
  }

  const removeImage = () => {
    releasePreview()

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setImagePreviewUrl(null)
    setImageFileName('')
    setImageDirty(true)
    setSubmitValidated(false)
  }

  const hasUnsavedChanges = isDirty || imageDirty

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
        onChange={() => setSubmitValidated(false)}
        onSubmit={handleSubmit(
          () => setSubmitValidated(true),
          () => setSubmitValidated(false),
        )}
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
              Sonraki stok değişiklikleri Stok modülünden yönetilir.
            </p>
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
                <img alt={`${imageFileName} yerel önizlemesi`} src={imagePreviewUrl} />
                <p>{imageFileName}</p>
                <button onClick={removeImage} type="button">
                  Görseli kaldır
                </button>
              </div>
            ) : (
              <p className="product-editor-section__note">
                Tek bir JPEG, PNG veya WebP görseli seçebilirsiniz. Görsel yalnız bu ekranda
                önizlenir.
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
              Kaydet
            </button>
            <p className="product-editor-section__note">
              Bu demo form doğrulama yapar; bilgiler kalıcı olarak kaydedilmez.
            </p>
            {hasUnsavedChanges ? (
              <p className="product-editor-form__dirty-note">
                Kaydedilmemiş değişiklikleriniz var.
              </p>
            ) : null}
            {submitValidated ? (
              <p className="product-editor-form__success" role="status">
                Form doğrulandı. Bu demo ekranda kalıcı kayıt oluşturulmadı.
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
  const product = mode === 'edit' ? productDemoData.find((item) => item.id === id) : undefined
  const listPath = `/urunler${location.search}`

  if (mode === 'edit' && !product) {
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
