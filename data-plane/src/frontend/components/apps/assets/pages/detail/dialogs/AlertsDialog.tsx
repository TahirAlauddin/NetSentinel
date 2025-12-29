"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface AlertsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { type: string; message: string; triggerDate?: string }) => void
}

export function AlertsDialog({ open, onOpenChange, onSave }: AlertsDialogProps) {
  const [formData, setFormData] = useState({
    type: "",
    message: "",
    triggerDate: "",
  })

  const handleSave = () => {
    if (formData.type && formData.message) {
      onSave(formData)
      setFormData({ type: "", message: "", triggerDate: "" })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-5 h-5 text-orange-500">🔔</span>
            Add Alert
          </DialogTitle>
          <DialogDescription>Set up an alert for this asset.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="alert-type">
              Alert Type <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select alert type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warranty">Warranty Expiration</SelectItem>
                <SelectItem value="maintenance">Scheduled Maintenance</SelectItem>
                <SelectItem value="license">License Renewal</SelectItem>
                <SelectItem value="end-of-life">End of Life</SelectItem>
                <SelectItem value="custom">Custom Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="alert-message">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="alert-message"
              placeholder="Enter alert message..."
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trigger-date">Trigger Date (optional)</Label>
            <Input
              id="trigger-date"
              type="date"
              value={formData.triggerDate}
              onChange={(e) => setFormData({ ...formData, triggerDate: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.type || !formData.message}>
            Add Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

