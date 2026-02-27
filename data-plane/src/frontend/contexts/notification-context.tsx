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
import { api } from "@/lib/utils";

const STORAGE_KEYS = {
  channels: "netsentinel_notification_channels",
  preferences: "netsentinel_notification_preferences",
  readIds: "netsentinel_notification_read_ids",
} as const;

const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

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

function loadReadIds(): Set<string> {
  const arr = loadJson<string[]>(STORAGE_KEYS.readIds, []);
  return new Set(Array.isArray(arr) ? arr : []);
}

function saveReadIds(ids: Set<string>): void {
  saveJson(STORAGE_KEYS.readIds, Array.from(ids));
}

function dtoToItem(dto: InAppNotificationDto, read: boolean): NotificationItem {
  return {
    id: String(dto.id),
    title: dto.title,
    message: dto.message || undefined,
    type: dto.type,
    read,
    createdAt: dto.created_at,
    link: dto.link || undefined,
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
  markAllAsRead: () => void;
  playNotificationSound: () => void;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

const IN_APP_ENDPOINT = "/notifications/in-app/";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const [channelsConfig, setChannelsConfigState] = useState<NotificationChannelsConfig>(
    () => loadJson(STORAGE_KEYS.channels, DEFAULT_CHANNELS_CONFIG)
  );
  const [preferences, setPreferencesState] = useState<NotificationPreferences>(() =>
    loadJson(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES)
  );

  const mergeWithReadState = useCallback((dtos: InAppNotificationDto[]): NotificationItem[] => {
    const readIds = loadReadIds();
    return dtos.map((dto) => dtoToItem(dto, readIds.has(String(dto.id))));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.get<InAppNotificationDto[]>(IN_APP_ENDPOINT, { requireAuth: true });
        if (cancelled) return;
        const data = res.data ?? (Array.isArray(res) ? (res as InAppNotificationDto[]) : []);
        const list = Array.isArray(data) ? data : [];
        setNotifications(mergeWithReadState(list));
        list.forEach((dto) => knownIdsRef.current.add(String(dto.id)));
      } catch {
        // keep existing list on error
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mergeWithReadState]);

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
    const readIds = loadReadIds();
    readIds.add(id);
    saveReadIds(readIds);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const readIds = loadReadIds();
      prev.forEach((n) => readIds.add(n.id));
      saveReadIds(readIds);
      return prev.map((n) => ({ ...n, read: true }));
    });
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
  useEffect(() => {
    playSoundRef.current = playNotificationSound;
  }, [playNotificationSound]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get<InAppNotificationDto[]>(IN_APP_ENDPOINT, { requireAuth: true });
        const data = res.data ?? (Array.isArray(res) ? (res as InAppNotificationDto[]) : []);
        const list = Array.isArray(data) ? data : [];
        const merged = mergeWithReadState(list);
        const prevIds = knownIdsRef.current;
        const hasNewUnread = merged.some((n) => !n.read && !prevIds.has(n.id));
        list.forEach((dto) => prevIds.add(String(dto.id)));
        setNotifications(merged);
        if (hasNewUnread) {
          playSoundRef.current();
        }
      } catch {
        // keep existing list
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [mergeWithReadState]);

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
