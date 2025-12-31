/**
 * Tests for api-client/calendar-alert.ts
 */

import { CalendarAlertApiClient } from "@/lib/api-client/calendar-alert";

// Create shared mocks
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

// Mock next-auth/react to avoid auth issues in tests
jest.mock("next-auth/react", () => ({
  getSession: jest.fn().mockResolvedValue({
    accessToken: "mock-token",
    refreshToken: "mock-refresh-token",
  }),
  signOut: jest.fn(),
}));

// Mock the config
jest.mock("@/lib/config", () => ({
  apiConfig: {
    clientBaseUrl: "http://localhost:8000/api/v1",
  },
}));

describe("CalendarAlertApiClient", () => {
  let client: CalendarAlertApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new CalendarAlertApiClient();
    
    // Replace methods on the instance directly
    (client as any).post = mockPost;
    (client as any).patch = mockPatch;
    (client as any).delete = mockDelete;
  });

  describe("createCalendarAlert", () => {
    it("should create a calendar alert", async () => {
      const alertData = {
        date: "2024-01-01",
        message: "Test alert",
        assigned_to: 1,
      };

      mockPost.mockResolvedValue({ data: { id: 1, ...alertData }, error: null, status: 201 });

      await client.createCalendarAlert(1, alertData);

      expect(mockPost).toHaveBeenCalledWith("/assets/1/calendar-alerts/", alertData);
    });

    it("should handle string asset IDs", async () => {
      const alertData = {
        date: "2024-01-01",
        message: "Test alert",
      };

      mockPost.mockResolvedValue({ data: { id: 1, ...alertData }, error: null, status: 201 });

      await client.createCalendarAlert("1", alertData);

      expect(mockPost).toHaveBeenCalledWith("/assets/1/calendar-alerts/", alertData);
    });
  });

  describe("updateCalendarAlert", () => {
    it("should update a calendar alert", async () => {
      const alertData = {
        id: "1",
        date: "2024-01-01",
        message: "Updated alert",
        assigned_to: 1,
      };

      mockPatch.mockResolvedValue({ data: alertData, error: null, status: 200 });

      await client.updateCalendarAlert(1, alertData);

      expect(mockPatch).toHaveBeenCalledWith("/assets/1/calendar-alerts/1/", alertData);
    });
  });

  describe("deleteCalendarAlert", () => {
    it("should delete a calendar alert", async () => {
      const alertData = {
        id: "1",
        date: "2024-01-01",
        message: "Test alert",
        assigned_to: 1,
      };

      mockDelete.mockResolvedValue({ data: null, error: null, status: 204 });

      await client.deleteCalendarAlert(1, alertData);

      expect(mockDelete).toHaveBeenCalledWith("/assets/1/calendar-alerts/1/");
    });
  });
});

