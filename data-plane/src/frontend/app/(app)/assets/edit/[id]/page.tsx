"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { AssetForm } from "@/components/apps/assets/shared/form/AssetForm";
import { LoadingState } from "@/components/feedback/loading-state";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { validateId } from "@/lib/security/input-validation";

/**
 * Edit asset page - validates route id before rendering form.
 */
export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = validateId(params.id);

  useEffect(() => {
    if (assetId === null) {
      router.replace("/assets");
    }
  }, [assetId, router]);

  if (assetId === null) {
    return (
      <ProtectedRoute>
        <LoadingState message="Redirecting..." />
      </ProtectedRoute>
    );
  }
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 overflow-auto bg-gray-50">
          <AssetForm assetId={assetId} mode="edit" />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

