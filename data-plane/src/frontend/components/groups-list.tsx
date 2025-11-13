import React, { useState } from "react";
import { GroupRecord } from "@/types/groups";
import { GripVertical, Trash2, Edit2, ChevronDown, ChevronRight, Shield } from "lucide-react";

interface GroupsListProps {
  groups: GroupRecord[];
  onEdit: (group: GroupRecord) => void;
  onDelete: (id: number) => void;
  editingId: number | null;
}

const GroupsList = ({ groups, onEdit, onDelete, editingId }: GroupsListProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  const toggleExpand = (groupId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="space-y-3">
      {groups.length > 0 ? (
        groups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const hasPermissions = group.permissions_detail && group.permissions_detail.length > 0;

          return (
            <div
              key={group.id}
              className="border border-border rounded-lg bg-card overflow-hidden"
            >
              {/* Group Header */}
              <div className="flex items-start gap-3 px-4 py-3 hover:bg-[oklch(0.98_0_0)]">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab mt-1 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[oklch(0.40_0.15_249)]">
                      {group.name}
                    </span>
                    {group.user_count !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        • {group.user_count} {group.user_count === 1 ? "user" : "users"}
                      </span>
                    )}
                    {hasPermissions && (
                      <span className="text-xs text-muted-foreground">
                        • {group.permissions_detail!.length} {group.permissions_detail!.length === 1 ? "permission" : "permissions"}
                      </span>
                    )}
                  </div>

                  {/* Permissions Preview (when collapsed) */}
                  {!isExpanded && hasPermissions && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {group.permissions_detail!.slice(0, 3).map((perm) => (
                        <span
                          key={perm.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[oklch(0.95_0.02_249)] text-xs text-[oklch(0.40_0.15_249)] border border-[oklch(0.90_0.05_249)]"
                        >
                          <Shield className="w-3 h-3" />
                          {perm.name}
                        </span>
                      ))}
                      {group.permissions_detail!.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[oklch(0.95_0_0)] text-xs text-muted-foreground border border-border">
                          +{group.permissions_detail!.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expanded Permissions List */}
                  {isExpanded && hasPermissions && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Permissions ({group.permissions_detail!.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.permissions_detail!.map((perm) => (
                          <span
                            key={perm.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[oklch(0.95_0.02_249)] text-xs text-[oklch(0.40_0.15_249)] border border-[oklch(0.90_0.05_249)]"
                            title={perm.codename}
                          >
                            <Shield className="w-3 h-3" />
                            {perm.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Permissions Message */}
                  {!hasPermissions && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      No permissions assigned
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasPermissions && (
                    <button
                      onClick={() => toggleExpand(group.id)}
                      className="p-1.5 rounded hover:bg-[oklch(0.93_0_0)] text-muted-foreground hover:text-foreground transition-colors"
                      title={isExpanded ? "Collapse" : "Expand permissions"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(group)}
                    disabled={editingId !== null}
                    className="p-1.5 rounded hover:bg-[oklch(0.93_0_0)] text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(group.id)}
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
          No groups found
        </div>
      )}
    </div>
  );
};

export default GroupsList;

