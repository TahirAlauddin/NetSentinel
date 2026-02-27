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

export default function DiscordNotificationsPage() {
  const { channelsConfig, setChannelsConfig } = useNotifications();
  return (
    <DiscordForm
      key={JSON.stringify(channelsConfig.discord)}
      initial={channelsConfig.discord}
      channelsConfig={channelsConfig}
      setChannelsConfig={setChannelsConfig}
    />
  );
}

function DiscordForm({
  initial,
  channelsConfig,
  setChannelsConfig,
}: {
  initial: { webhookUrl: string; enabled: boolean };
  channelsConfig: ReturnType<typeof useNotifications>["channelsConfig"];
  setChannelsConfig: ReturnType<typeof useNotifications>["setChannelsConfig"];
}) {
  const [webhookUrl, setWebhookUrl] = useState(initial.webhookUrl);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (enabled && !webhookUrl.trim()) {
      toast.error("Webhook URL is required when Discord is enabled.");
      return;
    }
    setSaving(true);
    setChannelsConfig({
      ...channelsConfig,
      discord: {
        enabled,
        webhookUrl: webhookUrl.trim(),
      },
    });
    setSaving(false);
    toast.success("Discord settings saved.");
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
          <h1 className="text-3xl font-bold tracking-tight">Discord</h1>
          <p className="text-muted-foreground mt-1">
            Send NetSentinel alerts to a Discord channel via a webhook.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 ring-1 ring-border/50 p-2">
              <Image src="/discord.png" alt="" width={24} height={24} className="size-6 object-contain" />
            </span>
            Discord integration
          </CardTitle>
          <CardDescription>
            Create a webhook in your Discord server (Channel Settings → Integrations → Webhooks) and paste the URL below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="discord-enabled">Enable Discord notifications</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, alerts will be sent to your webhook URL.
              </p>
            </div>
            <Switch
              id="discord-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discord-webhook">Webhook URL</Label>
            <Input
              id="discord-webhook"
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Server → Channel → Edit Channel → Integrations → Webhooks → New Webhook → Copy URL.
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
