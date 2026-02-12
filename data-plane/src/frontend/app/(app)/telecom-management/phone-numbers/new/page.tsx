"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { TelecomBreadcrumb } from "@/components/telecom/telecom-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewPhoneNumberPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 p-6 space-y-6">
          <TelecomBreadcrumb
            items={[
              { label: "Telecom", href: "/telecom-management" },
              { label: "Phone Numbers", href: "/telecom-management/phone-numbers" },
              { label: "New" },
            ]}
          />
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Add phone number
            </h1>
            <p className="text-gray-600 mt-1">
              Create a new phone number record and link it to a provider and optional service.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>New phone number</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Form for adding a phone number (number, friendly name, provider, service, location, notes) can be implemented here.
              </p>
              <Button variant="outline" asChild>
                <Link href="/telecom-management/phone-numbers">Back to list</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
