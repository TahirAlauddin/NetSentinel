"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePreviewList } from "./ImagePreviewList";

type ImageLike = File | { image?: string } | string;

interface ImageUploadFieldProps {
  label: string;
  value: ImageLike[];
  onChange: (images: ImageLike[]) => void;
  optional?: boolean;
  helperText?: string;
  maxSizeMB?: number;
  accept?: string;
}

const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ACCEPT = "image/png,image/jpeg,image/jpg";

/**
 * Generic image upload field with drag/drop, validation, and previews.
 * Client-side only; no backend requests.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  optional,
  helperText,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  accept = DEFAULT_ACCEPT,
}: ImageUploadFieldProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const maxBytes = maxSizeMB * 1024 * 1024;

    const valid = newFiles.filter((file) => {
      if (file.size > maxBytes) {
        toast.error(`Image "${file.name}" is too large. Max size is ${maxSizeMB}MB.`);
        return false;
      }
      if (allowedTypes.length && !allowedTypes.includes(file.type.toLowerCase())) {
        toast.error(`"${file.name}" must be one of: ${allowedTypes.join(", ")}`);
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
      <p className="text-xs text-gray-600">
        Upload images in: {allowedTypes.join(", ")}. Max size {maxSizeMB}mb.
      </p>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <p className="text-sm text-gray-700">
          Drop files here or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            click to upload.
          </button>
        </p>
        <p className="text-xs text-gray-500 mt-1">Recommended min size: 160x160.</p>
      </div>

      <ImagePreviewList images={value} onRemove={handleRemove} />
    </div>
  );
}

