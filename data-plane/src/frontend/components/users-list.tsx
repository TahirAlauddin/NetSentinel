import React from "react";

import { UserRecord } from "@/types/users"

const UserList = ({ users }: { users: UserRecord[] }) => {
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
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="py-4 text-center text-muted-foreground">
              {Array.isArray(users) ? "No users found" : "Failed to load users"}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default UserList;
