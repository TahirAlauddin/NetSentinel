"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function RelatedItemsSection() {
  return (
    <section id="related-items">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Items</h2>
      <Card className="p-4 md:p-6">
        <p className="text-sm text-gray-500 mb-4">
          Link other items from your company to this asset.
        </p>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input placeholder="Search for an item to associate" className="pl-10" />
        </div>
        <div className="text-center">
          <button className="text-blue-600 text-sm">+ Add related item</button>
        </div>
      </Card>
    </section>
  );
}

