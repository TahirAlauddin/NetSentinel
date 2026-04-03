"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/contexts/permissions-context";
import { getRequiredPermissionForPathname } from "@/constants/route-permissions";
import { logPermissions } from "@/lib/permissions-debug";

function SessionWaitSpinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      <div className="ml-4 text-lg">{label}</div>
    </div>
  );
}

/**
 * RoutePermissionGuard Component
 *
 * Wraps the authenticated app shell. While NextAuth session is loading, permissions are
 * empty in context — nested layouts must not run (they would treat that as “denied” and
 * redirect to /unauthorized). We block children until status is known, then enforce RBAC.
 */
export function RoutePermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const { can } = usePermissions();

  const requiredPermission = getRequiredPermissionForPathname(pathname);
  const isAllowed = !requiredPermission || can(requiredPermission);

  useEffect(() => {
    if (status === "loading") {
      logPermissions("RoutePermissionGuard:session_loading", { pathname });
      return;
    }

    if (status === "unauthenticated") {
      logPermissions("RoutePermissionGuard:redirect_login", { pathname, status });
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") return;

    logPermissions("RoutePermissionGuard:check", {
      pathname,
      requiredPermission: requiredPermission ?? "(none)",
      hasRequired: Boolean(requiredPermission),
      allowed: !requiredPermission || can(requiredPermission),
    });

    if (!requiredPermission) return;
    if (!can(requiredPermission)) {
      logPermissions("RoutePermissionGuard:redirect_unauthorized", {
        pathname,
        requiredPermission,
      });
      router.replace("/unauthorized");
    }
  }, [status, pathname, requiredPermission, can, router]);

  if (status === "loading") {
    return <SessionWaitSpinner label="Loading session…" />;
  }

  if (status === "unauthenticated") {
    return <SessionWaitSpinner label="Redirecting to sign in…" />;
  }

  if (!isAllowed) {
    return <SessionWaitSpinner label="Redirecting…" />;
  }

  return <>{children}</>;
}
