"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { toast } from "sonner";

import { AssetForm } from "@/components/apps/assets/shared/form/AssetForm";
import { LoadingState } from "@/components/feedback/loading-state";

/**
 * Main component with Suspense boundary for useSearchParams
 */
export function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const { id: assetId } = params as { id: string };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAsset = async () => {
      try {
        setLoading(true);
        setError(null);

        const assetIdNum = parseInt(assetId, 10);
        if (isNaN(assetIdNum)) {
          // Redirect to not found
          router.push("/404");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load asset";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error loading asset:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAsset();
  }, [assetId]);

  if (loading) {
    return <LoadingState message="Loading asset data..." />;
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-auto bg-gray-50">
        {error && (
          <div className="max-w-7xl mx-auto p-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>
          </div>
        )}
        <AssetForm assetId={parseInt(assetId, 10)} mode="edit" />
      </div>
    </AppShell>
  );
}

