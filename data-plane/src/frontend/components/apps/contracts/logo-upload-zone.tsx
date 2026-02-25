"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Upload, X } from "lucide-react";
import {
  validateFileExtension,
  validateFileSize,
} from "@/lib/security/file-validation";
import {
  CONTRACT_LOGO_MAX_SIZE_BYTES,
  CONTRACT_LOGO_ALLOWED_EXTENSIONS,
  CONTRACT_LOGO_ACCEPT,
} from "@/types/contracts";

const allowedLogoExtensions = [...CONTRACT_LOGO_ALLOWED_EXTENSIONS];

export interface LogoUploadZoneProps {
  /** Currently selected file (single image for contract logo) */
  value: File | null;
  /** Preview URL when showing existing logo from API (e.g. blob or media URL) */
  previewUrl?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Image-only upload zone for contract logo. Shows preview for selected file
 * or existing logo. Validates extension and size to match backend.
 */
export function LogoUploadZone({
  value,
  previewUrl,
  onChange,
  error,
  disabled = false,
}: LogoUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Object URL for the selected File (so we can show preview)
  useEffect(() => {
    if (!value) {
      const toRevoke = objectUrlRef.current;
      if (toRevoke) {
        URL.revokeObjectURL(toRevoke);
        objectUrlRef.current = null;
      }
      queueMicrotask(() => setObjectUrl(null));
      return;
    }
    const url = URL.createObjectURL(value);
    objectUrlRef.current = url;
    queueMicrotask(() => setObjectUrl(url));
    return () => {
      URL.revokeObjectURL(url);
      objectUrlRef.current = null;
    };
  }, [value]);

  const validate = useCallback((file: File): string | null => {
    const ext = validateFileExtension(file.name, {
      allowedExtensions: allowedLogoExtensions,
    });
    if (!ext.valid) return ext.error ?? "Invalid image type";
    const size = validateFileSize(file, CONTRACT_LOGO_MAX_SIZE_BYTES);
    if (!size.valid) return size.error ?? "Image too large (max 2 MB)";
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
  const showPreview = objectUrl || (previewUrl && !value);
  const previewSrc = objectUrl ?? previewUrl ?? null;

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
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-blue-400 hover:bg-blue-50/30"}
          ${dragActive ? "border-blue-500 bg-blue-50/50" : "border-gray-300"}
        `}
        aria-label="Upload contract logo"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={CONTRACT_LOGO_ACCEPT}
          multiple={false}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {showPreview && previewSrc ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
              <img
                src={previewSrc}
                alt="Logo preview"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm text-gray-600">
              {value ? value.name : "Current logo"}
            </span>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <div className="text-base text-gray-700 mb-1">
              <span className="text-blue-600 hover:underline">Click to upload</span>
              {" or drag and drop"}
            </div>
            <div className="text-sm text-gray-500">
              PNG, JPG, GIF, WebP up to 2 MB
            </div>
          </>
        )}
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
            aria-label="Remove logo"
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
