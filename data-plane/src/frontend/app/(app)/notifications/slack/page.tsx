"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/contexts/notification-context";
import { notificationClient } from "@/lib/notification-client";
import { toast } from "sonner";

export default function SlackNotificationsPage() {
  const { channelsConfig, setChannelsConfig } = useNotifications();
  return (
    <SlackForm
      key={JSON.stringify(channelsConfig.slack)}
      initial={channelsConfig.slack}
      channelsConfig={channelsConfig}
      setChannelsConfig={setChannelsConfig}
    />
  );
}

function SlackForm({
  initial,
  channelsConfig,
  setChannelsConfig,
}: {
  initial: { webhookUrl: string; defaultChannel?: string; enabled: boolean };
  channelsConfig: ReturnType<typeof useNotifications>["channelsConfig"];
  setChannelsConfig: ReturnType<typeof useNotifications>["setChannelsConfig"];
}) {
  const [webhookUrl, setWebhookUrl] = useState(initial.webhookUrl);
  const [defaultChannel, setDefaultChannel] = useState(initial.defaultChannel ?? "");
  const [enabled, setEnabled] = useState(initial.enabled);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    if (enabled && !webhookUrl.trim()) {
      toast.error("Webhook URL is required when Slack is enabled.");
      return;
    }
    setSaving(true);
    const nextSlack = {
      enabled,
      webhookUrl: webhookUrl.trim(),
      defaultChannel: defaultChannel.trim() || undefined,
    };
    const updated = await notificationClient.patchConfig({
      slack_enabled: nextSlack.enabled,
      slack_webhook_url: nextSlack.webhookUrl,
      slack_default_channel: nextSlack.defaultChannel ?? "",
    });
    setChannelsConfig({
      ...channelsConfig,
      slack: nextSlack,
    });
    if (updated) {
      toast.success("Slack settings saved. Alerts will use this webhook.");
    } else {
      toast.warning("Saved locally; could not reach server. Sign in and save again to use for alerts.");
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!webhookUrl.trim()) {
      toast.error("Enter a webhook URL first.");
      return;
    }
    setTesting(true);
    const result = await notificationClient.sendTest({ channel: "slack" });
    setTesting(false);
    if (result === null) {
      toast.error("Test request failed. Check you're signed in.");
      return;
    }
    if (result.slack_ok) {
      toast.success("Test message sent. Check your Slack channel.");
      return;
    }
    const msg =
      result.slack_error === "no_config"
        ? "Save your Slack settings first, then send a test message."
        : result.slack_error === "slack_disabled"
          ? "Turn on “Enable Slack notifications”, then Save, and try again."
          : result.slack_error === "no_webhook"
            ? "Enter a webhook URL and Save, then try again."
            : result.slack_error === "webhook_failed"
              ? "Slack rejected the message. Check that the webhook URL is correct and the app is allowed in the channel."
              : "Slack test failed. Enable Slack, save, then try again.";
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
          <h1 className="text-3xl font-bold tracking-tight">Slack</h1>
          <p className="text-muted-foreground mt-1">
            Send NetSentinel alerts to a Slack channel via an incoming webhook.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 ring-1 ring-border/50 p-2">
              <Image src="/slack.png" alt="" width={24} height={24} className="size-6 object-contain" />
            </span>
            Slack integration
          </CardTitle>
          <CardDescription>
            Create an incoming webhook in your Slack workspace and paste the URL below. Alerts will be posted to that channel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border-2 border-border bg-muted/80 p-4 space-y-3 shadow-sm">
            <p className="text-sm font-medium text-foreground">Step 1: Enable and save</p>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="slack-enabled" className="text-base font-medium text-foreground">
                  Enable Slack notifications
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Turn the switch on → then click <strong>Save</strong> below.
                </p>
              </div>
              <div className="shrink-0 rounded-full p-1 ring-2 ring-border ring-offset-2 ring-offset-background bg-muted/50">
                <Switch
                  id="slack-enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                  aria-describedby="slack-enabled-desc"
                />
              </div>
            </div>
            <p id="slack-enabled-desc" className="text-xs text-muted-foreground">
              {enabled ? "Slack is on — remember to click Save." : "Switch is off — turn it on, then Save."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slack-webhook">Webhook URL</Label>
            <Input
              id="slack-webhook"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              In Slack: Settings → Integrations → Incoming Webhooks → Add to Slack.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slack-channel">Default channel (optional)</Label>
            <Input
              id="slack-channel"
              type="text"
              placeholder="#alerts"
              value={defaultChannel}
              onChange={(e) => setDefaultChannel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Channel name for display; webhook already targets a specific channel.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || !webhookUrl.trim()}
              >
                {testing ? "Sending…" : "Send test message"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Save your settings first, then use &quot;Send test message&quot; to post a test alert to your channel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
