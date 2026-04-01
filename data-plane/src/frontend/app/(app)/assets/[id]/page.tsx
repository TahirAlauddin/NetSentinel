"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { AssetDetail } from "@/components/apps/assets/AssetDetail"
import { Button } from "@/components/ui/button"
import { AssetsApiClient } from "@/lib/api-client/asset"
import { Asset } from "@/types/assets"
import { validateId } from "@/lib/security/input-validation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/feedback/protected-route"

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assetId = validateId(params.id)
  const [loading, setLoading] = useState(assetId !== null)
  const [error, setError] = useState<string | null>(null)
  const [asset, setAsset] = useState<Asset | null>(null)

  useEffect(() => {
    if (assetId === null) return
    const loadAsset = async () => {
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

  if (assetId === null) {
    return (
      <ProtectedRoute requiredPermission="assets.view_asset">
        <AppShell>
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded text-amber-800">
                Invalid asset ID. Please use a valid link or go back to the list.
              </div>
              <Button variant="outline" onClick={() => router.push("/assets")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to assets
              </Button>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="assets.view_asset">
        <AppShell>
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto p-8">
              <div className="text-center py-12">
                <div className="text-gray-500">Loading asset data...</div>
              </div>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  if (error || !asset) {
    return (
      <ProtectedRoute requiredPermission="assets.view_asset">
        <AppShell>
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                {error || "Asset not found"}
              </div>
              <Button variant="outline" onClick={() => router.push("/assets")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to assets
              </Button>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredPermission="assets.view_asset">
      <AppShell>
        <AssetDetail assetId={assetId} />
      </AppShell>
    </ProtectedRoute>
  )
}
