"use client";

import { useRef, useState } from "react";
import { AttachmentList } from "./AttachmentList";
import { toast } from "sonner";

type AttachmentLike = File | { file?: string } | string;

interface AttachmentsUploadFieldProps {
  label: string;
  value: AttachmentLike[];
  onChange: (attachments: AttachmentLike[]) => void;
  optional?: boolean;
  helperText?: string;
  maxSizeMB?: number;
}

const DEFAULT_MAX_SIZE_MB = 25;

/**
 * Generic attachments upload field with drag/drop and click-to-upload.
 * Client-side only; no backend requests.
 */
export function AttachmentsUploadField({
  label,
  value,
  onChange,
  optional,
  helperText,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}: AttachmentsUploadFieldProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const maxBytes = maxSizeMB * 1024 * 1024;
    const valid = newFiles.filter((file) => {
      if (file.size > maxBytes) {
        toast.error(`File "${file.name}" is too large. Max size is ${maxSizeMB}MB.`);
        return false;
      }
      return true;
    });

    if (valid.length) {
      onChange([...value, ...valid]);
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">
        {label}
        {optional && <span className="text-gray-500 text-xs"> (optional)</span>}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
          handleUpload(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <p className="text-sm text-gray-700">
          DROP FILES HERE OR{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            CLICK TO UPLOAD
          </button>
        </p>
        <p className="text-xs text-gray-500 mt-1">Max file size {maxSizeMB}mb.</p>
        {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
      </div>

      <AttachmentList attachments={value} onRemove={handleRemove} />
    </div>
  );
}

