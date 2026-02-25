"use client";

import Link from "next/link";
import { Phone, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PhoneManagementFeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="transition-colors hover:bg-muted/50">
        <Link href="/phone-management/numbers" className="block">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Managed Numbers
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Individual phone numbers with extension, service type, DID, and
              assignment.
            </p>
            <p className="text-xs text-primary mt-2">View all →</p>
          </CardContent>
        </Link>
      </Card>
      <Card className="transition-colors hover:bg-muted/50">
        <Link href="/phone-management/blocks" className="block">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Number Blocks
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Ranges of numbers at a location for bulk management.
            </p>
            <p className="text-xs text-primary mt-2">View all →</p>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}
