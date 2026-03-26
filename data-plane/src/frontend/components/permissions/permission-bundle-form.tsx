import React from "react";
import { PermissionRecord } from "@/types/groups";
import PermissionsByAppSelect, {
  type PermissionsByAppSelectProps,
} from "@/components/permissions/PermissionsByAppSelect";

interface PermissionBundleFormProps {
  name: string;
  setName: (name: string) => void;
  code: string;
  setCode: (code: string) => void;
  app: string;
  setApp: (app: string) => void;
  description: string;
  setDescription: (description: string) => void;
  selectedPermissions: number[];
  setSelectedPermissions: (ids: number[]) => void;

  permissions: PermissionRecord[];
  onListPermissionsPage: PermissionsByAppSelectProps["onListPermissionsPage"];
  hasMorePermissions?: boolean;
  loadingMorePermissions?: boolean;
  onLoadMorePermissions?: () => void | Promise<void>;
  onSearchPermissionsPage: PermissionsByAppSelectProps["onSearchPermissionsPage"];

  submitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitLabel: string;
}

const PermissionBundleForm = ({
  name,
  setName,
  code,
  setCode,
  app,
  setApp,
  description,
  setDescription,
  selectedPermissions,
  setSelectedPermissions,
  permissions,
  onListPermissionsPage,
  hasMorePermissions,
  loadingMorePermissions,
  onLoadMorePermissions,
  onSearchPermissionsPage,
  submitting,
  onSubmit,
  onCancel,
  submitLabel,
}: PermissionBundleFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="bundle-name" className="block text-sm font-medium mb-2">
            Bundle Name
          </label>
          <input
            id="bundle-name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            placeholder="e.g. View IPAM"
          />
        </div>

        <div>
          <label htmlFor="bundle-code" className="block text-sm font-medium mb-2">
            Bundle Code
          </label>
          <input
            id="bundle-code"
            name="code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            placeholder="e.g. view_ipam"
          />
        </div>
      </div>

      <div>
        <label htmlFor="bundle-app" className="block text-sm font-medium mb-2">
          App Label (optional)
        </label>
        <input
          id="bundle-app"
          name="app"
          type="text"
          value={app}
          onChange={(e) => setApp(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="e.g. ipam"
        />
      </div>

      <div>
        <label htmlFor="bundle-description" className="block text-sm font-medium mb-2">
          Description (optional)
        </label>
        <textarea
          id="bundle-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="What this bundle grants..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Permissions</label>
        <PermissionsByAppSelect
          selectedPermissionIds={selectedPermissions}
          setSelectedPermissionIds={setSelectedPermissions}
          permissions={permissions}
          onListPermissionsPage={onListPermissionsPage}
          hasMorePermissions={hasMorePermissions}
          loadingMorePermissions={loadingMorePermissions}
          onLoadMorePermissions={onLoadMorePermissions}
          onSearchPermissionsPage={onSearchPermissionsPage}
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
          disabled={submitting || !name.trim() || !code.trim()}
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

export default PermissionBundleForm;

