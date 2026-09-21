import { z } from 'zod'

function nonNegativeNumberString(fieldName: string) {
  return z
    .string()
    .trim()
    .min(1, `${fieldName} girin.`)
    .refine((value) => {
      const parsedValue = Number(value)
      return Number.isFinite(parsedValue) && parsedValue >= 0
    }, `${fieldName} 0 veya daha büyük olmalıdır.`)
}

export const settingsFormSchema = z
  .object({
    address: z.string().trim(),
    businessName: z.string().trim().min(1, 'İşletme adı zorunludur.'),
    deliveryEnabled: z.boolean(),
    deliveryFee: nonNegativeNumberString('Teslimat ücreti'),
    email: z
      .string()
      .trim()
      .min(1, 'E-posta zorunludur.')
      .email('Geçerli bir e-posta adresi girin.'),
    minimumOrderAmount: nonNegativeNumberString('Minimum sipariş tutarı'),
    phone: z.string().trim(),
    pickupEnabled: z.boolean(),
  })
  .superRefine((values, context) => {
    if (!values.deliveryEnabled && !values.pickupEnabled) {
      context.addIssue({
        code: 'custom',
        message: 'En az bir teslimat yöntemi etkin olmalıdır.',
        path: ['deliveryEnabled'],
      })
    }
  })

export type SettingsFormValues = z.infer<typeof settingsFormSchema>
