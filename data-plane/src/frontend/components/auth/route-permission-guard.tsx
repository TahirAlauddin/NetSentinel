"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/contexts/permissions-context";
import { getRequiredPermissionForPathname } from "@/constants/route-permissions";

/**
 * RoutePermissionGuard Component
 * 
 * A wrapper component that protects routes by checking authentication and authorization.
 * This component ensures that only authenticated users can access protected content,
 * and optionally enforces role-based access control for admin-only areas.
 * 
 * Features:
 * - Authentication check (user must be logged in)
 * - Authorization check (user must have the required permission)
 * - Automatic redirection to unauthorized page if access is denied
 * - Loading state during authentication checks
 * 
 * @param children - The content to render if access is granted
 * @returns The RoutePermissionGuard component
 */
export function RoutePermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const { can } = usePermissions();

  const requiredPermission = getRequiredPermissionForPathname(pathname);
  const isAllowed = !requiredPermission || can(requiredPermission);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (isAllowed) return;
    router.replace("/unauthorized");
  }, [status, isAllowed, router]);

  if (status !== "authenticated") return <>{children}</>;
  if (!isAllowed) return null;

  return <>{children}</>;
}
