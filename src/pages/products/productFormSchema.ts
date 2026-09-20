import { z } from 'zod'
import { productCategoryOptions, productDemoData } from './productDemoData'

const categoryValues = new Set<string>(
  productCategoryOptions.map((category) => category.value),
)

function requiredNumberString(
  requiredMessage: string,
  invalidMessage: string,
  predicate: (value: number) => boolean,
) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine((value) => {
      const parsedValue = Number(value)
      return Number.isFinite(parsedValue) && predicate(parsedValue)
    }, invalidMessage)
}

const productFormBaseSchema = z.object({
  category: z
    .string()
    .trim()
    .min(1, 'Kategori zorunludur.')
    .refine((value) => categoryValues.has(value), 'Geçerli bir kategori seçin.'),
  description: z.string().trim(),
  lowStockThreshold: requiredNumberString(
    'Düşük stok eşiği zorunludur.',
    'Düşük stok eşiği 0 veya daha büyük bir tam sayı olmalıdır.',
    (value) => Number.isInteger(value) && value >= 0,
  ),
  name: z.string().trim().min(1, 'Ürün adı zorunludur.'),
  price: requiredNumberString(
    'Satış fiyatı zorunludur.',
    "Satış fiyatı 0'dan büyük olmalıdır.",
    (value) => value > 0,
  ),
  publication: z.enum(['Aktif', 'Pasif']),
  sku: z.string().trim(),
  stock: requiredNumberString(
    'Stok adedi zorunludur.',
    'Stok adedi 0 veya daha büyük bir tam sayı olmalıdır.',
    (value) => Number.isInteger(value) && value >= 0,
  ),
})

export type ProductFormValues = z.infer<typeof productFormBaseSchema>

export function createProductFormSchema(currentProductId?: string) {
  return productFormBaseSchema.superRefine((values, context) => {
    if (!values.sku) {
      return
    }

    const duplicateProduct = productDemoData.find(
      (product) =>
        product.id !== currentProductId &&
        product.sku === values.sku,
    )

    if (duplicateProduct) {
      context.addIssue({
        code: 'custom',
        message: 'Bu SKU başka bir üründe kullanılıyor.',
        path: ['sku'],
      })
    }
  })
}

export type ProductFormSchema = ReturnType<typeof createProductFormSchema>
