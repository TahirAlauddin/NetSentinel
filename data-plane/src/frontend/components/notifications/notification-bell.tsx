"use client";

import Link from "next/link";
import { useContext } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationContext } from "@/contexts/notification-context";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    return (
      <Link
        href="/notifications"
        className="relative p-2 rounded-md text-white/90 hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
      </Link>
    );
  }
  const { notifications, unreadCount, markAsRead, markAllAsRead } = ctx;
  const recent = notifications.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative p-2 rounded-md text-white/90 hover:bg-white/10 hover:text-white transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 sm:w-96 p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {recent.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link ?? "/notifications"}
                    className={cn(
                      "block px-4 py-3 hover:bg-muted/50 transition-colors",
                      !n.read && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex gap-2">
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
                        <p className="font-medium text-sm truncate">{n.title}</p>
                        {n.message && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {n.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border px-4 py-2">
          <Link
            href="/notifications"
            className="text-sm font-medium text-primary hover:underline block text-center py-1"
          >
            View all &amp; configure
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
