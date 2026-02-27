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

/** In-app notification as returned by the API */
export interface InAppNotificationDto {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  link: string;
  created_at: string; // ISO
}

/** Channel type for delivery */
export type NotificationChannelType = "slack" | "discord" | "sms" | "voice";

/** Per-channel configuration (Slack/Discord for now) */
export interface SlackChannelConfig {
  enabled: boolean;
  webhookUrl: string;
  defaultChannel?: string;
}

export interface DiscordChannelConfig {
  enabled: boolean;
  webhookUrl: string;
}

export interface NotificationChannelsConfig {
  slack: SlackChannelConfig;
  discord: DiscordChannelConfig;
  // sms / voice: coming soon, no config yet
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

export const DEFAULT_CHANNELS_CONFIG: NotificationChannelsConfig = {
  slack: { enabled: false, webhookUrl: "", defaultChannel: undefined },
  discord: { enabled: false, webhookUrl: "" },
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
