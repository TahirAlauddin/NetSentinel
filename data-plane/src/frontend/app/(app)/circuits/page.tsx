"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import CircuitsList from "@/components/circuits-list"
import AddCircuitForm from "@/components/add-circuit-form"
import { LoadingState } from "@/components/loading-state"
import { AuthRequiredState } from "@/components/auth-required-state"
import { CircuitRecord } from "@/types/circuits"
import { LocationRecord } from "@/types/locations"
import { api } from "@/lib/utils"


async function listCircuits(): Promise<CircuitRecord[]> {
  const response = await api.get<CircuitRecord[] | { results: CircuitRecord[] }>("/infrastructure/circuits/")
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch circuits")
  }
  
  const data = response.data
  
  // Handle paginated response (if the API returns { results: [...] })
  if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as any).results)) {
    return (data as any).results
  }
  
  // Handle direct array response
  if (Array.isArray(data)) {
    return data
  }
  
  // If no valid data format, return empty array
  console.warn('Unexpected circuits data format:', data)
  return []
}

async function listLocations(): Promise<LocationRecord[]> {
  const response = await api.get<LocationRecord[] | { results: LocationRecord[] }>("/infrastructure/locations/")
  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch locations")
  }
  
  const data = response.data
  
  // Handle paginated response (if the API returns { results: [...] })
  if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as any).results)) {
    return (data as any).results
  }
  
  // Handle direct array response
  if (Array.isArray(data)) {
    return data
  }
  
  // If no valid data format, return empty array
  console.warn('Unexpected locations data format:', data)
  return []
}

async function createCircuit(location: number, carrier: string, speed: number, circuitId?: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const payload: any = {
    location,
    carrier,
    speed,
  }
  
  if (circuitId && circuitId.trim()) {
    payload.circuit_id = circuitId.trim()
  }
  
  const response = await api.post("/infrastructure/circuits/", payload)
  
  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Failed to create circuit"
    }
  }
  
  return {
    success: true,
    message: "Circuit created successfully"
  }
}

export default function CircuitsPage() {
  const { data: session } = useSession()
  const [circuits, setCircuits] = useState<CircuitRecord[]>([])
  const [locations, setLocations] = useState<LocationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const handleAddCircuit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const location = parseInt(formData.get("location") as string)
    const carrier = formData.get("carrier") as string
    const speed = parseInt(formData.get("speed") as string)
    const circuitId = formData.get("circuit_id") as string
    
    try {
      const result = await createCircuit(location, carrier, speed, circuitId)
      
      if (result.success) {
        toast.success(result.message || 'Circuit created successfully!')
        // Refresh circuits list after successful addition
        const circuitList = await listCircuits()
        setCircuits(Array.isArray(circuitList) ? circuitList : [])
        // Reset form
        e.currentTarget.reset()
      } else {
        toast.error(result.error || 'Failed to create circuit')
      }
    } catch (error) {
      console.error('Failed to add circuit:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [circuitList, locationList] = await Promise.all([
          listCircuits(),
          listLocations()
        ])
        console.log('Fetched circuits:', circuitList)
        console.log('Fetched locations:', locationList)
        setCircuits(Array.isArray(circuitList) ? circuitList : [])
        setLocations(Array.isArray(locationList) ? locationList : [])
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data. Please check if you are logged in.')
        setCircuits([])
        setLocations([])
      } finally {
        setLoading(false)
      }
    }
    
    if (session) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [session])

  if (loading) {
    return <LoadingState />
  }

  if (!session || session.error === 'RefreshAccessTokenError') {
    return <AuthRequiredState />
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <header className="border-b border-border pb-2">
            <h1 className="text-xl font-semibold">Circuits</h1>
            <p className="text-sm text-muted-foreground">Manage network circuits for your infrastructure.</p>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Circuits table */}
            <section className="xl:col-span-2 rounded-md border border-border bg-card text-card-foreground">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-medium">Existing Circuits</h2>
              </div>
              <div className="p-2 sm:p-4 overflow-x-auto">
                <CircuitsList circuits={circuits} />
              </div>
            </section>

            {/* Add circuit form */}
            <section className="rounded-md border border-border bg-card text-card-foreground">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-medium">Add Circuit</h2>
              </div>
              <div className="p-3 sm:p-4">
                <AddCircuitForm 
                  handleAddCircuit={handleAddCircuit} 
                  submitting={submitting}
                  locations={locations}
                />
              </div>
            </section>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}

