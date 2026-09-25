import { useEffect, useMemo, useState } from 'react'
import {
  useForm,
  useWatch,
  type FieldError,
  type FieldErrors,
  type Resolver,
} from 'react-hook-form'
import type { SettingsResponse, UpdateSettingsInput } from '../contracts/settings'
import { ApiError, apiJson } from '../lib/api'
import './SettingsPage.css'
import { settingsFormSchema, type SettingsFormValues } from './settings/settingsFormSchema'

const configureDefaults: SettingsFormValues = {
  address: '',
  businessName: '',
  deliveryEnabled: true,
  deliveryFee: '0',
  email: '',
  minimumOrderAmount: '0',
  phone: '',
  pickupEnabled: true,
}

type FieldMessageProps = { error?: FieldError; id: string }

function createZodResolver(): Resolver<SettingsFormValues> {
  return async (values) => {
    const result = settingsFormSchema.safeParse(values)
    if (result.success) return { errors: {}, values: result.data }

    const fieldErrors: Record<string, FieldError> = {}
    result.error.issues.forEach((issue) => {
      const fieldName = issue.path[0]
      if (typeof fieldName === 'string' && !fieldErrors[fieldName]) {
        fieldErrors[fieldName] = { message: issue.message, type: issue.code }
      }
    })
    return { errors: fieldErrors as FieldErrors<SettingsFormValues>, values: {} }
  }
}

function FieldMessage({ error, id }: FieldMessageProps) {
  return error?.message ? <p className="settings-field__error" id={id} role="alert">{error.message}</p> : null
}

function toFormValues(settings: SettingsResponse): SettingsFormValues {
  return {
    address: settings.address ?? '',
    businessName: settings.businessName,
    deliveryEnabled: settings.deliveryEnabled,
    deliveryFee: String(settings.deliveryFeeMinor / 100),
    email: settings.email,
    minimumOrderAmount: String(settings.minimumOrderMinor / 100),
    phone: settings.phone ?? '',
    pickupEnabled: settings.pickupEnabled,
  }
}

