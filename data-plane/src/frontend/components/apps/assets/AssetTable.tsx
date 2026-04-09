"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit2, Eye, Trash2 } from "lucide-react";
import { Asset } from "@/types/assets";
import {
  getWarrantyColor,
  formatWarrantyStatus,
  formatAssetStatus,
  calculateWarrantyStatus,
} from "./utils";
import { useRouter } from "next/navigation";
import { Can } from "@/contexts/permissions-context";

export interface AssetTableProps {
  /**
   * Array of asset records to display
   */
  assets: Asset[];
  /**
   * Search term for filtering
   */
  searchTerm: string;
  /**
   * Callback when search term changes
   */
  onSearchChange: (term: string) => void;
  /**
   * Callback when edit button is clicked
   */
  onEditClick: (asset: Asset) => void;
  /**
   * Callback when delete button is clicked
   */
  onDeleteClick: (id: number) => void;
}

/**
 * AssetTable component displays assets in a table format
 * with search functionality and action buttons
 */
export function AssetTable({
  assets,
  searchTerm,
  onSearchChange,
  onEditClick,
  onDeleteClick,
}: AssetTableProps) {
  const router = useRouter();
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "retired":
        return "bg-gray-100 text-gray-800";
      case "in_repair":
        return "bg-yellow-100 text-yellow-800";
      case "disposed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Assets</h2>
        <Button
          onClick={() => router.push("/assets/new")}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </Button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {[
                "Name",
                "Asset Tag",
                "Category",
                "Status",
                "Vendor",
                "Location",
                "Warranty Expiry",
                "Actions",
              ].map((header) => (
                <th key={header} className="text-left py-3 px-4 font-semibold text-gray-900">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  No assets found
                </td>
              </tr>
            ) : (
              assets.map((asset) => {
                const warrantyStatus = asset.warranty_expiration
                  ? calculateWarrantyStatus(asset.warranty_expiration)
                  : "no_warranty";

                return (
                  <tr key={asset.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{asset.name}</td>
                    <td className="py-3 px-4 text-gray-700">{asset.asset_tag || "-"}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {asset.category?.name || "Uncategorized"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(asset.status || "")}>
                        {formatAssetStatus(asset.status || "")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{asset.vendor?.name || "-"}</td>
                    <td className="py-3 px-4 text-gray-700">{asset.location?.name || "-"}</td>
                    <td className="py-3 px-4">
                      {asset.warranty_expiration ? (
                        <Badge
                          style={{
                            backgroundColor: getWarrantyColor(warrantyStatus),
                            color: "white",
                          }}
                        >
                          {formatWarrantyStatus(warrantyStatus)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Can permission="assets.change_asset">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditClick(asset)}
                            className="gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Can>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/assets/${asset.id}`);
                          }}
                          className="gap-1 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Can permission="assets.delete_asset">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteClick(asset.id)}
                            className="gap-1 text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
