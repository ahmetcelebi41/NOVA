export type ProductPublication = 'Aktif' | 'Pasif'
export type ProductStockStatus = 'Normal' | 'Düşük Stok' | 'Tükendi'

export type ProductDemoRecord = {
  category: string
  createdAt: string
  id: string
  name: string
  price: number
  publication: ProductPublication
  sku: string
  stock: number
  stockStatus: ProductStockStatus
}

export const productCategoryOptions = [
  { label: 'Baklava', value: 'baklava' },
  { label: 'Cheesecake', value: 'cheesecake' },
  { label: 'Pasta', value: 'pasta' },
  { label: 'Tatlı', value: 'tatli' },
  { label: 'Makaron', value: 'makaron' },
  { label: 'Tart', value: 'tart' },
  { label: 'Kurabiye', value: 'kurabiye' },
] as const

const productCatalog = [
  { category: 'Baklava', name: 'Antep Fıstıklı Baklava', price: 820 },
  { category: 'Baklava', name: 'Cevizli Baklava', price: 680 },
  { category: 'Baklava', name: 'Soğuk Baklava', price: 720 },
  { category: 'Baklava', name: 'Kuru Baklava', price: 760 },
  { category: 'Cheesecake', name: 'Frambuazlı Cheesecake', price: 210 },
  { category: 'Cheesecake', name: 'Limonlu Cheesecake', price: 195 },
  { category: 'Cheesecake', name: 'San Sebastian', price: 230 },
  { category: 'Pasta', name: 'Çikolatalı Pasta', price: 640 },
  { category: 'Pasta', name: 'Çilekli Pasta', price: 690 },
  { category: 'Pasta', name: 'Red Velvet Pasta', price: 710 },
  { category: 'Tatlı', name: 'Tiramisu', price: 190 },
  { category: 'Tatlı', name: 'Profiterol', price: 175 },
  { category: 'Tatlı', name: 'Ekler', price: 145 },
  { category: 'Tatlı', name: 'Magnolia', price: 165 },
  { category: 'Tatlı', name: 'Sütlaç', price: 120 },
  { category: 'Tatlı', name: 'Kazandibi', price: 130 },
  { category: 'Makaron', name: 'Çikolatalı Makaron', price: 95 },
  { category: 'Makaron', name: 'Vanilyalı Makaron', price: 90 },
  { category: 'Tart', name: 'Limonlu Tart', price: 185 },
  { category: 'Tart', name: 'Elmalı Tart', price: 175 },
  { category: 'Kurabiye', name: 'Un Kurabiyesi', price: 150 },
  { category: 'Kurabiye', name: 'Bademli Kurabiye', price: 180 },
] as const

const stockStatuses: ProductStockStatus[] = [
  'Normal',
  'Düşük Stok',
  'Normal',
  'Tükendi',
  'Normal',
]

const referenceTimestamp = new Date('2026-09-17T12:00:00+03:00').getTime()

export const productDemoData: ProductDemoRecord[] = productCatalog.map((product, index) => {
  const stockStatus = stockStatuses[index % stockStatuses.length]

  return {
    ...product,
    createdAt: new Date(referenceTimestamp - index * 24 * 60 * 60 * 1000).toISOString(),
    id: String(3101 + index),
    publication: index % 5 === 4 ? 'Pasif' : 'Aktif',
    sku: `NVA-${String(index + 1).padStart(4, '0')}`,
    stock:
      stockStatus === 'Tükendi' ? 0 : stockStatus === 'Düşük Stok' ? 2 + (index % 4) : 18 + index,
    stockStatus,
  }
})
