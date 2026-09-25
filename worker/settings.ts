import type { SettingsResponse, UpdateSettingsInput } from '../src/contracts/index.js'

type SettingsRow = {
  business_name: string
  email: string
  phone: string | null
  address: string | null
  delivery_fee_in_kurus: number
  minimum_order_amount_in_kurus: number
  delivery_enabled: number
  pickup_enabled: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalText(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === 'string'
}

export function parseUpdateSettingsInput(value: unknown): UpdateSettingsInput | null {
  if (
    !isRecord(value)
    || Object.keys(value).some((key) => ![
      'businessName', 'email', 'phone', 'address', 'deliveryFeeMinor',
      'minimumOrderMinor', 'deliveryEnabled', 'pickupEnabled',
    ].includes(key))
    || typeof value.businessName !== 'string'
    || !value.businessName.trim()
    || typeof value.email !== 'string'
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())
    || !optionalText(value.phone)
    || !optionalText(value.address)
    || !Number.isSafeInteger(value.deliveryFeeMinor)
    || (value.deliveryFeeMinor as number) < 0
    || !Number.isSafeInteger(value.minimumOrderMinor)
    || (value.minimumOrderMinor as number) < 0
    || typeof value.deliveryEnabled !== 'boolean'
    || typeof value.pickupEnabled !== 'boolean'
    || (!value.deliveryEnabled && !value.pickupEnabled)
  ) {
    return null
  }

  return {
    businessName: value.businessName.trim(),
    email: value.email.trim(),
    phone: value.phone?.trim() || null,
    address: value.address?.trim() || null,
    deliveryFeeMinor: value.deliveryFeeMinor as number,
    minimumOrderMinor: value.minimumOrderMinor as number,
    deliveryEnabled: value.deliveryEnabled,
    pickupEnabled: value.pickupEnabled,
  }
}

function mapSettings(row: SettingsRow): SettingsResponse {
  if (
    !Number.isSafeInteger(row.delivery_fee_in_kurus)
    || row.delivery_fee_in_kurus < 0
    || !Number.isSafeInteger(row.minimum_order_amount_in_kurus)
    || row.minimum_order_amount_in_kurus < 0
    || ![0, 1].includes(row.delivery_enabled)
    || ![0, 1].includes(row.pickup_enabled)
  ) {
    throw new Error('Invalid settings row')
  }

  return {
    businessName: row.business_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    deliveryFeeMinor: row.delivery_fee_in_kurus,
    minimumOrderMinor: row.minimum_order_amount_in_kurus,
    deliveryEnabled: row.delivery_enabled === 1,
    pickupEnabled: row.pickup_enabled === 1,
  }
}

export async function getSettings(database: D1Database): Promise<SettingsResponse | null> {
  const row = await database.prepare(`
    SELECT business_name, email, phone, address, delivery_fee_in_kurus,
      minimum_order_amount_in_kurus, delivery_enabled, pickup_enabled
    FROM settings WHERE id = 1
  `).first<SettingsRow>()

  return row ? mapSettings(row) : null
}

export async function putSettings(
  database: D1Database,
  input: UpdateSettingsInput,
): Promise<SettingsResponse> {
  await database.prepare(`
    INSERT INTO settings (
      id, business_name, email, phone, address, delivery_fee_in_kurus,
      minimum_order_amount_in_kurus, delivery_enabled, pickup_enabled, updated_at
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      business_name = excluded.business_name,
      email = excluded.email,
      phone = excluded.phone,
      address = excluded.address,
      delivery_fee_in_kurus = excluded.delivery_fee_in_kurus,
      minimum_order_amount_in_kurus = excluded.minimum_order_amount_in_kurus,
      delivery_enabled = excluded.delivery_enabled,
      pickup_enabled = excluded.pickup_enabled,
      updated_at = excluded.updated_at
  `).bind(
    input.businessName,
    input.email,
    input.phone,
    input.address,
    input.deliveryFeeMinor,
    input.minimumOrderMinor,
    input.deliveryEnabled ? 1 : 0,
    input.pickupEnabled ? 1 : 0,
    new Date().toISOString(),
  ).run()

  const settings = await getSettings(database)

  if (!settings) {
    throw new Error('Saved settings missing')
  }

  return settings
}
