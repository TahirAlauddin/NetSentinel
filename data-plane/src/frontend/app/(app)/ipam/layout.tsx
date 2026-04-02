"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { Can, usePermissions } from "@/contexts/permissions-context";
import { getLayoutRequiredPermission } from "@/lib/layout-required-permissions";

export default function IpamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const { can } = usePermissions();
  const requiredPermission = getLayoutRequiredPermission("ipam", pathname);
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
        <div className="min-h-[calc(100dvh-120px)]">
          {requiredPermission ? (
            <Can permission={requiredPermission}>{children}</Can>
          ) : (
            children
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

