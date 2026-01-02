"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Edit2,
  RefreshCw,
  MoreHorizontal,
  Monitor,
  ChevronDown,
  Clock,
  Bell,
} from "lucide-react";
import { STATUS_OPTIONS } from "@/constants/assets";
import { Asset } from "@/types/assets";

interface AssetDetailHeaderProps {
  asset: Asset;
  currentStatus: (typeof STATUS_OPTIONS)[0];
  onStatusChange: (newStatus: string) => void;
}

export function AssetDetailHeader({
  asset,
  currentStatus,
  onStatusChange,
}: AssetDetailHeaderProps) {
  const router = useRouter();

  // TODO: Map asset.category to asset.type if needed
  const assetType = (asset as Asset & { type?: string }).type || asset.category?.name || "Asset";

  // TODO: Map asset.created_at to asset.createdAt if needed
  const createdAt = (asset as Asset & { createdAt?: string }).createdAt || asset.created_at || "";

  return (
    <header className="bg-white border-b px-4 md:px-8 py-4 shrink-0 z-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
          <div className="text-sm text-blue-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            {assetType}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700"
              onClick={() => router.push("/assets")}
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to all assets</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
            <Monitor className="w-7 h-7 sm:w-8 sm:h-8 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{asset.name}</h1>
              <button className="text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap">
                + Add tag
              </button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mt-2 ${currentStatus.bgColor}`}
                >
                  <currentStatus.icon className={`w-4 h-4 ${currentStatus.color}`} />
                  {currentStatus.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {STATUS_OPTIONS.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => onStatusChange(status.value)}
                    className="flex items-center gap-2"
                  >
                    <status.icon className={`w-4 h-4 ${status.color}`} />
                    {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
              <span className="truncate">
                {asset.manufacturer || "No manufacturer"} / {asset.model || "No model"} /{" "}
                {asset.asset_tag || "No tag"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                {createdAt}
              </span>
            </div>
          </div>
          <button
            className="text-orange-500 text-sm flex items-center gap-1 whitespace-nowrap"
            onClick={() => {
              // TODO: Implement alerts dialog
            }}
          >
            <Bell className="w-4 h-4" />+ Add alerts
          </button>
        </div>
      </div>
    </header>
  );
}
