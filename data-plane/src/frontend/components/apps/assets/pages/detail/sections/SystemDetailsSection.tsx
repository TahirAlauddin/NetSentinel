"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit2 } from "lucide-react";
import { Asset } from "@/types/assets";

interface SystemDetailsSectionProps {
  asset: Asset;
}

export function SystemDetailsSection({ asset }: SystemDetailsSectionProps) {
  const systemDetails = {
    processor: asset.computer_details?.processor || "---",
    memory: asset.computer_details?.memory || "---",
    hardDrive: asset.computer_details?.hard_drive || "---",
    serialNumber: asset.serial_number || "---",
    productModelNumber: asset.product_number || asset.model || "---",
    ipAddress: asset.ip_address || "---",
    macAddresses: asset.mac_address ? [asset.mac_address] : [],
  };

  return (
    <section id="system-details">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">System Details</h2>
        <Button variant="ghost" size="icon">
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
      <Card className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[
            { label: "Processor", value: systemDetails.processor },
            { label: "Memory", value: systemDetails.memory },
            { label: "Hard Drive", value: systemDetails.hardDrive },
            { label: "Serial Number", value: systemDetails.serialNumber },
            {
              label: "Product/Model Number",
              value: systemDetails.productModelNumber,
            },
            { label: "IP Address", value: systemDetails.ipAddress },
            { label: "MAC Addresses", value: systemDetails.macAddresses?.join(", ") },
          ].map((item, idx) => (
            <div key={idx}>
              <div className="text-sm text-gray-500 mb-1">{item.label}</div>
              <div className="text-gray-900 text-sm">{item.value || "---"}</div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

