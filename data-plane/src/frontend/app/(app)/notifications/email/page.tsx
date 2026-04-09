"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/contexts/notification-context";
import { notificationClient } from "@/lib/notification-client";
import { toast } from "sonner";

export default function EmailNotificationsPage() {
  const { channelsConfig, setChannelsConfig } = useNotifications();
  return (
    <EmailForm
      key={JSON.stringify(channelsConfig.email)}
      initial={channelsConfig.email}
      channelsConfig={channelsConfig}
      setChannelsConfig={setChannelsConfig}
    />
  );
}

function EmailForm({
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
      toast.error("Recipient Email is required when Email notifications are enabled.");
      return;
    }
    
    setSaving(true);
    const nextEmail = {
      enabled,
      recipient: recipient.trim(),
    };
    
    const payload = {
      email_enabled: nextEmail.enabled,
      email_recipient: nextEmail.recipient,
    };

    const updated = await notificationClient.patchConfig(payload);
    
    setChannelsConfig({
      ...channelsConfig,
      email: nextEmail,
    });
    
    if (updated) {
      toast.success("Email configuration saved successfully.");
    } else {
      toast.warning("Saved locally; could not reach server. Sign in and save again to use for alerts.");
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!recipient.trim()) {
      toast.error("Enter a recipient email first.");
      return;
    }
    setTesting(true);
    const result = await notificationClient.sendTest({ channel: "email" });
    setTesting(false);
    
    if (result === null) {
      toast.error("Test request failed. Check you're signed in.");
      return;
    }
    if (result.email_ok) {
      toast.success("Test email sent. Check your inbox.");
      return;
    }
    
    const msg =
      result.email_error === "no_config"
        ? "Save your Email settings first, then send a test message."
        : result.email_error === "email_disabled"
          ? "Turn on “Enable Email notifications”, then Save, and try again."
          : result.email_error === "no_recipient"
            ? "Please specify a default recipient email."
            : result.email_error === "smtp_failed"
              ? "Failed to dispatch email. Ensure server's underlying SMTP settings (env variables) are correct."
              : "Email test failed. Ensure settings are correct, save, then try again.";
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
          <h1 className="text-3xl font-bold tracking-tight">Email</h1>
          <p className="text-muted-foreground mt-1">
            Send NetSentinel alerts to your inbox via email.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 ring-1 ring-border/50 p-2 text-foreground">
              <Mail className="h-5 w-5" />
            </span>
            Email integration
          </CardTitle>
          <CardDescription>
            Enable email notifications and set the default recipient. Alerts will be sent to that address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border-2 border-border bg-muted/80 p-4 space-y-3 shadow-sm">
            <p className="text-sm font-medium text-foreground">Step 1: Enable and save</p>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="email-enabled" className="text-base font-medium text-foreground">
                  Enable Email notifications
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Turn the switch on → then click <strong>Save</strong> below.
                </p>
              </div>
              <div className="shrink-0 rounded-full p-1 ring-2 ring-border ring-offset-2 ring-offset-background bg-muted/50">
                <Switch
                  id="email-enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                  aria-describedby="email-enabled-desc"
                />
              </div>
            </div>
            <p id="email-enabled-desc" className="text-xs text-muted-foreground">
              {enabled ? "Email is on — remember to click Save." : "Switch is off — turn it on, then Save."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-recipient">Default Recipient Email Address</Label>
              <Input
                id="email-recipient"
                type="email"
                placeholder="admin@example.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Fallback recipient used for test messages and system-wide notifications.
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
              Save your settings first, then use &quot;Send test message&quot; to verify the configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}