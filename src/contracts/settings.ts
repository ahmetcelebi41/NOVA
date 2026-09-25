export type SettingsResponse = {
  businessName: string
  email: string
  phone: string | null
  address: string | null
  deliveryFeeMinor: number
  minimumOrderMinor: number
  deliveryEnabled: boolean
  pickupEnabled: boolean
}

export type UpdateSettingsInput = SettingsResponse
