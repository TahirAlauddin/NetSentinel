"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MapPin } from "lucide-react"

export interface SetLocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { locationId: string; locationName: string }) => void
  currentValue?: string
}

const MOCK_LOCATIONS = [
  { id: "1", name: "Head Office", address: "800 Roosevelt Road, Glen Ellyn, 60137" },
  { id: "2", name: "DevOps Center", address: "10355 S Jordan Gateway, South Jordan, 84095" },
  { id: "3", name: "HQ", address: "303 West Madison Street, Chicago, 60606" },
  { id: "4", name: "Portland Office", address: "603 Discovery Drive, West Chicago, 60185" },
  { id: "5", name: "Sales Office", address: "400 Park Avenue, New York, 10022" },
]

export function SetLocationDialog({ open, onOpenChange, onSave, currentValue }: SetLocationDialogProps) {
  const [selectedLocation, setSelectedLocation] = useState(currentValue || "")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredLocations = MOCK_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSave = () => {
    const location = MOCK_LOCATIONS.find((l) => l.id === selectedLocation)
    if (location) {
      onSave({ locationId: location.id, locationName: location.name })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Set Location
          </DialogTitle>
          <DialogDescription>Assign a location for this asset.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search-location">Search location</Label>
            <Input
              id="search-location"
              placeholder="Search by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Select location</Label>
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              {filteredLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => setSelectedLocation(location.id)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${
                    selectedLocation === location.id ? "bg-blue-50 border-l-2 border-blue-600" : ""
                  }`}
                >
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{location.name}</div>
                    <div className="text-sm text-gray-500">{location.address}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedLocation}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

