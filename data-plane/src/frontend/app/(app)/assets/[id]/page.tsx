"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { AssetDetail } from "@/components/pages/assets/AssetDetail"
import { AssetsApiClient } from "@/lib/api-client/asset"
import { Asset } from "@/types/assets"
import { toast } from "sonner"

export default function AssetDetailPage() {
  const params = useParams()
  const id = params.id as string
  const assetId = id ? parseInt(id, 10) : null

  const [loading, setLoading] = useState(!!assetId)
  const [error, setError] = useState<string | null>(null)
  const [asset, setAsset] = useState<Asset | null>(null)

  useEffect(() => {
    const loadAsset = async () => {
      if (!assetId) {
        setError("Asset ID is required")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const assetsApiClient = new AssetsApiClient()
        const response = await assetsApiClient.getAsset<Asset>(assetId)

        if (response.error) {
          throw new Error(response.error)
        }

        if (!response.data) {
          throw new Error("Asset not found")
        }

        setAsset(response.data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load asset"
        setError(errorMessage)
        toast.error(errorMessage)
        console.error("Error loading asset:", err)
      } finally {
        setLoading(false)
      }
    }

    loadAsset()
  }, [assetId])

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
    )
  }

  if (error || !asset) {
    return (
      <AppShell>
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto p-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error || "Asset not found"}
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!assetId) {
    return (
      <AppShell>
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto p-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              Invalid asset ID
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AssetDetail assetId={assetId} />
    </AppShell>
  )
}
