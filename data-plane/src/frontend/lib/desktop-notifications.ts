/**
 * Browser desktop (native OS) notifications for in-app alerts.
 * Requires user permission; respects notification preferences and do-not-disturb.
 */

import type { NotificationPreferences, NotificationItem } from "@/types/notifications";

const DEFAULT_ICON = "/favicon.ico";

/** Check if the Web Notifications API is available. */
export function isDesktopNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Current permission: "granted" | "denied" | "default". */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isDesktopNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/** Request permission from the user. Call when user enables desktop notifications. */
export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isDesktopNotificationSupported()) return Promise.resolve("denied");
  if (Notification.permission !== "default") return Promise.resolve(Notification.permission);
  return Notification.requestPermission();
}

/** Parse "HH:mm" to minutes since midnight for comparison. */
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Check if current time is inside the do-not-disturb window (inclusive of start, exclusive of end). */
export function isInDoNotDisturb(preferences: NotificationPreferences, now: Date = new Date()): boolean {
  if (!preferences.doNotDisturbEnabled || !preferences.doNotDisturbStart || !preferences.doNotDisturbEnd) {
    return false;
  }
  const start = parseTimeToMinutes(preferences.doNotDisturbStart);
  const end = parseTimeToMinutes(preferences.doNotDisturbEnd);
  const current = now.getHours() * 60 + now.getMinutes();
  if (start <= end) return current >= start && current < end;
  return current >= start || current < end; // overnight window
}

/** Whether we are allowed to show a desktop notification (prefs + permission + not DND). */
export function canShowDesktopNotification(preferences: NotificationPreferences): boolean {
  if (!preferences.desktopNotifications) return false;
  if (!isDesktopNotificationSupported() || Notification.permission !== "granted") return false;
  if (isInDoNotDisturb(preferences)) return false;
  return true;
}

/** Show a single desktop notification. Call only when canShowDesktopNotification is true. */
export function showDesktopNotification(
  item: NotificationItem,
  options?: { icon?: string; onClick?: () => void }
): void {
  if (!isDesktopNotificationSupported() || Notification.permission !== "granted") return;
  const n = new Notification(item.title, {
    body: item.message ?? undefined,
    icon: options?.icon ?? DEFAULT_ICON,
    tag: item.id,
  });
  n.onclick = () => {
    n.close();
    if (item.link && typeof window !== "undefined") {
      window.focus();
      window.location.href = item.link;
    }
    options?.onClick?.();
  };
}
