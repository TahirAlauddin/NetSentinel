"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { Can, usePermissions } from "@/contexts/permissions-context";
import { getRequiredPermissionForPathname } from "@/constants/route-permissions";

function getAssetsRequiredPermission(pathname: string): string | undefined {
  const p = pathname || "";
  if (p.startsWith("/assets/new")) return "assets.add_asset";
  if (p.startsWith("/assets/edit/")) return "assets.change_asset";
  return getRequiredPermissionForPathname(p);
}

export default function AssetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermissions();
  const requiredPermission = getAssetsRequiredPermission(pathname);
  const isAllowed = !requiredPermission || can(requiredPermission);

  useEffect(() => {
    if (isAllowed) return;
    router.replace("/unauthorized");
  }, [isAllowed, router]);

  if (!isAllowed) return null;

  return (
    <ProtectedRoute>
      {requiredPermission ? (
        <Can permission={requiredPermission}>{children}</Can>
      ) : (
        children
      )}
    </ProtectedRoute>
  );
}
