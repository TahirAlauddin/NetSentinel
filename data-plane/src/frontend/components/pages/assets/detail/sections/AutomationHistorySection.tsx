"use client";

import { Card } from "@/components/ui/card";

export function AutomationHistorySection() {
  return (
    <section id="automation-history" className="pb-20 md:pb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Automation History</h2>
      <Card className="p-4 md:p-6">
        <p className="text-gray-500">No automation history available yet.</p>
      </Card>
    </section>
  );
}

