/** Single in-app notification (e.g. in the bell dropdown) */
export interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  type: "info" | "warning" | "error" | "success";
  read: boolean;
  createdAt: string; // ISO
  link?: string;
}

/** In-app notification as returned by the API (read is per current user from backend) */
export interface InAppNotificationDto {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  link: string;
  created_at: string; // ISO
  read: boolean;
}

/** Channel type for delivery */
export type NotificationChannelType = "slack" | "discord" | "email" | "sms";

/** Per-channel configuration */
export interface SlackChannelConfig {
  enabled: boolean;
  webhookUrl: string;
  defaultChannel?: string;
}

export interface DiscordChannelConfig {
  enabled: boolean;
  webhookUrl: string;
}

export interface EmailChannelConfig {
  enabled: boolean;
  recipient: string;
}

export interface NotificationChannelsConfig {
  slack: SlackChannelConfig;
  discord: DiscordChannelConfig;
  email: EmailChannelConfig;
  // sms: coming soon, no config yet
}

/** User preferences for notification behavior (sound, desktop, etc.) */
export interface NotificationPreferences {
  soundEnabled: boolean;
  soundVolume: number; // 0-100
  desktopNotifications: boolean;
  doNotDisturbEnabled: boolean;
  doNotDisturbStart?: string; // HH:mm
  doNotDisturbEnd?: string;   // HH:mm
  digestEnabled: boolean;     // daily/weekly digest
  digestFrequency: "daily" | "weekly" | "off";
}

/** Min/max limit for in-app notification list requests (backend enforced). */
export const NOTIFICATION_LIMIT_MIN = 1;
export const NOTIFICATION_LIMIT_MAX = 100;
/** Default limit for unread-only (e.g. bell dropdown). */
export const NOTIFICATION_LIMIT_DEFAULT_UNREAD = 20;
/** Default limit for all notifications (e.g. history). */
export const NOTIFICATION_LIMIT_DEFAULT_ALL = 50;

export const DEFAULT_CHANNELS_CONFIG: NotificationChannelsConfig = {
  slack: { enabled: false, webhookUrl: "", defaultChannel: undefined },
  discord: { enabled: false, webhookUrl: "" },
  email: {
    enabled: false,
    recipient: "",
  },
};

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  soundVolume: 70,
  desktopNotifications: true,
  doNotDisturbEnabled: false,
  doNotDisturbStart: "22:00",
  doNotDisturbEnd: "08:00",
  digestEnabled: false,
  digestFrequency: "off",
};
