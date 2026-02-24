"use client";

import Link from "next/link";
import { Phone, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PhoneManagementQuickLinks() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button variant="outline" size="lg" asChild className="gap-2">
        <Link href="/phone-management/numbers">
          <Phone className="w-5 h-5" />
          Managed Numbers
        </Link>
      </Button>
      <Button variant="outline" size="lg" asChild className="gap-2">
        <Link href="/phone-management/blocks">
          <Layers className="w-5 h-5" />
          Number Blocks
        </Link>
      </Button>
    </div>
  );
}
