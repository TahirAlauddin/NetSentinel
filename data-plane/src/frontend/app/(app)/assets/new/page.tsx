"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AssetForm } from "@/components/apps/assets/shared/form/AssetForm";
import { LoadingState } from "@/components/feedback/loading-state";
import { AppShell } from "@/components/layout/app-shell";
import { usePermissions } from "@/contexts/permissions-context";

export default function NewAssetPage() {
  const router = useRouter();
  const { status } = useSession();
  const { can } = usePermissions();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!can("assets.add_asset")) router.replace("/unauthorized");
  }, [status, can, router]);

  if (status === "loading" || (status === "authenticated" && !can("assets.add_asset"))) {
    return <LoadingState message="Loading..." />;
  }

  return (
    <Suspense fallback={<LoadingState message="Loading new asset page..." />}>
      <AppShell>
        <AssetForm assetId={null} mode="create" />
      </AppShell>
    </Suspense>
  );
}