"use client";

import React, { useMemo, useState } from "react";
import { PermissionBundleRecord } from "@/types/groups";

type PermissionBundlesPickerProps = {
  bundles: PermissionBundleRecord[];
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
  disabled?: boolean;
};

/**
 * Searchable, app-grouped checklist for assigning PermissionBundles to a Group (via ExtendedGroup).
 */
export default function PermissionBundlesPicker({
  bundles,
  selectedIds,
  setSelectedIds,
  disabled,
}: PermissionBundlesPickerProps) {
  const [query, setQuery] = useState("");

  
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bundles;
    return bundles.filter((b) => {
      const app = (b.app ?? "").toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        app.includes(q) ||
        (b.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [bundles, query]);

  const byApp = useMemo(() => {
    const m = new Map<string, PermissionBundleRecord[]>();
    for (const b of filtered) {
      const key = b.app?.trim() ? b.app.trim() : "Other";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(b);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const toggle = (id: number) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
        placeholder="Search bundles by name, code, or app…"
        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
        autoComplete="off"
      />

      {bundles.length > 0 ? (
        <div className="text-xs text-muted-foreground">
          {bundles.length} {bundles.length === 1 ? "bundle" : "bundles"} available
        </div>
      ) : null}

      <div className="max-h-96 overflow-y-auto border border-border rounded-md p-3 space-y-4 bg-background">
        {byApp.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-6">
            No bundles match your search.
          </div>
        ) : (
          byApp.map(([app, items]) => (
            <div key={app}>
              <div className="text-xs font-medium text-muted-foreground mb-2">{app}</div>
              <div className="space-y-2">
                {items.map((b) => (
                  <label
                    key={b.id}
                    className="flex items-start gap-2 text-sm cursor-pointer hover:bg-[oklch(0.98_0_0)] p-1.5 rounded-md"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-input mt-0.5"
                      checked={selectedIds.includes(b.id)}
                      onChange={() => toggle(b.id)}
                      disabled={disabled}
                    />
                    <span className="min-w-0">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 font-mono">{b.code}</span>
                      {b.description ? (
                        <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {b.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedIds.length > 0 ? (
        <div className="text-xs text-muted-foreground">
          {selectedIds.length}{" "}
          {selectedIds.length === 1 ? "bundle" : "bundles"} selected
        </div>
      ) : null}
    </div>
  );
}
