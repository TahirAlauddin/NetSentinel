"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

type AttachmentLike = File | { file?: string } | string;

interface AttachmentListProps {
  attachments: AttachmentLike[];
  onRemove?: (index: number) => void;
}

/**
 * Displays a list of attachments with optional remove buttons.
 * Purely client-side; no upload side effects.
 */
export function AttachmentList({ attachments, onRemove }: AttachmentListProps) {
  const items = useMemo(
    () =>
      attachments.map((item) => {
        const name =
          item instanceof File
            ? item.name
            : typeof item === "string"
              ? item.split("/").pop() || item
              : item.file?.split("/").pop() || "Attachment";
        const size =
          item instanceof File
            ? `${(item.size / 1024 / 1024).toFixed(2)} MB`
            : undefined;
        return { display: name, size };
      }),
    [attachments]
  );

  if (!attachments.length) return null;

  return (
    <div className="mt-2 space-y-1">
      {attachments.map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between bg-gray-50 p-2 rounded"
        >
          <div className="flex flex-col">
            <span className="text-sm text-gray-700">{items[index]?.display}</span>
            {items[index]?.size && (
              <span className="text-xs text-gray-500">{items[index]?.size}</span>
            )}
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-red-600 hover:text-red-700"
              aria-label="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

