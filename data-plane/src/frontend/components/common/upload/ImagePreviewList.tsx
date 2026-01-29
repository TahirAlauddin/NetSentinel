"use client";

import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { getSafeAbsoluteUrl } from "@/lib/security/url";

type ImageLike = File | { image?: string } | string;

/** blob: URLs from createObjectURL are safe; for other strings allow only http(s). */
function safePreviewUrl(url: string): string | null {
  if (!url) return null;
  if (url.startsWith("blob:")) return url;
  return getSafeAbsoluteUrl(url);
}

interface ImagePreviewListProps {
  images: ImageLike[];
  onRemove?: (index: number) => void;
}

/**
 * Renders thumbnail previews for images with click-to-open behavior.
 * Purely client-side; does not perform uploads.
 * Only http(s) or blob URLs are used in src/href to avoid javascript: or data: XSS.
 */
export function ImagePreviewList({ images, onRemove }: ImagePreviewListProps) {
  const previews = useMemo(
    () =>
      images.map((img) => {
        if (img instanceof File) {
          const url = URL.createObjectURL(img);
          return { url, label: img.name, revoke: url };
        }
        if (typeof img === "string") {
          return { url: img, label: img.split("/").pop() || "Image" };
        }
        return { url: img.image || "", label: img.image?.split("/").pop() || "Image" };
      }),
    [images]
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.revoke) URL.revokeObjectURL(p.revoke);
      });
    };
  }, [previews]);

  if (!images.length) return null;

  return (
    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
      {previews.map((preview, index) => {
        const safeUrl = safePreviewUrl(preview.url);
        return (
        <div
          key={index}
          className="relative group border border-gray-200 rounded overflow-hidden bg-gray-50"
        >
          <button
            type="button"
            onClick={() => safeUrl && window.open(safeUrl, "_blank", "noopener")}
            className="block w-full h-28 bg-gray-100 focus:outline-none"
            disabled={!safeUrl}
          >
            {safeUrl ? (
            <img
              src={safeUrl}
              alt={preview.label}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            ) : (
              <span className="text-xs text-gray-500">Invalid or unsupported URL</span>
            )}
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
            {preview.label}
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 bg-white/90 text-red-600 hover:text-red-700 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        );
      })}
    </div>
  );
}

