"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit2, ChevronDown, User, MapPin } from "lucide-react";
import { STATUS_OPTIONS } from "@/constants/assets";
import { Asset } from "@/types/assets";

interface UsageStatusSectionProps {
  asset: Asset;
  currentStatus: (typeof STATUS_OPTIONS)[0];
  onStatusChange: (newStatus: string) => void;
  teammate: { userId: string; userName: string } | null;
  location: { locationId: string; locationName: string } | null;
  onTeammateClick: () => void;
  onLocationClick: () => void;
}

export function UsageStatusSection({
  asset: _asset,
  currentStatus,
  onStatusChange,
  teammate,
  location,
  onTeammateClick,
  onLocationClick,
}: UsageStatusSectionProps) {
  const [statusTab, setStatusTab] = useState<"current" | "history">("current");

  return (
    <section id="usage-status">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Usage Status</h2>
        <Button variant="ghost" size="icon">
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
      <Card className="p-4 md:p-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setStatusTab("current")}
            className={`px-3 md:px-4 py-2 text-sm rounded-lg ${
              statusTab === "current"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Current Status
          </button>
          <button
            onClick={() => setStatusTab("history")}
            className={`px-3 md:px-4 py-2 text-sm rounded-lg ${
              statusTab === "history"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            History
          </button>
        </div>

        {statusTab === "current" && (
          <>
            <div className="mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <currentStatus.icon className={`w-4 h-4 ${currentStatus.color}`} />
                    {currentStatus.label}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card
                className="p-4 border-2 border-dashed border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                onClick={onTeammateClick}
              >
                <div className="flex items-center gap-2 text-blue-600">
                  <User className="w-5 h-5" />
                  <span className="font-medium">
                    {teammate ? teammate.userName : "Set Teammate"}
                  </span>
                </div>
              </Card>
              <Card
                className="p-4 border-2 border-dashed border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                onClick={onLocationClick}
              >
                <div className="flex items-center gap-2 text-blue-600">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">
                    {location ? location.locationName : "Set Location"}
                  </span>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <span className="text-gray-500">Managed by: </span>
                <span className="text-gray-900">{teammate?.userName || "Not set"}</span>
              </div>
              <div>
                <span className="text-gray-500">Department: </span>
                <button className="text-blue-600 hover:underline">set it here</button>
              </div>
            </div>
          </>
        )}

        {statusTab === "history" && (
          <div className="text-gray-500 text-center py-8">
            No status history available yet.
          </div>
        )}
      </Card>
    </section>
  );
}

