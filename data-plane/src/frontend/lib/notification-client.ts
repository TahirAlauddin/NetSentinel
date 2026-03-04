import { api } from "@/lib/utils";
import { handleApiResponse } from "@/lib/utils";
import type { InAppNotificationDto } from "@/types/notifications";

const BASE = "/notifications";

/** Backend notification config (snake_case). Used for GET/PATCH /notifications/config/ */
export interface BackendNotificationConfig {
  id?: number;
  slack_enabled: boolean;
  slack_webhook_url: string;
  slack_default_channel: string;
  discord_enabled: boolean;
  discord_webhook_url: string;
  updated_at?: string;
}

export const notificationClient = {
  /**
   * Fetch only unread in-app notifications for the current user (for bell and "view all unread").
   * @param options.limit - Max number to return (1–100). Bell uses 5, view-all uses 50.
   */
  async getUnread(options?: { limit?: number }): Promise<InAppNotificationDto[]> {
    const limit = Math.max(1, Math.min(100, options?.limit ?? 20));
    const endpoint = `${BASE}/in-app/?unread_only=true&limit=${limit}`;
    const res = await api.get<InAppNotificationDto[]>(endpoint, { requireAuth: true });
    const data = handleApiResponse(res);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Fetch all in-app notifications (read + unread) with read flag for current user (for history).
   * @param options.limit - Max number to return (1–100). Default 50.
   */
  async getAll(options?: { limit?: number }): Promise<InAppNotificationDto[]> {
    const limit = Math.max(1, Math.min(100, options?.limit ?? 50));
    const endpoint = `${BASE}/in-app/?limit=${limit}`;
    const res = await api.get<InAppNotificationDto[]>(endpoint, { requireAuth: true });
    const data = handleApiResponse(res);
    return Array.isArray(data) ? data : [];
  },

  /** Mark a single notification as read for the current user. */
  async markRead(id: number | string): Promise<void> {
    const res = await api.post<{ ok: boolean }>(
      `${BASE}/in-app/${id}/mark-read/`,
      {},
      { requireAuth: true }
    );
    if (res.error) throw new Error(res.error);
  },

  /** Mark a single notification as unread for the current user. */
  async markUnread(id: number | string): Promise<void> {
    const res = await api.post<{ ok: boolean }>(
      `${BASE}/in-app/${id}/mark-unread/`,
      {},
      { requireAuth: true }
    );
    if (res.error) throw new Error(res.error);
  },

  /** Mark all notifications as read for the current user. */
  async markAllRead(): Promise<{ marked_count: number }> {
    const res = await api.post<{ ok: boolean; marked_count: number }>(
      `${BASE}/in-app/mark-all-read/`,
      {},
      { requireAuth: true }
    );
    const data = handleApiResponse(res);
    return { marked_count: (data as { marked_count?: number }).marked_count ?? 0 };
  },

  /**
   * Fetch current user's notification channel config (Slack, Discord) from the backend.
   * Used so alerts (e.g. subnet threshold) use the same webhook URLs you configure in the UI.
   */
  async getConfig(): Promise<BackendNotificationConfig | null> {
    const res = await api.get<BackendNotificationConfig>(`${BASE}/config/`, { requireAuth: true });
    if (res.error) return null;
    return (res.data as BackendNotificationConfig) ?? null;
  },

  /**
   * Update notification channel config on the backend (partial update).
   * Persists webhook URLs so the backend uses them when sending alerts.
   */
  async patchConfig(
    data: Partial<Omit<BackendNotificationConfig, "id" | "updated_at">>
  ): Promise<BackendNotificationConfig | null> {
    const res = await api.patch<BackendNotificationConfig>(`${BASE}/config/`, data, {
      requireAuth: true,
    });
    if (res.error) return null;
    return (res.data as BackendNotificationConfig) ?? null;
  },

  /**
   * Create a test in-app notification via the backend (for testing desktop notifications and DND).
   * The notification will appear in the bell and trigger desktop/sound if preferences allow.
   */
  async createTestNotification(options?: {
    title?: string;
    message?: string;
    type?: "info" | "warning" | "error" | "success";
    link?: string;
  }): Promise<InAppNotificationDto | null> {
    const res = await api.post<InAppNotificationDto>(
      `${BASE}/in-app/create-test/`,
      options ?? {},
      { requireAuth: true }
    );
    if (res.error) return null;
    return (res.data as InAppNotificationDto) ?? null;
  },

  /**
   * Send a test notification to one channel only (slack or discord).
   * Returns { slack_ok, discord_ok, slack_error?, discord_error? } or null on request failure.
   * Error codes: no_config | slack_disabled | discord_disabled | no_webhook | webhook_failed
   */
  async sendTest(options: { channel: "slack" | "discord" }): Promise<{
    slack_ok: boolean;
    discord_ok: boolean;
    slack_error?: string | null;
    discord_error?: string | null;
  } | null> {
    const { channel } = options;
    const res = await api.post<{
      slack_ok: boolean;
      discord_ok: boolean;
      slack_error?: string | null;
      discord_error?: string | null;
    }>(`${BASE}/config/test/?channel=${channel}`, {}, { requireAuth: true });
    if (res.error) return null;
    const data = res.data as Record<string, unknown>;
    return data
      ? {
          slack_ok: !!data.slack_ok,
          discord_ok: !!data.discord_ok,
          slack_error: (data.slack_error as string | null) ?? null,
          discord_error: (data.discord_error as string | null) ?? null,
        }
      : null;
  },
};
