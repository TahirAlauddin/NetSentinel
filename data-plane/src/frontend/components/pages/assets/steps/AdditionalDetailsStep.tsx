"use client"

import { Plus, X } from "lucide-react"
import { FormField } from "../form"
import { Input } from "@/components/ui/input"
import { useAdditionalDetailsStep } from "../hooks/useFormDataFetch";
import { useState, useRef } from "react"
import { toast } from "sonner"

/**
 * Additional Details step component
 */
export function AdditionalDetailsStep() {
  const [dragActive, setDragActive] = useState(false)
  const [imageDragActive, setImageDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { formData, onInputChange } = useAdditionalDetailsStep();

  const handleAddRelatedItem = () => {
    // This would typically open a search/modal to select related items
    // For now, we'll just add a placeholder
    const currentItems = Array.isArray(formData.relatedItems) ? formData.relatedItems : []
    onInputChange("relatedItems", [...currentItems, ""])
  }

  const handleRemoveRelatedItem = (index: number) => {
    const currentItems = Array.isArray(formData.relatedItems) ? formData.relatedItems : []
    onInputChange("relatedItems", currentItems.filter((_, i) => i !== index))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const currentAttachments = Array.isArray(formData.attachments) ? formData.attachments : []
    const newFiles = Array.from(files)
    
    // Check file size (25MB limit)
    const validFiles = newFiles.filter((file) => {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large. Maximum size is 25MB.`)
        return false
      }
      return true
    })

    onInputChange("attachments", [...currentAttachments, ...validFiles])
  }

  const handleImageUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Check file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an image in .png, .jpg, or .jpeg format.")
      return
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image is too large. Maximum size is 10MB.")
      return
    }

    // Store the image file
    const currentAttachments = Array.isArray(formData.images) ? formData.images : []
    onInputChange("images", [...currentAttachments, file])
  }

  const handleRemoveAttachment = (index: number) => {
    const currentAttachments = Array.isArray(formData.images) ? formData.images : []
    onInputChange("images", currentAttachments.filter((_, i) => i !== index))
  }

  const relatedItems = Array.isArray(formData.relatedItems) ? formData.relatedItems : []
  const attachments = Array.isArray(formData.images) ? formData.images : []

  return (
    <div className="space-y-6 overflow-y-auto pr-4">
      <h2 className="text-xl font-semibold text-gray-900">Additional Details</h2>

      {/* Related Items */}
      <FormField label="Related Items" optional>
        <div className="space-y-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search for an item to associate"
              className="w-full border border-gray-300 rounded-lg pr-10"
            />
            <svg
              className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <button
            type="button"
            onClick={handleAddRelatedItem}
            className="text-sm text-gray-700 hover:text-blue-600 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add related item
          </button>
          {relatedItems.length > 0 && (
            <div className="mt-2 space-y-1">
              {relatedItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{item || `Related item ${index + 1}`}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRelatedItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormField>

      {/* Attachments */}
      <FormField label="Attachments" optional>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(false)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(false)
            handleFileUpload(e.dataTransfer.files)
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <p className="text-sm text-gray-700">
            DROP FILES HERE OR{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              CLICK TO UPLOAD
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-1">Max file size 25mb.</p>
        </div>
        {attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {attachments.map((attachment, index) => {
              const fileName = attachment instanceof File ? attachment.name : String(attachment)
              return (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm text-gray-700">{fileName}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </FormField>

      {/* Asset Image */}
      <FormField label="Asset Image" optional>
        <p className="text-xs text-gray-600 mb-2">
          Upload image in one of the following formats: .png, .jpg, .jpeg. Images cannot be larger than 10mb.
        </p>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            imageDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setImageDragActive(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setImageDragActive(false)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setImageDragActive(false)
            handleImageUpload(e.dataTransfer.files)
          }}
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files)}
          />
          <p className="text-sm text-gray-700">
            Drop files here or{" "}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              click to upload.
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-1">Recommend a 160x160 or larger square jpg or png.</p>
        </div>
      </FormField>
    </div>
  )
}

