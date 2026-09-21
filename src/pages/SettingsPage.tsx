import { useMemo, useState } from 'react'
import {
  useForm,
  useWatch,
  type FieldError,
  type FieldErrors,
  type Resolver,
} from 'react-hook-form'
import './SettingsPage.css'
import {
  settingsFormSchema,
  type SettingsFormValues,
} from './settings/settingsFormSchema'
import { settingsDemoValues } from './settings/settingsDemoData'

type FieldMessageProps = {
  error?: FieldError
  id: string
}

function createZodResolver(): Resolver<SettingsFormValues> {
  return async (values) => {
    const result = settingsFormSchema.safeParse(values)

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
      errors: fieldErrors as FieldErrors<SettingsFormValues>,
      values: {},
    }
  }
}

function FieldMessage({ error, id }: FieldMessageProps) {
  if (!error?.message) {
    return null
  }

  return (
    <p className="settings-field__error" id={id} role="alert">
      {error.message}
    </p>
  )
}

function SettingsPage() {
  const resolver = useMemo(() => createZodResolver(), [])
  const [submitValidated, setSubmitValidated] = useState(false)
  const {
    formState: { errors, isSubmitting },
    control,
    handleSubmit,
    register,
  } = useForm<SettingsFormValues>({
    defaultValues: settingsDemoValues,
    resolver,
    shouldFocusError: true,
  })
  const deliveryEnabled = useWatch({ control, name: 'deliveryEnabled' })
  const pickupEnabled = useWatch({ control, name: 'pickupEnabled' })
  const deliveryErrorId = errors.deliveryEnabled
    ? 'settings-delivery-method-error'
    : undefined

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h1 id="page-title">Ayarlar</h1>
        <p>İşletme bilgilerinizi ve sipariş teslimat seçeneklerinizi yönetin.</p>
      </header>

      <form
        className="settings-form"
        noValidate
        onChange={() => setSubmitValidated(false)}
        onSubmit={handleSubmit(
          () => setSubmitValidated(true),
          () => setSubmitValidated(false),
        )}
      >
        <section className="settings-section" aria-labelledby="business-settings-title">
          <h2 id="business-settings-title">İşletme Bilgileri</h2>
          <div className="settings-fields settings-fields--two-columns">
            <div className="settings-field">
              <label htmlFor="settings-business-name">İşletme adı</label>
              <input
                aria-describedby={
                  errors.businessName ? 'settings-business-name-error' : undefined
                }
                aria-invalid={errors.businessName ? true : undefined}
                id="settings-business-name"
                required
                type="text"
                {...register('businessName')}
              />
              <FieldMessage
                error={errors.businessName}
                id="settings-business-name-error"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="settings-email">E-posta</label>
              <input
                aria-describedby={errors.email ? 'settings-email-error' : undefined}
                aria-invalid={errors.email ? true : undefined}
                autoComplete="email"
                id="settings-email"
                required
                type="email"
                {...register('email')}
              />
              <FieldMessage error={errors.email} id="settings-email-error" />
            </div>

            <div className="settings-field">
              <label htmlFor="settings-phone">Telefon (opsiyonel)</label>
              <input
                autoComplete="tel"
                id="settings-phone"
                type="tel"
                {...register('phone')}
              />
            </div>

            <div className="settings-field settings-field--wide">
              <label htmlFor="settings-address">Adres (opsiyonel)</label>
              <textarea
                autoComplete="street-address"
                id="settings-address"
                rows={3}
                {...register('address')}
              />
            </div>
          </div>
        </section>

        <section className="settings-section" aria-labelledby="order-settings-title">
          <h2 id="order-settings-title">Sipariş ve Teslimat Ayarları</h2>
          <div className="settings-fields settings-fields--two-columns">
            <div className="settings-field">
              <label htmlFor="settings-delivery-fee">Teslimat ücreti (TL)</label>
              <input
                aria-describedby={
                  errors.deliveryFee ? 'settings-delivery-fee-error' : undefined
                }
                aria-invalid={errors.deliveryFee ? true : undefined}
                id="settings-delivery-fee"
                inputMode="decimal"
                min="0"
                step="0.01"
                type="number"
                {...register('deliveryFee')}
              />
              <FieldMessage
                error={errors.deliveryFee}
                id="settings-delivery-fee-error"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="settings-minimum-order">Minimum sipariş tutarı (TL)</label>
              <input
                aria-describedby={
                  errors.minimumOrderAmount ? 'settings-minimum-order-error' : undefined
                }
                aria-invalid={errors.minimumOrderAmount ? true : undefined}
                id="settings-minimum-order"
                inputMode="decimal"
                min="0"
                step="0.01"
                type="number"
                {...register('minimumOrderAmount')}
              />
              <FieldMessage
                error={errors.minimumOrderAmount}
                id="settings-minimum-order-error"
              />
            </div>
          </div>

          <fieldset className="settings-delivery-methods">
            <legend>Teslimat yöntemleri</legend>
            <div className="settings-delivery-methods__options">
              <label className="settings-toggle">
                <input
                  aria-describedby={deliveryErrorId}
                  aria-invalid={errors.deliveryEnabled ? true : undefined}
                  role="switch"
                  type="checkbox"
                  {...register('deliveryEnabled')}
                />
                <span className="settings-toggle__content">
                  <strong>Teslimat</strong>
                  <small>{deliveryEnabled ? 'Etkin' : 'Devre dışı'}</small>
                </span>
              </label>

              <label className="settings-toggle">
                <input
                  aria-describedby={deliveryErrorId}
                  aria-invalid={errors.deliveryEnabled ? true : undefined}
                  role="switch"
                  type="checkbox"
                  {...register('pickupEnabled')}
                />
                <span className="settings-toggle__content">
                  <strong>Mağazadan Teslim Alma</strong>
                  <small>{pickupEnabled ? 'Etkin' : 'Devre dışı'}</small>
                </span>
              </label>
            </div>
            <FieldMessage
              error={errors.deliveryEnabled}
              id="settings-delivery-method-error"
            />
          </fieldset>
        </section>

        <section className="settings-section settings-actions" aria-labelledby="save-title">
          <h2 id="save-title">Kaydet</h2>
          <button disabled={isSubmitting} type="submit">
            Kaydet
          </button>
          <p className="settings-actions__note">
            Bu demo form yalnız doğrulama yapar; bilgiler kalıcı olarak kaydedilmez.
          </p>
          {submitValidated ? (
            <p className="settings-actions__success" role="status">
              Form doğrulandı. Bu demo ekranda ayarlar kalıcı olarak kaydedilmedi.
            </p>
          ) : null}
        </section>
      </form>
    </div>
  )
}

export default SettingsPage
