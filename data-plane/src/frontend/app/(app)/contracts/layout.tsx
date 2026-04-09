"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Can, usePermissions } from "@/contexts/permissions-context";
import { getLayoutRequiredPermission } from "@/lib/layout-required-permissions";

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const { can } = usePermissions();
  const requiredPermission = getLayoutRequiredPermission("contracts", pathname);
  const isAllowed = !requiredPermission || can(requiredPermission);

  useEffect(() => {
    if (status === "loading") return;
    if (isAllowed) return;
    router.replace("/unauthorized");
  }, [status, isAllowed, router]);

  if (status === "loading") return null;
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
