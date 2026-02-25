"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X } from "lucide-react";
import {
  validateFileExtension,
  validateFileSize,
} from "@/lib/security/file-validation";
import {
  CONTRACT_FILE_MAX_SIZE_BYTES,
  CONTRACT_ALLOWED_EXTENSIONS,
  CONTRACT_ALLOWED_ACCEPT,
} from "@/types/contracts";

export interface FileUploadZoneProps {
  /** Currently selected file (single file for contract document) */
  value: File | null;
  onChange: (file: File | null) => void;
  /** Validation error message to show (e.g. from parent form) */
  error?: string;
  accept?: string;
  disabled?: boolean;
}

const allowedExtensionsList = [...CONTRACT_ALLOWED_EXTENSIONS];

/**
 * Single-file upload zone for contract documents. Supports click-to-upload
 * and drag-and-drop. Validates extension and size to match backend.
 */
export function FileUploadZone({
  value,
  onChange,
  error,
  accept = CONTRACT_ALLOWED_ACCEPT,
  disabled = false,
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((file: File): string | null => {
    const ext = validateFileExtension(file.name, {
      allowedExtensions: allowedExtensionsList,
    });
    if (!ext.valid) return ext.error ?? "Invalid file type";
    const size = validateFileSize(file, CONTRACT_FILE_MAX_SIZE_BYTES);
    if (!size.valid) return size.error ?? "File too large";
    return null;
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length || disabled) return;
      const file = files[0];
      const err = validate(file);
      if (err) {
        setLocalError(err);
        onChange(null);
        return;
      }
      setLocalError(null);
      onChange(file);
    },
    [onChange, validate, disabled]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const displayError = error ?? localError;

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
          ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-blue-400 hover:bg-blue-50/30"}
          ${dragActive ? "border-blue-500 bg-blue-50/50" : "border-gray-300"}
        `}
        aria-label="Upload contract document"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={false}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <div className="text-base text-gray-700 mb-2">
          <span className="text-blue-600 hover:underline">Click to upload</span>
          {" or drag and drop"}
        </div>
        <div className="text-sm text-gray-500">
          PDF, DOC, DOCX, ODT, TXT, PNG, JPG, GIF up to 10MB
        </div>
      </div>

      {value && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
          <span className="truncate text-gray-900">{value.name}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setLocalError(null);
            }}
            className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {displayError && (
        <p className="text-sm text-red-600" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
