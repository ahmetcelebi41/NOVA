import type { ProductStockStatus } from '../src/contracts/index.js'

export const stockStatusSql = `
  CASE
    WHEN stock_quantity = 0 THEN 'out'
    WHEN stock_quantity > 0 AND stock_quantity <= low_stock_threshold THEN 'low'
    ELSE 'normal'
  END
`

export function parseStockStatus(value: string): ProductStockStatus {
  if (value === 'normal' || value === 'low' || value === 'out') {
    return value
  }

  throw new Error('Invalid product stock status')
}
