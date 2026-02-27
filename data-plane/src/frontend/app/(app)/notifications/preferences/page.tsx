"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2, Monitor, Moon, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useNotifications } from "@/contexts/notification-context";
import { toast } from "sonner";

function formStateFromPreferences(preferences: ReturnType<typeof useNotifications>["preferences"]) {
  return {
    soundEnabled: preferences.soundEnabled,
    soundVolume: preferences.soundVolume,
    desktopNotifications: preferences.desktopNotifications,
    doNotDisturbEnabled: preferences.doNotDisturbEnabled,
    doNotDisturbStart: preferences.doNotDisturbStart ?? "22:00",
    doNotDisturbEnd: preferences.doNotDisturbEnd ?? "08:00",
    digestEnabled: preferences.digestEnabled,
    digestFrequency: preferences.digestFrequency,
  };
}

export default function NotificationPreferencesPage() {
  const { preferences, setPreferences, playNotificationSound } = useNotifications();
  return (
    <NotificationPreferencesForm
      key={JSON.stringify(preferences)}
      initialPreferences={preferences}
      setPreferences={setPreferences}
      playNotificationSound={playNotificationSound}
    />
  );
}

function NotificationPreferencesForm({
  initialPreferences,
  setPreferences,
  playNotificationSound,
}: {
  initialPreferences: ReturnType<typeof useNotifications>["preferences"];
  setPreferences: ReturnType<typeof useNotifications>["setPreferences"];
  playNotificationSound: () => void;
}) {
  const [form, setForm] = useState(() => formStateFromPreferences(initialPreferences));
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setPreferences(form);
    setSaving(false);
    toast.success("Preferences saved.");
  };

  const handleTestSound = () => {
    playNotificationSound();
    toast.success("Playing notification sound.");
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
          <h1 className="text-3xl font-bold tracking-tight">Notification preferences</h1>
          <p className="text-muted-foreground mt-1">
            Sound, desktop alerts, do not disturb, and digest.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sound
          </CardTitle>
          <CardDescription>
            Play a sound when new notifications arrive. Volume applies to in-app sounds only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sound-enabled">Enable notification sound</Label>
              <p className="text-sm text-muted-foreground">
                Play a sound when a new notification is received.
              </p>
            </div>
            <Switch
              id="sound-enabled"
              checked={form.soundEnabled}
              onCheckedChange={(v) => setForm((p) => ({ ...p, soundEnabled: v }))}
            />
          </div>
          {form.soundEnabled && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-start">
                <Label htmlFor="sound-volume">Volume</Label>
                <span className="text-sm text-muted-foreground">{form.soundVolume}%</span>
              </div>
              <Slider
                id="sound-volume"
                className="w-48 max-w-full"
                min={0}
                max={100}
                step={1}
                value={[form.soundVolume]}
                onValueChange={([v]) => setForm((p) => ({ ...p, soundVolume: v ?? 0 }))}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestSound}
              >
                Test sound
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Desktop notifications
          </CardTitle>
          <CardDescription>
            Show browser desktop notifications when you receive alerts (requires permission).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="desktop-enabled">Enable desktop notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show native OS notifications when the app is in the background.
              </p>
            </div>
            <Switch
              id="desktop-enabled"
              checked={form.desktopNotifications}
              onCheckedChange={(v) => setForm((p) => ({ ...p, desktopNotifications: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Do not disturb
          </CardTitle>
          <CardDescription>
            Pause sound and optional desktop notifications during a time window.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dnd-enabled">Enable do not disturb</Label>
              <p className="text-sm text-muted-foreground">
                Mute notification sound (and optionally desktop) during the set hours.
              </p>
            </div>
            <Switch
              id="dnd-enabled"
              checked={form.doNotDisturbEnabled}
              onCheckedChange={(v) => setForm((p) => ({ ...p, doNotDisturbEnabled: v }))}
            />
          </div>
          {form.doNotDisturbEnabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dnd-start">Start time</Label>
                <Input
                  id="dnd-start"
                  type="time"
                  value={form.doNotDisturbStart}
                  onChange={(e) => setForm((p) => ({ ...p, doNotDisturbStart: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dnd-end">End time</Label>
                <Input
                  id="dnd-end"
                  type="time"
                  value={form.doNotDisturbEnd}
                  onChange={(e) => setForm((p) => ({ ...p, doNotDisturbEnd: e.target.value }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Digest
          </CardTitle>
          <CardDescription>
            Receive a summary of notifications by email (when backend is configured).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="digest-enabled">Enable digest</Label>
              <p className="text-sm text-muted-foreground">
                Get a periodic summary instead of real-time alerts for non-urgent items.
              </p>
            </div>
            <Switch
              id="digest-enabled"
              checked={form.digestEnabled}
              onCheckedChange={(v) => setForm((p) => ({ ...p, digestEnabled: v }))}
            />
          </div>
          {form.digestEnabled && (
            <div className="space-y-2">
              <Label htmlFor="digest-frequency">Frequency</Label>
              <Select
                value={form.digestFrequency}
                onValueChange={(v: "daily" | "weekly" | "off") =>
                  setForm((p) => ({ ...p, digestFrequency: v }))
                }
              >
                <SelectTrigger id="digest-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save preferences"}
      </Button>
    </div>
  );
}
