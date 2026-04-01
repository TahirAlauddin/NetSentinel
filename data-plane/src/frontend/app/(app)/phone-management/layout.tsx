"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { Can, usePermissions } from "@/contexts/permissions-context";
import { getRequiredPermissionForPathname } from "@/constants/route-permissions";

function getPhoneManagementRequiredPermission(pathname: string): string | undefined {
  const p = pathname || "";
  if (p.startsWith("/phone-management/numbers/new")) {
    return "phone_management.add_managedphonenumber";
  }
  if (p.includes("/phone-management/numbers/") && p.endsWith("/edit")) {
    return "phone_management.change_managedphonenumber";
  }
  if (p.startsWith("/phone-management/blocks/new")) {
    return "phone_management.add_phonenumberblock";
  }
  if (p.includes("/phone-management/blocks/") && p.endsWith("/edit")) {
    return "phone_management.change_managedphonenumberblock";
  }
  return getRequiredPermissionForPathname(p);
}

export default function PhoneManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermissions();
  const requiredPermission = getPhoneManagementRequiredPermission(pathname);
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
