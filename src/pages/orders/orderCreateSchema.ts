import { z } from 'zod'
import {
  customerDemoData,
  type CustomerDemoRecord,
} from '../customers/customerDemoData'
import { productDemoData } from '../products/productDemoData'
import { orderCreateDemoSettings } from '../settings/settingsDemoData'

export const deliveryMethods = ['Teslimat', 'Mağazadan Teslim Alma'] as const

export type DeliveryMethod = (typeof deliveryMethods)[number]

export type CustomerMatch =
  | { kind: 'conflict'; emailCustomer: CustomerDemoRecord; phoneCustomer: CustomerDemoRecord }
  | { customer: CustomerDemoRecord; kind: 'matched'; source: 'E-posta' | 'Telefon' }
  | { kind: 'new' }

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase('tr-TR')
}

export function resolveCustomerMatch(phone: string, email: string): CustomerMatch {
  const normalizedPhone = normalizePhone(phone)
  const normalizedEmail = normalizeEmail(email)
  const phoneCustomer = normalizedPhone
    ? customerDemoData.find((customer) => normalizePhone(customer.phone) === normalizedPhone)
    : undefined
  const emailCustomer = normalizedEmail
    ? customerDemoData.find(
        (customer) => normalizeEmail(customer.email) === normalizedEmail,
      )
    : undefined

  if (phoneCustomer && emailCustomer && phoneCustomer.id !== emailCustomer.id) {
    return { emailCustomer, kind: 'conflict', phoneCustomer }
  }

  if (phoneCustomer) {
    return { customer: phoneCustomer, kind: 'matched', source: 'Telefon' }
  }

  if (emailCustomer) {
    return { customer: emailCustomer, kind: 'matched', source: 'E-posta' }
  }

  return { kind: 'new' }
}

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
  quantity: z
    .string()
    .trim()
    .min(1, 'Adet zorunludur.')
    .refine((value) => {
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
    email: z
      .string()
      .trim()
      .refine(isValidEmail, 'Geçerli bir e-posta adresi girin.'),
    items: z.array(orderItemSchema),
    phone: z.string().trim().min(1, 'Telefon zorunludur.'),
    productSearch: z.string(),
  })
  .superRefine((values, context) => {
    const customerMatch = resolveCustomerMatch(values.phone, values.email)

    if (customerMatch.kind === 'conflict') {
      context.addIssue({
        code: 'custom',
        message: 'Telefon ve e-posta farklı müşteri kayıtlarıyla eşleşiyor.',
        path: ['phone'],
      })
    }

    if (values.items.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'En az bir ürün ekleyin.',
        path: ['productSearch'],
      })
    }

    let subtotal = 0
    let allItemsValid = values.items.length > 0

    values.items.forEach((item, index) => {
      const product = productDemoData.find((candidate) => candidate.id === item.productId)
      const quantity = Number(item.quantity)

      if (!product) {
        allItemsValid = false
        context.addIssue({
          code: 'custom',
          message: 'Ürün kaydı bulunamadı.',
          path: ['items', index, 'quantity'],
        })
        return
      }

      if (product.publication !== 'Aktif') {
        allItemsValid = false
        context.addIssue({
          code: 'custom',
          message: 'Bu ürün artık aktif değil.',
          path: ['items', index, 'quantity'],
        })
        return
      }

      if (product.stockStatus === 'Tükendi' || product.stock === 0) {
        allItemsValid = false
        context.addIssue({
          code: 'custom',
          message: 'Bu ürün tükendi.',
          path: ['items', index, 'quantity'],
        })
        return
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        allItemsValid = false
        return
      }

      if (quantity > product.stock) {
        allItemsValid = false
        context.addIssue({
          code: 'custom',
          message: `En fazla ${product.stock} adet seçebilirsiniz.`,
          path: ['items', index, 'quantity'],
        })
        return
      }

      subtotal += product.price * quantity
    })

    if (allItemsValid && subtotal < orderCreateDemoSettings.minimumOrderAmount) {
      context.addIssue({
        code: 'custom',
        message: `Ürün ara toplamı en az ${orderCreateDemoSettings.minimumOrderAmount} TL olmalıdır.`,
        path: ['productSearch'],
      })
    }

    if (!values.deliveryMethod) {
      context.addIssue({
        code: 'custom',
        message: 'Teslimat yöntemi seçin.',
        path: ['deliveryMethod'],
      })
      return
    }

    const methodIsAvailable =
      (values.deliveryMethod === 'Teslimat' && orderCreateDemoSettings.deliveryEnabled) ||
      (values.deliveryMethod === 'Mağazadan Teslim Alma' &&
        orderCreateDemoSettings.pickupEnabled)

    if (!methodIsAvailable) {
      context.addIssue({
        code: 'custom',
        message: 'Seçilen teslimat yöntemi artık kullanılamıyor.',
        path: ['deliveryMethod'],
      })
    }

    if (values.deliveryMethod === 'Teslimat' && !values.address) {
      context.addIssue({
        code: 'custom',
        message: 'Teslimat adresi zorunludur.',
        path: ['address'],
      })
    }

    if (!values.deliveryDate) {
      context.addIssue({
        code: 'custom',
        message: 'Teslimat tarihi zorunludur.',
        path: ['deliveryDate'],
      })
    }

    if (!values.deliveryStartTime) {
      context.addIssue({
        code: 'custom',
        message: 'Başlangıç saati zorunludur.',
        path: ['deliveryStartTime'],
      })
    }

    if (!values.deliveryEndTime) {
      context.addIssue({
        code: 'custom',
        message: 'Bitiş saati zorunludur.',
        path: ['deliveryEndTime'],
      })
    }

    const now = new Date()
    const today = getLocalDateValue(now)

    if (values.deliveryDate && values.deliveryDate < today) {
      context.addIssue({
        code: 'custom',
        message: 'Geçmiş bir tarih seçemezsiniz.',
        path: ['deliveryDate'],
      })
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
      context.addIssue({
        code: 'custom',
        message: 'Geçmiş bir saat seçemezsiniz.',
        path: ['deliveryStartTime'],
      })
    }
  })

export type OrderCreateFormValues = z.infer<typeof orderCreateSchema>
