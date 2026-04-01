"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Can, usePermissions } from "@/contexts/permissions-context";
import { getRequiredPermissionForPathname } from "@/constants/route-permissions";

function getContractsRequiredPermission(pathname: string): string | undefined {
  const p = pathname || "";
  if (p.startsWith("/contracts/new")) return "contracts.add_contract";
  if (p.startsWith("/contracts/edit/")) return "contracts.change_contract";
  return getRequiredPermissionForPathname(p);
}

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermissions();
  const requiredPermission = getContractsRequiredPermission(pathname);
  const isAllowed = !requiredPermission || can(requiredPermission);

  useEffect(() => {
    if (isAllowed) return;
    router.replace("/unauthorized");
  }, [isAllowed, router]);

  if (!isAllowed) return null;

  return (
    <ProtectedRoute>
      <AppShell>
        {requiredPermission ? (
          <Can permission={requiredPermission}>{children}</Can>
        ) : (
          children
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
