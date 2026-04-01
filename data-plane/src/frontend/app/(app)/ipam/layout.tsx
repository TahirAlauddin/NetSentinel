"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { Can, usePermissions } from "@/contexts/permissions-context";
import { getRequiredPermissionForPathname } from "@/constants/route-permissions";

function getIpamRequiredPermission(pathname: string): string | undefined {
  const p = pathname || "";

  // Specific create/edit page permissions
  if (p.startsWith("/ipam/subnets/new")) return "ipam.add_subnet";
  if (p.startsWith("/ipam/subnets/edit/")) return "ipam.change_subnet";
  if (p.startsWith("/ipam/subnet-groups/new")) return "ipam.add_subnetgroup";
  if (p.startsWith("/ipam/subnet-groups/edit/")) return "ipam.change_subnetgroup";
  if (p.startsWith("/ipam/customers/new")) return "ipam.add_customer";
  if (p.startsWith("/ipam/customers/edit/")) return "ipam.change_customer";
  if (p.startsWith("/ipam/vlans/new")) return "ipam.add_vlan";
  if (p.startsWith("/ipam/vlans/edit/")) return "ipam.change_vlan";
  if (p.startsWith("/ipam/vrfs/new")) return "ipam.add_vrf";
  if (p.startsWith("/ipam/vrfs/edit/")) return "ipam.change_vrf";
  if (p.startsWith("/ipam/devices/new")) return "ipam.add_device";
  if (p.startsWith("/ipam/devices/edit/")) return "ipam.change_device";
  if (p.startsWith("/ipam/dhcp-scopes/new")) return "ipam.add_dhcpscope";
  if (p.startsWith("/ipam/dhcp-scopes/edit/")) return "ipam.change_dhcpscope";
  if (p.startsWith("/ipam/dhcp-leases/new")) return "ipam.add_dhcplease";
  if (p.startsWith("/ipam/dhcp-reservations/new")) return "ipam.add_dhcpreservation";
  if (p.startsWith("/ipam/dhcp-reservations/edit/")) return "ipam.change_dhcpreservation";
  if (p.startsWith("/ipam/ip-pools/new")) return "ipam.add_ippool";
  if (p.startsWith("/ipam/ip-pools/edit/")) return "ipam.change_ippool";

  // Default to route-based view permissions for all other IPAM pages
  return getRequiredPermissionForPathname(p);
}

export default function IpamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermissions();
  const requiredPermission = getIpamRequiredPermission(pathname);
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

