import React from "react";
import { PermissionRecord } from "@/types/groups";

interface GroupFormProps {
  name: string;
  setName: (name: string) => void;
  selectedPermissions: number[];
  setSelectedPermissions: (ids: number[]) => void;
  permissions: PermissionRecord[];
  submitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitLabel: string;
}

const GroupForm = ({
  name,
  setName,
  selectedPermissions,
  setSelectedPermissions,
  permissions,
  submitting,
  onSubmit,
  onCancel,
  submitLabel,
}: GroupFormProps) => {
  const handlePermissionToggle = (permissionId: number) => {
    if (selectedPermissions.includes(permissionId)) {
      setSelectedPermissions(selectedPermissions.filter((id) => id !== permissionId));
    } else {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    }
  };

  // Group permissions by content type for better organization
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const key = perm.content_type || 0;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(perm);
    return acc;
  }, {} as Record<number, PermissionRecord[]>);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium mb-2"
        >
          Group Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="e.g., Administrators, Editors, Viewers"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Permissions
        </label>
        <div className="max-h-64 overflow-y-auto border border-border rounded-md p-3 space-y-2 bg-background">
          {permissions.length > 0 ? (
            Object.entries(groupedPermissions).map(([contentType, perms]) => (
              <div key={contentType} className="space-y-1">
                {perms.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-[oklch(0.98_0_0)] p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={() => handlePermissionToggle(perm.id)}
                      className="rounded border-input"
                    />
                    <span className="text-xs">{perm.name}</span>
                  </label>
                ))}
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4">
              No permissions available
            </div>
          )}
        </div>
        {selectedPermissions.length > 0 && (
          <div className="text-xs text-muted-foreground mt-2">
            {selectedPermissions.length} {selectedPermissions.length === 1 ? "permission" : "permissions"} selected
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 rounded-md border border-border bg-background hover:bg-[oklch(0.98_0_0)] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default GroupForm;

