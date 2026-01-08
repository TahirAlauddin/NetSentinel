"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package } from "lucide-react";

interface SoftwareSectionProps {
  software: Array<{ name: string; version: string; licenseType: string }>;
  onAddSoftware: () => void;
}

export function SoftwareSection({ software, onAddSoftware }: SoftwareSectionProps) {
  const [softwareSearch, setSoftwareSearch] = useState("");
  const [softwareStatus, setSoftwareStatus] = useState("active");

  return (
    <section id="software">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Software</h2>
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search your software by name..."
              value={softwareSearch}
              onChange={(e) => setSoftwareSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <select
              value={softwareStatus}
              onChange={(e) => setSoftwareStatus(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              className="text-blue-600 text-sm font-medium whitespace-nowrap"
              onClick={onAddSoftware}
            >
              + Add Software
            </button>
          </div>
        </div>

        {software.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-900 font-medium mb-2">
              Not tracking anything here, yet.
            </p>
            <p className="text-gray-500 text-sm">
              Try clearing the search box, removing filters, or{" "}
              <button
                className="text-blue-600 hover:underline"
                onClick={onAddSoftware}
              >
                Add Software
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {software.map((sw, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{sw.name}</div>
                    <div className="text-sm text-gray-500">
                      Version {sw.version} • {sw.licenseType || "No license"}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Active
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

