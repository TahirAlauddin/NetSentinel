"use client";

import { useState, useEffect } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { toast } from "sonner";

import { AssetForm } from "./form/AssetForm";

/**
 * AssetFormPage - Page for creating and editing assets
 * Supports both create and edit modes via URL search params
 */
const AssetFormPage = ({ assetId }: { assetId?: number }) => {
  // const searchParams = useSearchParams();
  // const assetId = searchParams.get("id");

  const [loading, setLoading] = useState(!!assetId);
  const [error, setError] = useState<string | null>(null);

  // ==================== Data Loading ====================

  useEffect(() => {
    const loadAsset = async () => {
      if (!assetId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

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
    return (
      <AppShell>
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto p-8">
            <div className="text-center py-12">
              <div className="text-gray-500">Loading asset data...</div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-auto bg-gray-50">
        {error && (
          <div className="max-w-7xl mx-auto p-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>
          </div>
        )}
        <AssetForm />
      </div>
    </AppShell>
  );
}


export default AssetFormPage;