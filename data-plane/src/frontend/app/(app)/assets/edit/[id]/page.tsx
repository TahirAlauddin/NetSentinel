"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { AppShell } from "@/components/layout/app-shell";
import { AssetForm } from "@/components/apps/assets/shared/form/AssetForm";
import { LoadingState } from "@/components/feedback/loading-state";
import { validateId } from "@/lib/security/input-validation";
import { usePermissions } from "@/contexts/permissions-context";

/**
 * Edit asset page - validates route id and change_asset permission before rendering form.
 */
export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const { can } = usePermissions();
  const assetId = validateId(params.id);

  useEffect(() => {
    if (assetId === null) {
      router.replace("/assets");
      return;
    }
    if (status === "authenticated" && !can("assets.change_asset")) {
      router.replace("/unauthorized");
    }
  }, [assetId, status, can, router]);

  if (assetId === null) {
    return <LoadingState message="Redirecting..." />;
  }
  if (status === "loading" || (status === "authenticated" && !can("assets.change_asset"))) {
    return <LoadingState message="Loading..." />;
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-auto bg-gray-50">
        <AssetForm assetId={assetId} mode="edit" />
      </div>
    </AppShell>
  );
}

