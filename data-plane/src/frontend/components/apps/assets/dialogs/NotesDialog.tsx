"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { FileText } from "lucide-react"

export interface NotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (note: string) => void
}

export function NotesDialog({ open, onOpenChange, onSave }: NotesDialogProps) {
  const [note, setNote] = useState("")

  const handleSave = () => {
    if (note.trim()) {
      onSave(note)
      setNote("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Add Note
          </DialogTitle>
          <DialogDescription>Add a note or comment about this asset.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note-content">
              Note <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="note-content"
              placeholder="Enter your note here..."
              rows={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!note.trim()}>
            Add Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

