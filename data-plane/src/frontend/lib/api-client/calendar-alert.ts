import { BaseApiClient, BaseApiResponse } from "."
import { CalendarAlertCreateUpdateDto } from "@/types/assets/dto"

/**
 * Calendar Alert API Methods
 */
export class CalendarAlertApiClient extends BaseApiClient {
  /**
   * Create a calendar alert
   * @param alert - The calendar alert to create
   * @returns The created calendar alert
   */
  async createCalendarAlert<T = unknown>({assetId, alert}: {assetId: number | string; alert: CalendarAlertCreateUpdateDto}): Promise<BaseApiResponse<T>> {
    return this.post<T>(`/assets/${assetId}/calendar-alerts/`, alert)
  }

  /**
   * Update a calendar alert
   * @param alert - The calendar alert to update
   * @returns The updated calendar alert
   */
  async updateCalendarAlert<T = unknown>({assetId, alert}: {assetId: number | string; alert: CalendarAlertCreateUpdateDto}): Promise<BaseApiResponse<T>> {
    return this.patch<T>(`/assets/${assetId}/calendar-alerts/${alert.id}/`, alert)
  }

  /**
   * Delete a calendar alert
   * @param alert - The calendar alert to delete
   * @returns The deleted calendar alert
   */
  async deleteCalendarAlert<T = unknown>({assetId, alert}: {assetId: number | string; alert: CalendarAlertCreateUpdateDto}): Promise<BaseApiResponse<T>> {
    return this.delete<T>(`/assets/${assetId}/calendar-alerts/${alert.id}/`)
  }
}