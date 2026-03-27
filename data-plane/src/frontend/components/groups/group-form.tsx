import React from "react";
import PermissionBundlesPicker from "@/components/groups/permission-bundles-picker";
import AppAccessLevelSelect from "@/components/permissions/app-access-level-select";
import { listPermissionsPage } from "@/app/(app)/settings/actions";
import type { UseGroupFormReturn } from "@/hooks/use-group-form";

interface GroupFormProps {
  form: UseGroupFormReturn;
  submitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitLabel: string;
}

const GroupForm = ({ form, submitting, onSubmit, onCancel, submitLabel }: GroupFormProps) => {
  const {
    name,
    setName,
    selectedPermissions,
    setSelectedPermissions,
    selectedBundleIds,
    setSelectedBundleIds,
    bundlesCatalog,
    permissions,
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
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

      {bundlesCatalog.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Permission bundles</label>
          <p className="text-xs text-muted-foreground mb-2">
            Curated bundles (recommended). Use app access levels below only when you need
            fine-grained overrides beyond bundles.
          </p>
          <PermissionBundlesPicker
            bundles={bundlesCatalog}
            selectedIds={selectedBundleIds}
            setSelectedIds={setSelectedBundleIds}
            disabled={submitting}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          App access level
        </label>
        <AppAccessLevelSelect
          permissions={permissions}
          selectedPermissionIds={selectedPermissions}
          setSelectedPermissionIds={setSelectedPermissions}
          onListPermissionsPage={listPermissionsPage}
          disabled={submitting}
        />
        {selectedPermissions.length > 0 && (
          <div className="text-xs text-muted-foreground mt-2">
            {selectedPermissions.length}{" "}
            {selectedPermissions.length === 1 ? "permission" : "permissions"} selected
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
