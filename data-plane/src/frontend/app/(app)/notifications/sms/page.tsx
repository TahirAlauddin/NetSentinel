"use client";

import Link from "next/link";
import { Smartphone, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SmsNotificationsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/notifications"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Back to notifications"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMS</h1>
          <p className="text-muted-foreground mt-1">
            Get critical alerts via SMS. Coming soon.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            SMS notifications
          </CardTitle>
          <CardDescription>
            We are working on SMS delivery for critical alerts. You will be able to add your phone number and choose which alert types trigger an SMS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            In the meantime, use Slack or Discord for instant alerts, or enable desktop and sound notifications in Preferences.
          </p>
          <Link
            href="/notifications"
            className="inline-block mt-4 text-primary font-medium hover:underline"
          >
            ← Back to Notifications
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
