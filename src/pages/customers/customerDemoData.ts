export type CustomerStatus = 'Yeni' | 'Tekrar' | 'Pasif'

export type CustomerOrderStatus =
  | 'Yeni'
  | 'Hazırlanıyor'
  | 'Teslimata Hazır'
  | 'Tamamlandı'
  | 'İptal'

export type CustomerOrderSummary = {
  amountInKurus: number
  date: string
  id: string
  number: string
  product: string
  status: CustomerOrderStatus
}

export type CustomerDemoRecord = {
  completedOrderCount: number
  email: string
  id: string
  lastOrderDate: string
  name: string
  orderCount: number
  phone: string
  recentOrders: CustomerOrderSummary[]
  status: CustomerStatus
  totalSpentInKurus: number
}

type CustomerBaseRecord = Omit<CustomerDemoRecord, 'completedOrderCount' | 'recentOrders'>

const customerBaseData: CustomerBaseRecord[] = [
  {
    email: 'ayse.kaya@example.com',
    id: '4101',
    lastOrderDate: '2026-09-15',
    name: 'Ayşe Kaya',
    orderCount: 1,
    phone: '0532 410 10 01',
    status: 'Yeni',
    totalSpentInKurus: 28950,
  },
  {
    email: 'mehmet.demir@example.com',
    id: '4102',
    lastOrderDate: '2026-09-18',
    name: 'Mehmet Demir',
    orderCount: 8,
    phone: '0533 410 10 02',
    status: 'Tekrar',
    totalSpentInKurus: 184350,
  },
  {
    email: 'zeynep.arslan@example.com',
    id: '4103',
    lastOrderDate: '2026-04-22',
    name: 'Zeynep Arslan',
    orderCount: 3,
    phone: '0534 410 10 03',
    status: 'Pasif',
    totalSpentInKurus: 76200,
  },
  {
    email: 'emre.yildiz@example.com',
    id: '4104',
    lastOrderDate: '2026-09-02',
    name: 'Emre Yıldız',
    orderCount: 1,
    phone: '0535 410 10 04',
    status: 'Yeni',
    totalSpentInKurus: 41750,
  },
  {
    email: 'elif.celik@example.com',
    id: '4105',
    lastOrderDate: '2026-09-12',
    name: 'Elif Çelik',
    orderCount: 6,
    phone: '0536 410 10 05',
    status: 'Tekrar',
    totalSpentInKurus: 129900,
  },
  {
    email: 'can.koc@example.com',
    id: '4106',
    lastOrderDate: '2026-03-08',
    name: 'Can Koç',
    orderCount: 2,
    phone: '0537 410 10 06',
    status: 'Pasif',
    totalSpentInKurus: 55300,
  },
  {
    email: 'selin.oz@example.com',
    id: '4107',
    lastOrderDate: '2026-09-09',
    name: 'Selin Öz',
    orderCount: 4,
    phone: '0538 410 10 07',
    status: 'Tekrar',
    totalSpentInKurus: 98500,
  },
  {
    email: 'burak.aydin@example.com',
    id: '4108',
    lastOrderDate: '2026-08-28',
    name: 'Burak Aydın',
    orderCount: 1,
    phone: '0539 410 10 08',
    status: 'Yeni',
    totalSpentInKurus: 33600,
  },
  {
    email: 'derya.sahin@example.com',
    id: '4109',
    lastOrderDate: '2026-09-17',
    name: 'Derya Şahin',
    orderCount: 11,
    phone: '0540 410 10 09',
    status: 'Tekrar',
    totalSpentInKurus: 263400,
  },
  {
    email: 'mert.akyol@example.com',
    id: '4110',
    lastOrderDate: '2026-02-14',
    name: 'Mert Akyol',
    orderCount: 5,
    phone: '0541 410 10 10',
    status: 'Pasif',
    totalSpentInKurus: 112750,
  },
  {
    email: 'ece.gunes@example.com',
    id: '4111',
    lastOrderDate: '2026-09-06',
    name: 'Ece Güneş',
    orderCount: 3,
    phone: '0542 410 10 11',
    status: 'Tekrar',
    totalSpentInKurus: 68900,
  },
  {
    email: 'kerem.tuna@example.com',
    id: '4112',
    lastOrderDate: '2026-08-25',
    name: 'Kerem Tuna',
    orderCount: 1,
    phone: '0543 410 10 12',
    status: 'Yeni',
    totalSpentInKurus: 24700,
  },
  {
    email: 'nazli.ergen@example.com',
    id: '4113',
    lastOrderDate: '2026-09-14',
    name: 'Nazlı Ergen',
    orderCount: 7,
    phone: '0544 410 10 13',
    status: 'Tekrar',
    totalSpentInKurus: 171250,
  },
  {
    email: 'onur.ak@example.com',
    id: '4114',
    lastOrderDate: '2026-01-19',
    name: 'Onur Ak',
    orderCount: 4,
    phone: '0545 410 10 14',
    status: 'Pasif',
    totalSpentInKurus: 83400,
  },
  {
    email: 'ipek.kurt@example.com',
    id: '4115',
    lastOrderDate: '2026-09-11',
    name: 'İpek Kurt',
    orderCount: 9,
    phone: '0546 410 10 15',
    status: 'Tekrar',
    totalSpentInKurus: 214600,
  },
  {
    email: 'tolga.sari@example.com',
    id: '4116',
    lastOrderDate: '2026-09-01',
    name: 'Tolga Sarı',
    orderCount: 1,
    phone: '0547 410 10 16',
    status: 'Yeni',
    totalSpentInKurus: 39200,
  },
  {
    email: 'seda.polat@example.com',
    id: '4117',
    lastOrderDate: '2026-09-19',
    name: 'Seda Polat',
    orderCount: 12,
    phone: '0548 410 10 17',
    status: 'Tekrar',
    totalSpentInKurus: 304800,
  },
  {
    email: 'umut.kilic@example.com',
    id: '4118',
    lastOrderDate: '2026-05-03',
    name: 'Umut Kılıç',
    orderCount: 2,
    phone: '0549 410 10 18',
    status: 'Pasif',
    totalSpentInKurus: 61800,
  },
  {
    email: 'gizem.dogan@example.com',
    id: '4119',
    lastOrderDate: '2026-09-08',
    name: 'Gizem Doğan',
    orderCount: 5,
    phone: '0550 410 10 19',
    status: 'Tekrar',
    totalSpentInKurus: 143500,
  },
  {
    email: 'kaan.erturk@example.com',
    id: '4120',
    lastOrderDate: '2026-08-23',
    name: 'Kaan Ertürk',
    orderCount: 1,
    phone: '0551 410 10 20',
    status: 'Yeni',
    totalSpentInKurus: 31500,
  },
  {
    email: 'buse.yalcin@example.com',
    id: '4121',
    lastOrderDate: '2026-09-16',
    name: 'Buse Yalçın',
    orderCount: 6,
    phone: '0552 410 10 21',
    status: 'Tekrar',
    totalSpentInKurus: 157900,
  },
  {
    email: 'serkan.ekin@example.com',
    id: '4122',
    lastOrderDate: '2026-04-11',
    name: 'Serkan Ekin',
    orderCount: 3,
    phone: '0553 410 10 22',
    status: 'Pasif',
    totalSpentInKurus: 70400,
  },
]

