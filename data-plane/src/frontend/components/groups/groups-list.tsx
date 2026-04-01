import React from "react";
import { GroupRecord } from "@/types/groups";
import {
  Edit2,
  GripVertical,
  Trash2,
} from "lucide-react";

interface GroupsListProps {
  groups: GroupRecord[];
  onEdit: (group: GroupRecord) => void;
  onDelete: (id: number) => void;
}

/** Compact group list with app-level permission counts and row actions. */
const GroupsList = ({ groups, onEdit, onDelete }: GroupsListProps) => {
  return (
    <div className="space-y-3">
      {groups.length > 0 ? (
        groups.map((group) => {
          const appLevelCount =
            group.app_level_permission_count ?? group.permission_bundle_ids?.length ?? 0;

          return (
            <div
              key={group.id}
              className="border border-border rounded-lg bg-card overflow-hidden"
            >
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
                    {appLevelCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        • {appLevelCount} {appLevelCount === 1 ? "app-level permission" : "app-level permissions"}
                      </span>
                    )}
                  </div>

                  {appLevelCount === 0 && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      No app-level permissions assigned
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onEdit(group)}
                    className="p-1.5 rounded hover:bg-[oklch(0.93_0_0)] text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(group.id)}
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
