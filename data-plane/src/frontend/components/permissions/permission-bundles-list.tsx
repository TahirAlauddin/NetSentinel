"use client";

import React, { useState } from "react";
import { PermissionBundleRecord, PermissionRecord } from "@/types/groups";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  GripVertical,
  Loader2,
  Shield,
  Trash2,
} from "lucide-react";
import { getPermissionBundle } from "@/app/(app)/settings/actions";

interface PermissionBundlesListProps {
  bundles: PermissionBundleRecord[];
  onEdit: (bundle: PermissionBundleRecord) => void;
  onDelete: (id: number) => void;
  editingId: number | null;
}

const PermissionBundlesList = ({
  bundles,
  onEdit,
  onDelete,
  editingId,
}: PermissionBundlesListProps) => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loadingDetail, setLoadingDetail] = useState<Set<number>>(new Set());
  const [detailCache, setDetailCache] = useState<
    Record<number, PermissionRecord[]>
  >({});

  const toggleExpand = async (bundle: PermissionBundleRecord) => {
    const id = bundle.id;
    const next = new Set(expanded);

    if (next.has(id)) {
      next.delete(id);
      setExpanded(next);
      return;
    }

    next.add(id);
    setExpanded(next);

    if (detailCache[id] || bundle.permissions.length === 0) return;

    setLoadingDetail((prev) => new Set(prev).add(id));
    try {
      const detail = await getPermissionBundle(id);
      setDetailCache((prev) => ({
        ...prev,
        [id]: detail?.permissions_detail ?? [],
      }));
    } catch {
      setDetailCache((prev) => ({ ...prev, [id]: [] }));
    } finally {
      setLoadingDetail((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-3">
      {bundles.length > 0 ? (
        bundles.map((bundle) => {
          const isExpanded = expanded.has(bundle.id);
          const isLoading = loadingDetail.has(bundle.id);
          const permCount = bundle.permissions.length;
          const permsDetail = detailCache[bundle.id];

          return (
            <div
              key={bundle.id}
              className="border border-border rounded-lg bg-card overflow-hidden"
            >
              <div className="flex items-start gap-3 px-4 py-3 hover:bg-[oklch(0.98_0_0)]">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab mt-1 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[oklch(0.40_0.15_249)]">
                      {bundle.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {bundle.code}
                    </span>
                    {bundle.app ? (
                      <span className="text-xs text-muted-foreground">
                        • {bundle.app}
                      </span>
                    ) : null}
                    {permCount > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        • {permCount}{" "}
                        {permCount === 1 ? "permission" : "permissions"}
                      </span>
                    ) : null}
                  </div>

                  {bundle.description ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bundle.description}
                    </p>
                  ) : null}

                  {isExpanded ? (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      {isLoading ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Loading permissions…
                        </div>
                      ) : permsDetail && permsDetail.length > 0 ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Permissions ({permsDetail.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {permsDetail.map((perm) => (
                              <span
                                key={perm.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[oklch(0.95_0_0)] text-xs text-[oklch(0.40_0.15_249)] border border-[oklch(0.90_0.05_249)]"
                                title={perm.codename}
                              >
                                <Shield className="w-3 h-3" />
                                {perm.name}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">
                          No permissions assigned
                        </div>
                      )}
                    </div>
                  ) : null}

                  {!isExpanded && permCount === 0 ? (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      No permissions assigned
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {permCount > 0 ? (
                    <button
                      onClick={() => toggleExpand(bundle)}
                      className="p-1.5 rounded hover:bg-[oklch(0.93_0_0)] text-muted-foreground hover:text-foreground transition-colors"
                      title={isExpanded ? "Collapse" : "Expand permissions"}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  ) : null}

                  <button
                    onClick={() => onEdit(bundle)}
                    disabled={editingId !== null}
                    className="p-1.5 rounded hover:bg-[oklch(0.93_0_0)] text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(bundle.id)}
                    disabled={editingId !== null}
                    className="p-1.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground border border-border rounded-lg bg-card">
          No permission bundles found
        </div>
      )}
    </div>
  );
};

export default PermissionBundlesList;
