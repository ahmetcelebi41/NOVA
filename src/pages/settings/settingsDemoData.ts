import type { SettingsFormValues } from './settingsFormSchema'

const deliveryFee = 60
const minimumOrderAmount = 300

export const settingsDemoValues: SettingsFormValues = {
  address: 'Merkez Mahallesi, İstanbul',
  businessName: 'NOVA Pastanesi',
  deliveryEnabled: true,
  deliveryFee: String(deliveryFee),
  email: 'iletisim@novapastanesi.com',
  minimumOrderAmount: String(minimumOrderAmount),
  phone: '0212 555 01 10',
  pickupEnabled: true,
}

export const orderCreateDemoSettings = {
  deliveryEnabled: settingsDemoValues.deliveryEnabled,
  deliveryFee,
  minimumOrderAmount,
  pickupEnabled: settingsDemoValues.pickupEnabled,
} as const
