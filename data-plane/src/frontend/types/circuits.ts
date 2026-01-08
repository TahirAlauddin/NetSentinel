export interface PointOfContact {
  id: number
  circuit: number
  contact_type: 'technical' | 'administrative'
  name: string
  email: string
  phone: string | null
  created_at: string
  updated_at: string
}

export interface CircuitRecord {
  id: number
  location: number
  location_name: string
  speed: number
  carrier: string
  circuit_id?: string | null
  points_of_contact?: PointOfContact[]
  created_at: string
  updated_at: string
}

