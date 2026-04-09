export interface LocationRecord {
  id: number
  name: string
  alias: string
  address1: string
  address2: string
  city: string
  state: string
  zip_code: string
  phone: string
  longitude: number
  latitude: number
  type_building: string
  mpoe: string
  dmarc: string
  /** Set when circuits API is available; optional until then. */
  circuits_count?: number
}

export interface LocationCreateDto {
  name: string
  address1: string
  city: string
  alias?: string
  address2?: string
  state?: string
  zip_code?: string
  phone?: string
  longitude?: number
  latitude?: number
  type_building?: string
  mpoe?: string
  dmarc?: string
}