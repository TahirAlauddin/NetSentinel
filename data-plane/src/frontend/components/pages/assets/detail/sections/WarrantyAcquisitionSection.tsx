"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit2 } from "lucide-react";

export function WarrantyAcquisitionSection() {
  return (
    <section id="warranty">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Warranty & Acquisition</h2>
        <Button variant="ghost" size="icon">
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
      <Card className="p-4 md:p-6 text-center">
        <p className="text-gray-600 text-sm md:text-base">
          Warranty date not set. You can set it{" "}
          <button className="text-blue-600 hover:underline">here</button> or you can{" "}
          <button className="text-blue-600 hover:underline">
            enter the machine serial number
          </button>{" "}
          and let us find the warranty expiration for you!
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Installed on: Not set,{" "}
          <button className="text-blue-600 hover:underline">set it here</button>.
        </p>
      </Card>
    </section>
  );
}

