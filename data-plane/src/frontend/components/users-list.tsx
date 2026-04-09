import React from "react";

import { UserRecord } from "@/types/users"

const UserList = ({
  users,
  onView,
  onEdit,
  onDelete,
}: {
  users: UserRecord[]
  onView?: (userId: string) => void
  onEdit?: (userId: string) => void
  onDelete?: (userId: string) => void
}) => {
  const showActions = Boolean(onView || onEdit || onDelete)

  return (
    <table className="min-w-full text-xs sm:text-sm">
      <thead className="border-b border-border text-muted-foreground">
        <tr>
          <th className="text-left font-normal py-2 pr-2 sm:pr-6">Username</th>
          <th className="text-left font-normal py-2 pr-2 sm:pr-6 hidden sm:table-cell">
            Email
          </th>
          <th className="text-left font-normal py-2 pr-2 sm:pr-6">Role</th>
          <th className="text-left font-normal py-2 pr-0 hidden md:table-cell">
            ID
          </th>
          {showActions ? (
            <th className="text-left font-normal py-2 pr-0">
              Actions
            </th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {Array.isArray(users) && users.length > 0 ? (
          users.map((u) => (
            <tr key={u.id} className="border-b border-border/60 last:border-0">
              <td className="py-2 pr-2 sm:pr-6">{u.username}</td>
              <td className="py-2 pr-2 sm:pr-6 hidden sm:table-cell">
                {u.email}
              </td>
              <td className="py-2 pr-2 sm:pr-6 capitalize">
                {u.is_superuser ? "Superuser" : u.is_staff ? "Staff" : "User"}
              </td>
              <td className="py-2 pr-0 text-xs text-muted-foreground hidden md:table-cell">
                {u.id}
              </td>
              {showActions ? (
                <td className="py-2 pr-0">
                  <div className="flex items-center gap-2">
                    {onView ? (
                      <button
                        type="button"
                        onClick={() => onView(u.id)}
                        className="text-xs px-2 py-1 rounded-md border border-border bg-background hover:bg-[oklch(0.98_0_0)]"
                      >
                        View
                      </button>
                    ) : null}
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={() => onEdit(u.id)}
                        className="text-xs px-2 py-1 rounded-md border border-border bg-background hover:bg-[oklch(0.98_0_0)]"
                      >
                        Edit
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button
                        type="button"
                        onClick={() => onDelete(u.id)}
                        className="text-xs px-2 py-1 rounded-md bg-red-500 text-white hover:opacity-90"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={showActions ? 5 : 4} className="py-4 text-center text-muted-foreground">
              {Array.isArray(users) ? "No users found" : "Failed to load users"}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default UserList;
