"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useSession } from "next-auth/react";

export interface PermissionsContextValue {
  /** List of permission codenames (e.g. "assets.view_asset"). From session, not sent per-request. */
  permissions: string[];
  /** True if user is superuser (bypasses permission checks when you use can()). */
  isSuperuser: boolean;
  /** Returns true if user has the permission or is superuser. Use for conditional UI. */
  can: (permission: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const permissions = useMemo(
    () => session?.user?.permissions ?? [],
    [session?.user?.permissions]
  );
  const isSuperuser = session?.user?.isSuperuser === true;

  const can = useCallback(
    (permission: string) => {
      if (isSuperuser) return true;
      return permissions.includes(permission);
    },
    [permissions, isSuperuser]
  );

  const value = useMemo<PermissionsContextValue>(
    () => ({ permissions, isSuperuser, can }),
    [permissions, isSuperuser, can]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  const { data: session } = useSession();
  if (ctx) return ctx;

  // Test / edge-case fallback:
  // Some pages/components may be rendered without mounting `PermissionsProvider`
  // (e.g. unit tests). In those cases, derive permissions from next-auth.
  const permissions = session?.user?.permissions ?? [];
  const isSuperuser = session?.user?.isSuperuser === true;

  const can = (permission: string) => {
    if (isSuperuser) return true;
    return permissions.includes(permission);
  };

  return { permissions, isSuperuser, can };
}

export interface CanProps {
  /** Django permission codename (e.g. "assets.add_asset"). Children render only if user has it or is superuser. */
  permission: string;
  /** Optional content to render when user does not have the permission. Default: null (render nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Renders children only when the user has the given permission (or is superuser).
 * Use to gate buttons, links, or whole sections without repeating permission logic.
 */
export function Can({ permission, fallback = null, children }: CanProps) {
  const { can } = usePermissions();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}
