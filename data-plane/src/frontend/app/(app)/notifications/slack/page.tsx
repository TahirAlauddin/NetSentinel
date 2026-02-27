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

  const handleSave = () => {
    if (enabled && !webhookUrl.trim()) {
      toast.error("Webhook URL is required when Slack is enabled.");
      return;
    }
    setSaving(true);
    setChannelsConfig({
      ...channelsConfig,
      slack: {
        enabled,
        webhookUrl: webhookUrl.trim(),
        defaultChannel: defaultChannel.trim() || undefined,
      },
    });
    setSaving(false);
    toast.success("Slack settings saved.");
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
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="slack-enabled">Enable Slack notifications</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, alerts will be sent to your webhook URL.
              </p>
            </div>
            <Switch
              id="slack-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
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

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