const completedOrderCounts: Record<string, number> = {
  '4101': 1,
  '4102': 3,
  '4103': 3,
  '4104': 1,
  '4105': 3,
  '4106': 2,
  '4107': 2,
  '4108': 1,
  '4109': 6,
  '4110': 5,
  '4111': 2,
  '4112': 1,
  '4113': 5,
  '4114': 3,
  '4115': 4,
  '4116': 1,
  '4117': 8,
  '4118': 2,
  '4119': 5,
  '4120': 1,
  '4121': 5,
  '4122': 2,
}

const recentOrderProducts = [
  'Antep Fıstıklı Baklava',
  'Frambuazlı Cheesecake',
  'Çikolatalı Makaron',
  'San Sebastian',
  'Limonlu Tart',
]

const pendingOrderStatuses: CustomerOrderStatus[] = [
  'Yeni',
  'Hazırlanıyor',
  'Teslimata Hazır',
]

function createRecentOrders(
  customer: CustomerBaseRecord,
  customerIndex: number,
  completedOrderCount: number,
): CustomerOrderSummary[] {
  const visibleOrderCount = Math.min(customer.orderCount, 10)
  const visibleCompletedCount = Math.min(completedOrderCount, visibleOrderCount)
  const visiblePendingCount = visibleOrderCount - visibleCompletedCount
  const completedOrderAmount = customer.totalSpentInKurus / completedOrderCount

  return Array.from({ length: visibleOrderCount }, (_, orderIndex) => {
    const isCompleted = orderIndex >= visiblePendingCount
    const id = String(510000 + customerIndex * 100 + orderIndex + 1)
    const date = new Date(
      Date.parse(`${customer.lastOrderDate}T00:00:00Z`) - orderIndex * 7 * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 10)

    return {
      amountInKurus: isCompleted
        ? completedOrderAmount
        : completedOrderAmount + (orderIndex + 1) * 2500,
      date,
      id,
      number: `#${id}`,
      product: recentOrderProducts[(customerIndex + orderIndex) % recentOrderProducts.length],
      status: isCompleted
        ? 'Tamamlandı'
        : pendingOrderStatuses[orderIndex % pendingOrderStatuses.length],
    }
  })
}

export const customerDemoData: CustomerDemoRecord[] = customerBaseData.map(
  (customer, customerIndex) => {
    const completedOrderCount = completedOrderCounts[customer.id]

    return {
      ...customer,
      completedOrderCount,
      recentOrders: createRecentOrders(customer, customerIndex, completedOrderCount),
    }
  },
)
