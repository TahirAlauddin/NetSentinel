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
import { DollarSign } from "lucide-react"

export interface CostDepreciationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: {
    purchasePrice?: number
    replacementCost?: number
    salvageValue?: number
    usefulLife?: number
    approachingEndOfLife?: number
    poNumber?: string
  }) => void
  currentValues?: {
    purchasePrice?: number
    replacementCost?: number
    salvageValue?: number
    usefulLife?: number
    approachingEndOfLife?: number
    poNumber?: string
  }
}

export function CostDepreciationDialog({ open, onOpenChange, onSave, currentValues }: CostDepreciationDialogProps) {
  const [formData, setFormData] = useState({
    purchasePrice: currentValues?.purchasePrice?.toString() || "",
    replacementCost: currentValues?.replacementCost?.toString() || "",
    salvageValue: currentValues?.salvageValue?.toString() || "",
    usefulLife: currentValues?.usefulLife?.toString() || "",
    approachingEndOfLife: currentValues?.approachingEndOfLife?.toString() || "",
    poNumber: currentValues?.poNumber || "",
  })

  const handleSave = () => {
    onSave({
      purchasePrice: formData.purchasePrice ? Number.parseFloat(formData.purchasePrice) : undefined,
      replacementCost: formData.replacementCost ? Number.parseFloat(formData.replacementCost) : undefined,
      salvageValue: formData.salvageValue ? Number.parseFloat(formData.salvageValue) : undefined,
      usefulLife: formData.usefulLife ? Number.parseInt(formData.usefulLife) : undefined,
      approachingEndOfLife: formData.approachingEndOfLife ? Number.parseInt(formData.approachingEndOfLife) : undefined,
      poNumber: formData.poNumber || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Cost & Depreciation
          </DialogTitle>
          <DialogDescription>Track the financial details and depreciation of this asset.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase-price">Purchase Price ($)</Label>
              <Input
                id="purchase-price"
                type="number"
                placeholder="0.00"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replacement-cost">Replacement Cost ($)</Label>
              <Input
                id="replacement-cost"
                type="number"
                placeholder="0.00"
                value={formData.replacementCost}
                onChange={(e) => setFormData({ ...formData, replacementCost: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salvage-value">Salvage Value ($)</Label>
              <Input
                id="salvage-value"
                type="number"
                placeholder="0.00"
                value={formData.salvageValue}
                onChange={(e) => setFormData({ ...formData, salvageValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="useful-life">Useful Life (years)</Label>
              <Input
                id="useful-life"
                type="number"
                placeholder="0"
                value={formData.usefulLife}
                onChange={(e) => setFormData({ ...formData, usefulLife: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end-of-life">Approaching End-of-Life (months)</Label>
              <Input
                id="end-of-life"
                type="number"
                placeholder="0"
                value={formData.approachingEndOfLife}
                onChange={(e) => setFormData({ ...formData, approachingEndOfLife: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-number">PO Number</Label>
              <Input
                id="po-number"
                placeholder="PO-12345"
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

