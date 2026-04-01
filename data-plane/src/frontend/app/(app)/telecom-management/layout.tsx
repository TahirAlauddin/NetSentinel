"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { Can, usePermissions } from "@/contexts/permissions-context";
import { getRequiredPermissionForPathname } from "@/constants/route-permissions";

function getTelecomRequiredPermission(pathname: string): string | undefined {
  const p = pathname || "";

  if (p.startsWith("/telecom-management/providers/new")) return "telecom.add_provider";
  if (p.includes("/telecom-management/providers/") && p.endsWith("/edit")) {
    return "telecom.change_provider";
  }
  if (p.startsWith("/telecom-management/services/new")) return "telecom.add_service";
  if (p.includes("/telecom-management/services/") && p.endsWith("/edit")) {
    return "telecom.change_service";
  }
  if (p.startsWith("/telecom-management/phone-numbers/new")) {
    return "telecom.add_phonenumber";
  }
  if (p.startsWith("/telecom-management/data-circuits/new")) {
    return "telecom.add_datacircuit";
  }

  return getRequiredPermissionForPathname(p);
}

export default function TelecomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermissions();
  const requiredPermission = getTelecomRequiredPermission(pathname);
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
