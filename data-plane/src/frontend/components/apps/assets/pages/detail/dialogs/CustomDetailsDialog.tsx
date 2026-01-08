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
import { Settings } from "lucide-react"

export interface CustomDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { key: string; value: string }) => void
}

export function CustomDetailsDialog({ open, onOpenChange, onSave }: CustomDetailsDialogProps) {
  const [formData, setFormData] = useState({ key: "", value: "" })

  const handleSave = () => {
    if (formData.key && formData.value) {
      onSave(formData)
      setFormData({ key: "", value: "" })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Add Custom Details
          </DialogTitle>
          <DialogDescription>Add custom fields to track additional information about this asset.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="detail-key">
              Field Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="detail-key"
              placeholder="e.g., Room Number"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="detail-value">
              Value <span className="text-red-500">*</span>
            </Label>
            <Input
              id="detail-value"
              placeholder="e.g., 101A"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.key || !formData.value}>
            Add Detail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

