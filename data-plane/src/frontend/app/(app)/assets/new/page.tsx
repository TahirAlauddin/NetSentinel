"use client";
import { Suspense } from "react";
import { AssetForm } from "@/components/apps/assets/shared/form/AssetForm";
import { LoadingState } from "@/components/feedback/loading-state";
import { AppShell } from "@/components/layout/app-shell";

export default function NewAssetPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading new asset page..." />}>
      <AppShell>
        <AssetForm assetId={null} mode="create" />
      </AppShell>
    </Suspense>
  );
}