/**
 * API path constants – single source of truth for backend endpoint paths.
 * Use with apiConfig.clientBaseUrl / serverBaseUrl (which already include /api/v1).
 */

/** Infrastructure (locations, departments, categories, etc.) */
export const INFRASTRUCTURE = {
  DEPARTMENTS: "/infrastructure/departments/",
  CATEGORIES: "/infrastructure/categories/",
  LOCATIONS: "/infrastructure/locations/",
} as const;

/** Notifications */
export const NOTIFICATIONS = {
  BASE: "/notifications",
  IN_APP: "/notifications/in-app/",
  CONFIG: "/notifications/config/",
  CONFIG_TEST: "/notifications/config/test/",
  IN_APP_MARK_READ: (id: number | string) => `/notifications/in-app/${id}/mark-read/`,
  IN_APP_MARK_UNREAD: (id: number | string) => `/notifications/in-app/${id}/mark-unread/`,
  IN_APP_MARK_ALL_READ: "/notifications/in-app/mark-all-read/",
  IN_APP_CREATE_TEST: "/notifications/in-app/create-test/",
} as const;
