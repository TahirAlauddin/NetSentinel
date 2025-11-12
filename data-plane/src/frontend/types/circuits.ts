export interface CircuitRecord {
  id: number
  location: number
  location_name: string
  speed: number
  carrier: string
  circuit_id?: string | null
  points_of_contact?: any[]
  created_at: string
  updated_at: string
}

