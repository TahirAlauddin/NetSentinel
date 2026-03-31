import React from "react";
import { GroupRecord } from "@/types/groups";
import AppLevelPermission from "@/components/permissions/AppLevelPermission";

const AddUserForm = ({
  handleAddUser,
  submitting,
  groups,
}: {
  handleAddUser: (e: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  groups: GroupRecord[];
}) => {
  return (
    <form onSubmit={handleAddUser} className="grid gap-2 sm:gap-3">
      <div className="grid gap-1">
        <label htmlFor="username" className="text-xs sm:text-sm">
          Username
        </label>
        <input
          id="username"
          name="username"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="janedoe"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="email" className="text-xs sm:text-sm">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="jane@example.com"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="password" className="text-xs sm:text-sm">
          Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="Enter password"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="re_password" className="text-xs sm:text-sm">
          Confirm Password
        </label>
        <input
          id="re_password"
          type="password"
          name="re_password"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="Confirm password"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="group_id" className="text-xs sm:text-sm">
          Group
        </label>
        <select
          id="group_id"
          name="group_id"
          required
          defaultValue=""
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
        >
          <option value="" disabled>
            Select a group
          </option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium">App-level permissions</h2>
        <AppLevelPermission disabled={submitting} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 h-9 sm:h-10 rounded-md bg-red-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {submitting ? "Adding User..." : "Add User"}
      </button>
      <p className="text-xs text-muted-foreground">
        Note: A group selection is required when creating a user.
      </p>
    </form>
  );
};

export default AddUserForm;
