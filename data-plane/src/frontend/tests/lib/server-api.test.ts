/**
 * Tests for server-api.ts
 */

import { ServerApiClient, serverApi } from "@/lib/server-api";
import { getServerSession } from "next-auth";

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock auth config
jest.mock("@/lib/auth", () => ({}));

// Don't mock the base client - we'll spy on methods on the instance instead

// Mock config
jest.mock("@/lib/config", () => ({
  apiConfig: {
    serverBaseUrl: "http://localhost:8000/api/v1",
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("ServerApiClient", () => {
  let client: ServerApiClient;
  let mockGetServerSession: jest.MockedFunction<typeof getServerSession>;
  let mockExecuteRequest: jest.SpyInstance;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new ServerApiClient();
    mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    // Spy on the protected executeRequest method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockExecuteRequest = jest.spyOn(client as any, "executeRequest");
  });

  describe("getApiBaseUrl", () => {
    it("should return server base URL", () => {
      const url = (client as unknown as { getApiBaseUrl(): string }).getApiBaseUrl();
      expect(url).toBe("http://localhost:8000/api/v1");
    });
  });

  describe("getSession", () => {
    it("should return session with tokens when session exists", async () => {
      const mockSession = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: {
          id: "1",
          email: "test@example.com",
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession as Parameters<typeof getServerSession>[1]);

      const session = await (client as unknown as { getSession(): Promise<{ accessToken: string; refreshToken: string } | null> }).getSession();

      expect(session).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });

    it("should return null when no session", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const session = await (client as unknown as { getSession(): Promise<{ accessToken: string; refreshToken: string } | null> }).getSession();

      expect(session).toBeNull();
    });
  });

  describe("refreshToken", () => {
    it("should refresh token successfully", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ access: "new-access-token" }),
      } as Response);

      const newToken = await (client as unknown as { refreshToken(token: string): Promise<string | null> }).refreshToken("refresh-token");

      expect(newToken).toBe("new-access-token");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/v1/auth/jwt/refresh/",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: "refresh-token" }),
        })
      );
    });

    it("should return null when refresh fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      } as Response);

      const newToken = await (client as unknown as { refreshToken(token: string): Promise<string | null> }).refreshToken("refresh-token");

      expect(newToken).toBeNull();
    });

    it("should return null on error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const newToken = await (client as unknown as { refreshToken(token: string): Promise<string | null> }).refreshToken("refresh-token");

      expect(newToken).toBeNull();
    });
  });

  describe("request", () => {
    it("should make a request and return response", async () => {
      const mockResponse = {
        data: { id: 1 },
        error: null,
        status: 200,
      };

      mockExecuteRequest.mockResolvedValue(mockResponse);

      const result = await client.request("/test");

      expect(result).toEqual({
        data: { id: 1 },
        error: null,
        status: 200,
      });
      expect(mockExecuteRequest).toHaveBeenCalledWith("/test", {
        skipRefresh: false,
      });
    });
  });

  describe("HTTP methods", () => {
    beforeEach(() => {
      mockExecuteRequest.mockResolvedValue({
        data: null,
        error: null,
        status: 200,
      });
    });

    it("get should make GET request", async () => {
      await client.get("/test");

      expect(mockExecuteRequest).toHaveBeenCalledWith("/test", {
        method: "GET",
        skipRefresh: false,
      });
    });

    it("post should make POST request with data", async () => {
      const data = { name: "Test" };
      await client.post("/test", data);

      expect(mockExecuteRequest).toHaveBeenCalledWith("/test", {
        method: "POST",
        body: JSON.stringify(data),
        skipRefresh: false,
      });
    });

    it("put should make PUT request with data", async () => {
      const data = { name: "Test" };
      await client.put("/test", data);

      expect(mockExecuteRequest).toHaveBeenCalledWith("/test", {
        method: "PUT",
        body: JSON.stringify(data),
        skipRefresh: false,
      });
    });

    it("patch should make PATCH request with data", async () => {
      const data = { name: "Test" };
      await client.patch("/test", data);

      expect(mockExecuteRequest).toHaveBeenCalledWith("/test", {
        method: "PATCH",
        body: JSON.stringify(data),
        skipRefresh: false,
      });
    });

    it("delete should make DELETE request", async () => {
      await client.delete("/test");

      expect(mockExecuteRequest).toHaveBeenCalledWith("/test", {
        method: "DELETE",
        skipRefresh: false,
      });
    });
  });

  describe("serverApi singleton", () => {
    it("should export a singleton instance", () => {
      // The singleton is created when the module loads, so we check it's the right type
      expect(serverApi).toBeDefined();
      expect(typeof (serverApi as unknown as { getApiBaseUrl(): string }).getApiBaseUrl).toBe("function");
      expect(typeof (serverApi as unknown as { getSession(): Promise<unknown> }).getSession).toBe("function");
    });
  });
});

