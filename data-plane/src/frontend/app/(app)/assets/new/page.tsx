"use client";

import { Suspense } from "react";
import { AssetForm } from "@/components/pages/assets/form/AssetForm";
import { LoadingState } from "@/components/feedback/loading-state";

/**
 * Main component with Suspense boundary for useSearchParams
 */
export default function NewAssetPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading new asset page..." />}>
      <AssetForm assetId={null} />
    </Suspense>
  );
}
