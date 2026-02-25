"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X } from "lucide-react";
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

export interface ContractLogoPreviewProps {
  value: File | null;
  previewUrl?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Squarish rounded logo preview for contract form. Renders at top of form;
 * click to upload, shows image or "Add logo" placeholder.
 */
export function ContractLogoPreview({
  value,
  previewUrl,
  onChange,
  error,
  disabled = false,
}: ContractLogoPreviewProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

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

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    setLocalError(null);
  };

  const showPreview = objectUrl ?? (previewUrl && !value);
  const previewSrc = objectUrl ?? previewUrl ?? null;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={`
          w-28 h-28 rounded-2xl border-2 flex items-center justify-center overflow-hidden
          transition-colors shrink-0
          ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-blue-400 hover:bg-gray-50"}
          ${showPreview ? "border-gray-200 bg-gray-50" : "border-dashed border-gray-300 bg-gray-50/50"}
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
          <span className="relative w-full h-full block group">
            <img
              src={previewSrc}
              alt=""
              className="w-full h-full object-contain"
            />
            {!disabled && (
              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs pointer-events-none">
                <Camera className="w-4 h-4" />
                Change
              </span>
            )}
          </span>
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-gray-500">
            <Camera className="w-8 h-8" />
            <span className="text-xs font-medium">Add logo</span>
          </span>
        )}
      </button>
      {showPreview && !disabled && (
        <button
          type="button"
          onClick={handleRemove}
          className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
          aria-label="Remove logo"
        >
          <X className="w-3.5 h-3.5" />
          Remove logo
        </button>
      )}
      {(error ?? localError) && (
        <p className="text-sm text-red-600 text-center" role="alert">
          {error ?? localError}
        </p>
      )}
    </div>
  );
}
