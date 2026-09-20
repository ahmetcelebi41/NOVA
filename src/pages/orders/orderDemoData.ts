export type OrderStatus =
  | 'Yeni'
  | 'Hazırlanıyor'
  | 'Teslimata Hazır'
  | 'Tamamlandı'
  | 'İptal'

export type OrderHistoryEntry = {
  date: string
  status: OrderStatus
}

export type OrderItem = {
  id: string
  product: string
  quantity: number
  total: number
  unitPrice: number
}

export type OrderDemoRecord = {
  amount: number
  customer: string
  date: string
  delivery: {
    address?: string
    method: 'Teslimat' | 'Mağazadan Teslim Alma'
  }
  deliveryFee: number
  email: string
  history: OrderHistoryEntry[]
  id: string
  items: OrderItem[]
  number: string
  phone: string
  product: string
  status: OrderStatus
  subtotal: number
}

const customers = [
  'Elif Kaya',
  'Mert Demir',
  'Zeynep Şahin',
  'Can Aydın',
  'Selin Arslan',
  'Burak Yılmaz',
  'Derya Koç',
  'Emre Çetin',
]

const products = [
  'Antep Fıstıklı Baklava',
  'Frambuazlı Cheesecake',
  'Çikolatalı Makaron',
  'San Sebastian',
  'Limonlu Tart',
  'Çilekli Pasta',
]

const addresses = [
  'Bağdat Caddesi No: 42, Kadıköy / İstanbul',
  'Atatürk Bulvarı No: 18, Çankaya / Ankara',
  'Kıbrıs Şehitleri Caddesi No: 27, Konak / İzmir',
  'Fatih Sultan Mehmet Bulvarı No: 64, Nilüfer / Bursa',
]

const statuses: OrderStatus[] = [
  'Yeni',
  'Hazırlanıyor',
  'Teslimata Hazır',
  'Tamamlandı',
  'İptal',
  'Tamamlandı',
]

const dateOffsetsInHours = [
  1, 3, 6, 12, 20, 28, 40, 55, 72, 96, 120, 144, 168, 192, 240, 288, 336, 384,
  456, 528, 624, 744,
]

export const orderReferenceTimestamp = new Date('2026-09-17T16:00:00+03:00').getTime()
export const orderTodayStartTimestamp = new Date('2026-09-17T00:00:00+03:00').getTime()

function createHistory(date: string, status: OrderStatus): OrderHistoryEntry[] {
  const occurredStatuses: OrderStatus[] =
    status === 'İptal'
      ? ['Yeni', 'İptal']
      : statuses.slice(0, statuses.indexOf(status) + 1).filter((item) => item !== 'İptal')

  return occurredStatuses.map((historyStatus, index) => ({
    date: new Date(Date.parse(date) + index * 60 * 60 * 1000).toISOString(),
    status: historyStatus,
  }))
}

export const orderDemoData: OrderDemoRecord[] = dateOffsetsInHours.map((hours, index) => {
  const customer = customers[index % customers.length]
  const customerSlug = customer.toLocaleLowerCase('tr-TR').replaceAll(' ', '.')
  const date = new Date(orderReferenceTimestamp - hours * 60 * 60 * 1000).toISOString()
  const amount = 520 + ((index * 385) % 2480)
  const deliveryMethod = index % 3 === 0 ? 'Mağazadan Teslim Alma' : 'Teslimat'
  const deliveryFee = deliveryMethod === 'Teslimat' ? 60 : 0
  const product = products[index % products.length]
  const status = statuses[index % statuses.length]
  const subtotal = amount - deliveryFee
  const id = String(2048 - index)

  return {
    amount,
    customer,
    date,
    delivery: {
      address: deliveryMethod === 'Teslimat' ? addresses[index % addresses.length] : undefined,
      method: deliveryMethod,
    },
    deliveryFee,
    email: `${customerSlug}.${index + 1}@ornek.com`,
    history: createHistory(date, status),
    id,
    items: [
      {
        id: `${id}-1`,
        product,
        quantity: 1,
        total: subtotal,
        unitPrice: subtotal,
      },
    ],
    number: `#${id}`,
    phone: `05${30 + (index % 5)} ${120 + index} ${40 + (index % 50)} ${60 + (index % 30)}`,
    product,
    status,
    subtotal,
  }
})