function SettingsPage() {
  const resolver = useMemo(() => createZodResolver(), [])
  const [reloadKey, setReloadKey] = useState(0)
  const [loadState, setLoadState] = useState<{ key: number; configured: boolean; error: boolean }>({ key: -1, configured: false, error: false })
  const [saveFeedback, setSaveFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)
  const {
    formState: { errors, isSubmitting },
    control,
    handleSubmit,
    register,
    reset,
  } = useForm<SettingsFormValues>({ defaultValues: configureDefaults, resolver, shouldFocusError: true })
  const deliveryEnabled = useWatch({ control, name: 'deliveryEnabled' })
  const pickupEnabled = useWatch({ control, name: 'pickupEnabled' })
  const isLoading = loadState.key !== reloadKey
  const deliveryErrorId = errors.deliveryEnabled ? 'settings-delivery-method-error' : undefined

  useEffect(() => {
    const controller = new AbortController()
    apiJson<SettingsResponse>('/api/settings', { signal: controller.signal })
      .then((settings) => {
        reset(toFormValues(settings))
        setLoadState({ key: reloadKey, configured: true, error: false })
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return
        if (caught instanceof ApiError && caught.status === 404 && caught.code === 'SETTINGS_NOT_CONFIGURED') {
          reset(configureDefaults)
          setLoadState({ key: reloadKey, configured: false, error: false })
          return
        }
        setLoadState({ key: reloadKey, configured: false, error: true })
      })
    return () => controller.abort()
  }, [reloadKey, reset])

  const saveSettings = async (values: SettingsFormValues) => {
    const body: UpdateSettingsInput = {
      address: values.address || null,
      businessName: values.businessName,
      deliveryEnabled: values.deliveryEnabled,
      deliveryFeeMinor: Math.round(Number(values.deliveryFee) * 100),
      email: values.email,
      minimumOrderMinor: Math.round(Number(values.minimumOrderAmount) * 100),
      phone: values.phone || null,
      pickupEnabled: values.pickupEnabled,
    }
    setSaveFeedback(null)
    try {
      const saved = await apiJson<SettingsResponse>('/api/settings', { method: 'PUT', body: JSON.stringify(body) })
      reset(toFormValues(saved))
      setLoadState({ key: reloadKey, configured: true, error: false })
      setSaveFeedback({ kind: 'success', message: 'Ayarlar kaydedildi.' })
    } catch {
      setSaveFeedback({ kind: 'error', message: 'Ayarlar kaydedilemedi. Lütfen yeniden deneyin.' })
    }
  }

  return <div className="settings-page">
    <header className="settings-page__header"><h1 id="page-title">Ayarlar</h1><p>İşletme bilgilerinizi ve sipariş teslimat seçeneklerinizi yönetin.</p></header>
    {isLoading ? <section className="settings-section settings-state" role="status"><h2>Ayarlar yükleniyor</h2><p>Lütfen bekleyin.</p></section> : loadState.error ? <section className="settings-section settings-state" role="alert"><h2>Ayarlar yüklenemedi</h2><p>Bağlantıyı kontrol edip yeniden deneyin.</p><button onClick={() => setReloadKey((key) => key + 1)} type="button">Yeniden Dene</button></section> : <form className="settings-form" noValidate onChange={() => setSaveFeedback(null)} onSubmit={handleSubmit(saveSettings)}>
      <section className="settings-section" aria-labelledby="business-settings-title"><h2 id="business-settings-title">İşletme Bilgileri</h2><div className="settings-fields settings-fields--two-columns">
        <div className="settings-field"><label htmlFor="settings-business-name">İşletme adı</label><input aria-describedby={errors.businessName ? 'settings-business-name-error' : undefined} aria-invalid={Boolean(errors.businessName)} id="settings-business-name" required type="text" {...register('businessName')} /><FieldMessage error={errors.businessName} id="settings-business-name-error" /></div>
        <div className="settings-field"><label htmlFor="settings-email">E-posta</label><input aria-describedby={errors.email ? 'settings-email-error' : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" id="settings-email" required type="email" {...register('email')} /><FieldMessage error={errors.email} id="settings-email-error" /></div>
        <div className="settings-field"><label htmlFor="settings-phone">Telefon (opsiyonel)</label><input autoComplete="tel" id="settings-phone" type="tel" {...register('phone')} /></div>
        <div className="settings-field settings-field--wide"><label htmlFor="settings-address">Adres (opsiyonel)</label><textarea autoComplete="street-address" id="settings-address" rows={3} {...register('address')} /></div>
      </div></section>
      <section className="settings-section" aria-labelledby="order-settings-title"><h2 id="order-settings-title">Sipariş ve Teslimat Ayarları</h2><div className="settings-fields settings-fields--two-columns">
        <div className="settings-field"><label htmlFor="settings-delivery-fee">Teslimat ücreti (TL)</label><input aria-describedby={errors.deliveryFee ? 'settings-delivery-fee-error' : undefined} aria-invalid={Boolean(errors.deliveryFee)} id="settings-delivery-fee" inputMode="decimal" min="0" step="0.01" type="number" {...register('deliveryFee')} /><FieldMessage error={errors.deliveryFee} id="settings-delivery-fee-error" /></div>
        <div className="settings-field"><label htmlFor="settings-minimum-order">Minimum sipariş tutarı (TL)</label><input aria-describedby={errors.minimumOrderAmount ? 'settings-minimum-order-error' : undefined} aria-invalid={Boolean(errors.minimumOrderAmount)} id="settings-minimum-order" inputMode="decimal" min="0" step="0.01" type="number" {...register('minimumOrderAmount')} /><FieldMessage error={errors.minimumOrderAmount} id="settings-minimum-order-error" /></div>
      </div><fieldset className="settings-delivery-methods"><legend>Teslimat yöntemleri</legend><div className="settings-delivery-methods__options">
        <label className="settings-toggle"><input aria-describedby={deliveryErrorId} aria-invalid={Boolean(errors.deliveryEnabled)} role="switch" type="checkbox" {...register('deliveryEnabled')} /><span className="settings-toggle__content"><strong>Teslimat</strong><small>{deliveryEnabled ? 'Etkin' : 'Devre dışı'}</small></span></label>
        <label className="settings-toggle"><input aria-describedby={deliveryErrorId} aria-invalid={Boolean(errors.deliveryEnabled)} role="switch" type="checkbox" {...register('pickupEnabled')} /><span className="settings-toggle__content"><strong>Mağazadan Teslim Alma</strong><small>{pickupEnabled ? 'Etkin' : 'Devre dışı'}</small></span></label>
      </div><FieldMessage error={errors.deliveryEnabled} id="settings-delivery-method-error" /></fieldset></section>
      <section className="settings-section settings-actions" aria-labelledby="save-title"><h2 id="save-title">Kaydet</h2><button disabled={isSubmitting} type="submit">{isSubmitting ? 'Kaydediliyor…' : 'Kaydet'}</button><p className="settings-actions__note">{loadState.configured ? 'Değişiklikler sipariş akışına uygulanır.' : 'İşletme ayarlarını ilk kez yapılandırıyorsunuz.'}</p>{saveFeedback ? <p className={`settings-actions__${saveFeedback.kind}`} role={saveFeedback.kind === 'error' ? 'alert' : 'status'}>{saveFeedback.message}</p> : null}</section>
    </form>}
  </div>
}

export default SettingsPage
