import { z } from 'zod'

export const deliveryMethods = ['Teslimat', 'Mağazadan Teslim Alma'] as const

export type DeliveryMethod = (typeof deliveryMethods)[number]

function isValidEmail(value: string) {
  return value === '' || z.string().email().safeParse(value).success
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function getLocalDateValue(date: Date) {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getLocalTimeValue(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Ürün kaydı bulunamadı.'),
  quantity: z.string().trim().min(1, 'Adet zorunludur.').refine((value) => {
    const parsedValue = Number(value)
    return Number.isInteger(parsedValue) && parsedValue >= 1
  }, 'Adet 1 veya daha büyük bir tam sayı olmalıdır.'),
})

export const orderCreateSchema = z
  .object({
    address: z.string().trim(),
    customerName: z.string().trim().min(1, 'Ad zorunludur.'),
    deliveryDate: z.string().trim(),
    deliveryEndTime: z.string().trim(),
    deliveryMethod: z.enum(['', ...deliveryMethods]),
    deliveryStartTime: z.string().trim(),
    email: z.string().trim().refine(isValidEmail, 'Geçerli bir e-posta adresi girin.'),
    items: z.array(orderItemSchema),
    phone: z.string().trim().min(1, 'Telefon zorunludur.'),
    productSearch: z.string(),
  })
  .superRefine((values, context) => {
    if (values.items.length === 0) {
      context.addIssue({ code: 'custom', message: 'En az bir ürün ekleyin.', path: ['productSearch'] })
    }

    if (!values.deliveryMethod) {
      context.addIssue({ code: 'custom', message: 'Teslimat yöntemi seçin.', path: ['deliveryMethod'] })
      return
    }

    if (values.deliveryMethod === 'Teslimat' && !values.address) {
      context.addIssue({ code: 'custom', message: 'Teslimat adresi zorunludur.', path: ['address'] })
    }
    if (!values.deliveryDate) {
      context.addIssue({ code: 'custom', message: 'Teslimat tarihi zorunludur.', path: ['deliveryDate'] })
    }
    if (!values.deliveryStartTime) {
      context.addIssue({ code: 'custom', message: 'Başlangıç saati zorunludur.', path: ['deliveryStartTime'] })
    }
    if (!values.deliveryEndTime) {
      context.addIssue({ code: 'custom', message: 'Bitiş saati zorunludur.', path: ['deliveryEndTime'] })
    }

    const now = new Date()
    const today = getLocalDateValue(now)

    if (values.deliveryDate && values.deliveryDate < today) {
      context.addIssue({ code: 'custom', message: 'Geçmiş bir tarih seçemezsiniz.', path: ['deliveryDate'] })
    }
    if (
      isValidTime(values.deliveryStartTime) &&
      isValidTime(values.deliveryEndTime) &&
      values.deliveryEndTime <= values.deliveryStartTime
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Bitiş saati başlangıç saatinden sonra olmalıdır.',
        path: ['deliveryEndTime'],
      })
    }
    if (
      values.deliveryDate === today &&
      isValidTime(values.deliveryStartTime) &&
      values.deliveryStartTime <= getLocalTimeValue(now)
    ) {
      context.addIssue({ code: 'custom', message: 'Geçmiş bir saat seçemezsiniz.', path: ['deliveryStartTime'] })
    }
  })

export type OrderCreateFormValues = z.infer<typeof orderCreateSchema>
