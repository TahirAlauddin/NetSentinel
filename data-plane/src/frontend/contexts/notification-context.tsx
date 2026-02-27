"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type {
  NotificationItem,
  NotificationChannelsConfig,
  NotificationPreferences,
} from "@/types/notifications";
import {
  DEFAULT_CHANNELS_CONFIG,
  DEFAULT_PREFERENCES,
} from "@/types/notifications";

const STORAGE_KEYS = {
  channels: "netsentinel_notification_channels",
  preferences: "netsentinel_notification_preferences",
  notifications: "netsentinel_notifications_list",
} as const;

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

/** Mock recent notifications for UI; replace with API later */
function mockNotifications(): NotificationItem[] {
  return [
    {
      id: "1",
      title: "Subnet threshold warning",
      message: "Subnet 10.0.1.0/24 is at 85% utilization",
      type: "warning",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      link: "/ipam/subnets",
    },
    {
      id: "2",
      title: "Device offline",
      message: "Router core-01 has been unreachable for 2 minutes",
      type: "error",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      link: "/ipam/devices",
    },
    {
      id: "3",
      title: "Backup completed",
      message: "Nightly config backup finished successfully",
      type: "success",
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  ];
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  channelsConfig: NotificationChannelsConfig;
  preferences: NotificationPreferences;
  setChannelsConfig: (config: NotificationChannelsConfig) => void;
  setPreferences: (prefs: NotificationPreferences) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  playNotificationSound: () => void;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadJson(STORAGE_KEYS.notifications, mockNotifications())
  );
  const [channelsConfig, setChannelsConfigState] = useState<NotificationChannelsConfig>(
    () => loadJson(STORAGE_KEYS.channels, DEFAULT_CHANNELS_CONFIG)
  );
  const [preferences, setPreferencesState] = useState<NotificationPreferences>(() =>
    loadJson(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES)
  );

  const setChannelsConfig = useCallback((config: NotificationChannelsConfig) => {
    setChannelsConfigState(config);
    saveJson(STORAGE_KEYS.channels, config);
  }, []);

  const setPreferences = useCallback((prefs: NotificationPreferences) => {
    setPreferencesState(prefs);
    saveJson(STORAGE_KEYS.preferences, prefs);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveJson(STORAGE_KEYS.notifications, updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveJson(STORAGE_KEYS.notifications, updated);
      return updated;
    });
  }, []);

  const playNotificationSound = useCallback(() => {
    if (typeof window === "undefined" || !preferences.soundEnabled) return;
    try {
      // File in public/ is served from root: use /notifications.mp3.mpeg (or rename to notification.mp3)
      const audio = new Audio("/notifications.mp3.mpeg");
      audio.volume = preferences.soundVolume / 100;
      audio.play().catch(() => {});
    } catch {
      // no sound
    }
  }, [preferences.soundEnabled, preferences.soundVolume]);

  const value: NotificationContextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      channelsConfig,
      preferences,
      setChannelsConfig,
      setPreferences,
      markAsRead,
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
