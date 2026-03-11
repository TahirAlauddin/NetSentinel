"use client";

import { useState } from "react";
import Link from "next/link";
import { Smartphone, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/contexts/notification-context";
import { notificationClient } from "@/lib/notification-client";
import { toast } from "sonner";

export default function SmsNotificationsPage() {
  const { channelsConfig, setChannelsConfig } = useNotifications();
  return (
    <SmsForm
      key={JSON.stringify(channelsConfig.sms)}
      initial={channelsConfig.sms}
      channelsConfig={channelsConfig}
      setChannelsConfig={setChannelsConfig}
    />
  );
}

function SmsForm({
  initial,
  channelsConfig,
  setChannelsConfig,
}: {
  initial: {
    enabled: boolean;
    recipient: string;
  };
  channelsConfig: ReturnType<typeof useNotifications>["channelsConfig"];
  setChannelsConfig: ReturnType<typeof useNotifications>["setChannelsConfig"];
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [recipient, setRecipient] = useState(initial.recipient);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    if (enabled && !recipient.trim()) {
      toast.error("Recipient phone number is required when SMS notifications are enabled.");
      return;
    }

    setSaving(true);
    const nextSms = {
      enabled,
      recipient: recipient.trim(),
    };

    const payload = {
      sms_enabled: nextSms.enabled,
      sms_recipient: nextSms.recipient,
    };

    const updated = await notificationClient.patchConfig(payload);

    setChannelsConfig({
      ...channelsConfig,
      sms: nextSms,
    });

    if (updated) {
      toast.success("SMS configuration saved successfully.");
    } else {
      toast.warning("Saved locally; could not reach server. Sign in and save again to use for alerts.");
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!recipient.trim()) {
      toast.error("Enter a recipient phone number first.");
      return;
    }
    setTesting(true);
    const result = await notificationClient.sendTest({ channel: "sms" });
    setTesting(false);

    if (result === null) {
      toast.error("Test request failed. Check you're signed in.");
      return;
    }
    if (result.sms_ok) {
      toast.success("Test SMS sent. Check your phone.");
      return;
    }

    const msg =
      result.sms_error === "no_config"
        ? "Save your SMS settings first, then send a test message."
        : result.sms_error === "sms_disabled"
          ? "Turn on “Enable SMS notifications”, then Save, and try again."
          : result.sms_error === "no_recipient"
            ? "Please specify a default recipient phone number."
            : result.sms_error === "twilio_failed"
              ? "Failed to dispatch SMS via Twilio. Ensure TWILIO_* env vars and phone numbers are correct."
              : "SMS test failed. Ensure settings are correct, save, then try again.";
    toast.error(msg);
  };

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
            Get critical NetSentinel alerts via SMS using your Twilio number.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 ring-1 ring-border/50 p-2 text-foreground">
              <Smartphone className="h-5 w-5" />
            </span>
            SMS integration
          </CardTitle>
          <CardDescription>
            Enable SMS notifications and set the default recipient phone number. Alerts will be sent from
            your configured Twilio number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border-2 border-border bg-muted/80 p-4 space-y-3 shadow-sm">
            <p className="text-sm font-medium text-foreground">Step 1: Enable and save</p>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="sms-enabled" className="text-base font-medium text-foreground">
                  Enable SMS notifications
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Turn the switch on → then click <strong>Save</strong> below.
                </p>
              </div>
              <div className="shrink-0 rounded-full p-1 ring-2 ring-border ring-offset-2 ring-offset-background bg-muted/50">
                <Switch
                  id="sms-enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                  aria-describedby="sms-enabled-desc"
                />
              </div>
            </div>
            <p id="sms-enabled-desc" className="text-xs text-muted-foreground">
              {enabled ? "SMS is on — remember to click Save." : "Switch is off — turn it on, then Save."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-recipient">Default Recipient Phone Number</Label>
              <Input
                id="sms-recipient"
                type="tel"
                placeholder="+15551234567"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use E.164 format (e.g. <code>+15551234567</code>). This number is used for test messages and
                system-wide SMS alerts.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || !recipient.trim()}
              >
                {testing ? "Sending…" : "Send test message"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Save your settings first, then use &quot;Send test message&quot; to verify Twilio SMS delivery.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
