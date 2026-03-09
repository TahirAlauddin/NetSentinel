"use client";

import Link from "next/link";
import { Phone, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VoiceNotificationsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Voice</h1>
          <p className="text-muted-foreground mt-1">
            Receive voice call alerts. Coming soon.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Voice call notifications
          </CardTitle>
          <CardDescription>
            We are working on voice call delivery for critical alerts. You will receive a call when urgent issues need immediate attention.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Until then, use Slack or Discord for real-time alerts, or enable sound and desktop notifications in Preferences.
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
