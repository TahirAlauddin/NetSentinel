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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package } from "lucide-react"

export interface AddSoftwareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: {
    name: string
    version: string
    licenseType: string
    licenseKey?: string
    installedDate?: string
  }) => void
}

export function AddSoftwareDialog({ open, onOpenChange, onSave }: AddSoftwareDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    version: "",
    licenseType: "",
    licenseKey: "",
    installedDate: "",
  })

  const handleSave = () => {
    if (formData.name && formData.version) {
      onSave(formData)
      setFormData({ name: "", version: "", licenseType: "", licenseKey: "", installedDate: "" })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Add Software
          </DialogTitle>
          <DialogDescription>Track software installed on this asset.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="software-name">
                Software Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="software-name"
                placeholder="e.g., Microsoft Office"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="software-version">
                Version <span className="text-red-500">*</span>
              </Label>
              <Input
                id="software-version"
                placeholder="e.g., 2021"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="license-type">License Type</Label>
            <Select
              value={formData.licenseType}
              onValueChange={(value) => setFormData({ ...formData, licenseType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select license type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perpetual">Perpetual</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="freeware">Freeware</SelectItem>
                <SelectItem value="open-source">Open Source</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="license-key">License Key (optional)</Label>
            <Input
              id="license-key"
              placeholder="Enter license key"
              value={formData.licenseKey}
              onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installed-date">Installed Date (optional)</Label>
            <Input
              id="installed-date"
              type="date"
              value={formData.installedDate}
              onChange={(e) => setFormData({ ...formData, installedDate: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.name || !formData.version}>
            Add Software
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

