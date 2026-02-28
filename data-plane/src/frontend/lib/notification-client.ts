import { api } from "@/lib/utils";
import { handleApiResponse } from "@/lib/utils";
import type { InAppNotificationDto } from "@/types/notifications";

const BASE = "/notifications";

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
};
