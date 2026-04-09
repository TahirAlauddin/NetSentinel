"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Smartphone, Settings, Loader2, Inbox, Mail, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/notification-context";
import { notificationClient } from "@/lib/notification-client";
import type { InAppNotificationDto, NotificationItem } from "@/types/notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const channelCards = [
  {
    title: "Email",
    description: "Send alerts via SMTP to your email inbox.",
    href: "/notifications/email",
    icon: Mail,
    enabledKey: "email" as const,
  },
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
];

const LIST_LIMIT = 50;

function dtoToItem(dto: InAppNotificationDto): NotificationItem {
  return {
    id: String(dto.id),
    title: dto.title,
    message: dto.message || undefined,
    type: dto.type,
    read: dto.read,
    createdAt: dto.created_at,
    link: dto.link || undefined,
  };
}

/** Sort: unread first, then by createdAt desc */
function sortUnreadFirst(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function NotificationRow({
  n,
  onMarkRead,
  onMarkUnread,
}: {
  n: NotificationItem;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
}) {
  const content = (
    <>
      <span
        className={cn(
          "shrink-0 w-2 h-2 rounded-full mt-1.5",
          n.type === "error" && "bg-destructive",
          n.type === "warning" && "bg-amber-500",
          n.type === "success" && "bg-green-500",
          n.type === "info" && "bg-primary"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{n.title}</p>
        {n.message && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>
    </>
  );

  return (
    <li
      className={cn(
        "flex gap-3 items-start px-4 py-3 hover:bg-muted/50 transition-colors rounded-md",
        !n.read && "bg-primary/5"
      )}
    >
      {n.link ? (
        <Link href={n.link} className="flex gap-3 min-w-0 flex-1">
          {content}
        </Link>
      ) : (
        <div className="flex gap-3 min-w-0 flex-1">{content}</div>
      )}
      <div className="shrink-0">
        {n.read ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => onMarkUnread(n.id)}
          >
            Mark unread
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => onMarkRead(n.id)}
          >
            Mark read
          </Button>
        )}
      </div>
    </li>
  );
}

export default function NotificationsPage() {
  const { channelsConfig, markAsRead, markAsUnread, markAllAsRead } = useNotifications();
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    notificationClient
      .getAll({ limit: LIST_LIMIT })
      .then((data) => {
        if (!cancelled) setList(data.map(dtoToItem));
      })
      .catch(() => {
        if (!cancelled) setList([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedList = useMemo(() => sortUnreadFirst(list), [list]);

  const handleMarkRead = useCallback(
    (id: string) => {
      markAsRead(id);
      setList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [markAsRead]
  );

  const handleMarkUnread = useCallback(
    (id: string) => {
      markAsUnread(id);
      setList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    },
    [markAsUnread]
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [markAllAsRead]);

  const unreadCount = list.filter((n) => !n.read).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Configure how you receive alerts — Email, Slack, Discord, and more.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Inbox
          </CardTitle>
          <CardDescription>
            Recent alerts. Unread at the top — mark items read or unread as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No notifications yet. Alerts from the system will appear here.
            </p>
          ) : (
            <>
              {unreadCount > 0 && (
                <div className="flex justify-end mb-2">
                  <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                    Mark all read
                  </Button>
                </div>
              )}
              <div className="min-h-[200px] max-h-[min(60vh,500px)] overflow-y-auto">
                <ul className="divide-y divide-border rounded-md border">
                {sortedList.map((n) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    onMarkRead={handleMarkRead}
                    onMarkUnread={handleMarkUnread}
                  />
                ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Channels
          </CardTitle>
          <CardDescription>
            Choose where to send notifications. Connect Email, Slack, or Discord to get started.
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
                    "flex items-start gap-4 rounded-xl border p-5 transition-colors hover:bg-muted/50 group",
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
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground mt-1 group-hover:text-foreground transition-colors" aria-hidden />
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
