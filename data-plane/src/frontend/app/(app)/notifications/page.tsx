"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, Smartphone, Phone, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/contexts/notification-context";
import { cn } from "@/lib/utils";

const channelCards = [
  {
    title: "Slack",
    description: "Send alerts to Slack channels via webhook.",
    href: "/notifications/slack",
    iconSrc: "/slack.png",
    enabledKey: "slack" as const,
  },
  {
    title: "Discord",
    description: "Send alerts to Discord channels via webhook.",
    href: "/notifications/discord",
    iconSrc: "/discord.png",
    enabledKey: "discord" as const,
  },
  {
    title: "SMS",
    description: "Get critical alerts via SMS. Coming soon.",
    href: "/notifications/sms",
    icon: Smartphone,
    comingSoon: true,
  },
  {
    title: "Voice",
    description: "Receive voice call alerts. Coming soon.",
    href: "/notifications/voice",
    icon: Phone,
    comingSoon: true,
  },
];

export default function NotificationsPage() {
  const { channelsConfig } = useNotifications();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Configure how you receive alerts — Slack, Discord, and more.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Channels
          </CardTitle>
          <CardDescription>
            Choose where to send notifications. Connect Slack or Discord to get started; SMS and voice are coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {channelCards.map((channel) => {
              const key = "enabledKey" in channel ? channel.enabledKey : undefined;
              const enabled = key ? channelsConfig[key]?.enabled : false;
              const iconSrc = "iconSrc" in channel ? channel.iconSrc : undefined;
              const Icon = "icon" in channel ? channel.icon : null;
              return (
                <Link
                  key={channel.href}
                  href={channel.href}
                  className={cn(
                    "flex items-start gap-4 rounded-xl border p-5 transition-colors hover:bg-muted/50",
                    channel.comingSoon && "opacity-75"
                  )}
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/80 ring-1 ring-border/50 p-2.5 mt-0.5">
                    {iconSrc ? (
                      <Image
                        src={iconSrc}
                        alt=""
                        width={28}
                        height={28}
                        className="size-7 object-contain"
                      />
                    ) : Icon ? (
                      <Icon className="size-6 text-muted-foreground" strokeWidth={1.5} />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{channel.title}</span>
                      {channel.comingSoon && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          Coming soon
                        </span>
                      )}
                      {!channel.comingSoon && enabled && (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {channel.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Sound, desktop notifications, do not disturb, and digest options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/notifications/preferences"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Open notification preferences
            <span aria-hidden>→</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
