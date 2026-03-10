"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  InAppNotificationDto,
  NotificationItem,
  NotificationChannelsConfig,
  NotificationPreferences,
} from "@/types/notifications";
import {
  DEFAULT_CHANNELS_CONFIG,
  DEFAULT_PREFERENCES,
} from "@/types/notifications";
import type { BackendNotificationConfig } from "@/lib/notification-client";
import { notificationClient } from "@/lib/notification-client";
import {
  canShowDesktopNotification,
  showDesktopNotification,
  isInDoNotDisturb,
} from "@/lib/desktop-notifications";

const STORAGE_KEYS = {
  channels: "netsentinel_notification_channels",
  preferences: "netsentinel_notification_preferences",
} as const;

const POLL_INTERVAL_MS = 60 * 1000; // 1 minute
/** Fetch up to this many unread so the badge shows the real count; bell dropdown shows first 5. */
const UNREAD_FETCH_LIMIT = 100;

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

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

function backendConfigToChannels(b: BackendNotificationConfig): NotificationChannelsConfig {
  return {
    slack: {
      enabled: b.slack_enabled,
      webhookUrl: b.slack_webhook_url ?? "",
      defaultChannel: b.slack_default_channel?.trim() || undefined,
    },
    discord: {
      enabled: b.discord_enabled,
      webhookUrl: b.discord_webhook_url ?? "",
    },
    email: {
      enabled: b.email_enabled ?? false,
      recipient: b.email_recipient ?? "",
    },
  };
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  channelsConfig: NotificationChannelsConfig;
  preferences: NotificationPreferences;
  setChannelsConfig: (config: NotificationChannelsConfig) => void;
  setPreferences: (prefs: NotificationPreferences) => void;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllAsRead: () => void;
  playNotificationSound: () => void;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const [channelsConfig, setChannelsConfigState] = useState<NotificationChannelsConfig>(
    () => loadJson(STORAGE_KEYS.channels, DEFAULT_CHANNELS_CONFIG)
  );
  const [preferences, setPreferencesState] = useState<NotificationPreferences>(() =>
    loadJson(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES)
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await notificationClient.getUnread({ limit: UNREAD_FETCH_LIMIT });
        if (cancelled) return;
        setNotifications(list.map(dtoToItem));
        list.forEach((dto) => knownIdsRef.current.add(String(dto.id)));
      } catch {
        // keep existing list on error
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hydrate channels config from backend so UI and backend stay in sync (e.g. webhook URLs used for alerts)
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const backend = await notificationClient.getConfig();
        if (cancelled || !backend) return;
        const config = backendConfigToChannels(backend);
        setChannelsConfigState(config);
        saveJson(STORAGE_KEYS.channels, config);
      } catch {
        // keep existing config (e.g. from localStorage) on error
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setChannelsConfig = useCallback((config: NotificationChannelsConfig) => {
    setChannelsConfigState(config);
    saveJson(STORAGE_KEYS.channels, config);
  }, []);

  const setPreferences = useCallback((prefs: NotificationPreferences) => {
    setPreferencesState(prefs);
    saveJson(STORAGE_KEYS.preferences, prefs);
  }, []);

  const unreadCount = useMemo(() => notifications.length, [notifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationClient.markRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  }, []);

  const markAsUnread = useCallback(async (id: string) => {
    try {
      await notificationClient.markUnread(id);
      const list = await notificationClient.getUnread({ limit: UNREAD_FETCH_LIMIT });
      setNotifications(list.map(dtoToItem));
      list.forEach((dto) => knownIdsRef.current.add(String(dto.id)));
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationClient.markAllRead();
      setNotifications([]);
    } catch {
      // ignore
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (typeof window === "undefined" || !preferences.soundEnabled) return;
    try {
      const audio = new Audio("/notifications.mp3.mpeg");
      audio.volume = preferences.soundVolume / 100;
      audio.play().catch(() => {});
    } catch {
      // no sound
    }
  }, [preferences.soundEnabled, preferences.soundVolume]);

  const playSoundRef = useRef(playNotificationSound);
  const preferencesRef = useRef(preferences);
  useEffect(() => {
    playSoundRef.current = playNotificationSound;
  }, [playNotificationSound]);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const list = await notificationClient.getUnread({ limit: UNREAD_FETCH_LIMIT });
        const prevIds = knownIdsRef.current;
        const newItems = list.filter((dto) => !prevIds.has(String(dto.id)));
        const hasNewUnread = newItems.length > 0;
        list.forEach((dto) => prevIds.add(String(dto.id)));
        setNotifications(list.map(dtoToItem));
        if (hasNewUnread) {
          const prefs = preferencesRef.current;
          if (!isInDoNotDisturb(prefs)) {
            playSoundRef.current();
          }
          if (canShowDesktopNotification(prefs)) {
            newItems.forEach((dto) => showDesktopNotification(dtoToItem(dto)));
          }
        }
      } catch {
        // keep existing list
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const value: NotificationContextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      channelsConfig,
      preferences,
      setChannelsConfig,
      setPreferences,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      playNotificationSound,
    }),
    [
      notifications,
      unreadCount,
      channelsConfig,
      preferences,
      setChannelsConfig,
      setPreferences,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      playNotificationSound,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
