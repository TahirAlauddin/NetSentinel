"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { usePermissions } from "@/contexts/permissions-context";

const ASSETS_VIEW_PERMISSION = "assets.view_asset";

export default function AssetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const { can } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!can(ASSETS_VIEW_PERMISSION)) router.replace("/unauthorized");
  }, [status, can, router]);

  return <ProtectedRoute>{children}</ProtectedRoute>;
}
