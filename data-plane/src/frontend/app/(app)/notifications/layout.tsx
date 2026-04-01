"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { Can, usePermissions } from "@/contexts/permissions-context";
import { getLayoutRequiredPermission } from "@/lib/layout-required-permissions";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermissions();
  const requiredPermission = getLayoutRequiredPermission("notifications", pathname);
  const isAllowed = !requiredPermission || can(requiredPermission);

  useEffect(() => {
    if (isAllowed) return;
    router.replace("/unauthorized");
  }, [isAllowed, router]);

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
