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
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    if (enabled && !webhookUrl.trim()) {
      toast.error("Webhook URL is required when Discord is enabled.");
      return;
    }
    setSaving(true);
    const nextDiscord = { enabled, webhookUrl: webhookUrl.trim() };
    const updated = await notificationClient.patchConfig({
      discord_enabled: nextDiscord.enabled,
      discord_webhook_url: nextDiscord.webhookUrl,
    });
    setChannelsConfig({
      ...channelsConfig,
      discord: nextDiscord,
    });
    if (updated) {
      toast.success("Discord settings saved. Alerts will use this webhook.");
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
    const result = await notificationClient.sendTest({ channel: "discord" });
    setTesting(false);
    if (result === null) {
      toast.error("Test request failed. Check you're signed in.");
      return;
    }
    if (result.discord_ok) {
      toast.success("Test message sent. Check your Discord channel.");
      return;
    }
    const msg =
      result.discord_error === "no_config"
        ? "Save your Discord settings first, then send a test message."
        : result.discord_error === "discord_disabled"
          ? "Turn on “Enable Discord notifications”, then Save, and try again."
          : result.discord_error === "no_webhook"
            ? "Enter a webhook URL and Save, then try again."
            : result.discord_error === "webhook_failed"
              ? "Discord rejected the message. Check that the webhook URL is correct."
              : "Discord test failed. Enable Discord, save, then try again.";
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
