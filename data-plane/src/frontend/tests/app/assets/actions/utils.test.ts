/**
 * Tests for app/(app)/assets/actions/utils.ts
 */

import { AssetActionUtils } from "@/app/(app)/assets/actions/utils";
import { getServerSession } from "next-auth";
import { serverApi } from "@/lib/server-api";

// Mock dependencies
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({}));

jest.mock("@/lib/server-api", () => ({
  serverApi: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe("AssetActionUtils", () => {
  const mockGetServerSession = getServerSession as jest.MockedFunction<
    typeof getServerSession
  >;
  const mockServerApiGet = serverApi.get as jest.MockedFunction<typeof serverApi.get>;
  const mockServerApiPost = serverApi.post as jest.MockedFunction<typeof serverApi.post>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ensureAuthenticated", () => {
    it("should throw error when session is null", () => {
      expect(() => AssetActionUtils.ensureAuthenticated(null)).toThrow(
        "Not authenticated"
      );
    });

    it("should throw error when accessToken is missing", () => {
      expect(() =>
        AssetActionUtils.ensureAuthenticated({ user: {} } as { user: Record<string, unknown> })
      ).toThrow("Not authenticated");
    });

    it("should not throw when authenticated", () => {
      expect(() =>
        AssetActionUtils.ensureAuthenticated({
          accessToken: "token",
        } as { accessToken: string })
      ).not.toThrow();
    });
  });

  describe("extractArrayData", () => {
    it("should return array when data is array", () => {
      const data = [{ id: 1 }, { id: 2 }];
      expect(AssetActionUtils.extractArrayData(data)).toEqual(data);
    });

    it("should extract results from paginated response", () => {
      const data = { results: [{ id: 1 }, { id: 2 }] };
      expect(AssetActionUtils.extractArrayData(data)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("should return empty array when data is null", () => {
      expect(AssetActionUtils.extractArrayData(null)).toEqual([]);
    });

    it("should return empty array when data is undefined", () => {
      expect(AssetActionUtils.extractArrayData(undefined)).toEqual([]);
    });

    it("should return empty array for unexpected format", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      expect(AssetActionUtils.extractArrayData({ unexpected: "format" })).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("buildQueryString", () => {
    it("should build query string with all params", () => {
      const params = {
        category: 1,
        status: "active",
        vendor: 2,
        location: 3,
        search: "test",
      };
      const result = AssetActionUtils.buildQueryString(params);
      expect(result).toContain("category=1");
      expect(result).toContain("status=active");
      expect(result).toContain("vendor=2");
      expect(result).toContain("location=3");
      expect(result).toContain("search=test");
    });

    it("should build query string with partial params", () => {
      const params = {
        category: 1,
        status: "active",
      };
      const result = AssetActionUtils.buildQueryString(params);
      expect(result).toBe("category=1&status=active");
    });

    it("should return empty string when no params", () => {
      expect(AssetActionUtils.buildQueryString()).toBe("");
    });

    it("should return empty string when params is empty object", () => {
      expect(AssetActionUtils.buildQueryString({})).toBe("");
    });
  });

  describe("findOrCreateAssetTag", () => {
    it("should return null for empty tag name", async () => {
      const result = await AssetActionUtils.findOrCreateAssetTag("");
      expect(result).toBeNull();
    });

    it("should return null when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const result = await AssetActionUtils.findOrCreateAssetTag("Test Tag");
      expect(result).toBeNull();
    });

    it("should return existing tag ID when tag exists", async () => {
      mockGetServerSession.mockResolvedValue({
        accessToken: "token",
      } as { accessToken: string });
      mockServerApiGet.mockResolvedValue({
        data: [{ id: 1, name: "Test Tag" }],
        error: null,
        status: 200,
      });

      const result = await AssetActionUtils.findOrCreateAssetTag("Test Tag");
      expect(result).toBe(1);
    });

    it("should create new tag when tag doesn't exist", async () => {
      mockGetServerSession.mockResolvedValue({
        accessToken: "token",
      } as { accessToken: string });
      mockServerApiGet.mockResolvedValue({
        data: [],
        error: null,
        status: 200,
      });
      mockServerApiPost.mockResolvedValue({
        data: { id: 2, name: "New Tag" },
        error: null,
        status: 201,
      });

      const result = await AssetActionUtils.findOrCreateAssetTag("New Tag");
      expect(result).toBe(2);
      expect(mockServerApiPost).toHaveBeenCalledWith("/assets/tags/", {
        name: "New Tag",
      });
    });

    it("should handle case-insensitive tag matching", async () => {
      mockGetServerSession.mockResolvedValue({
        accessToken: "token",
      } as { accessToken: string });
      mockServerApiGet.mockResolvedValue({
        data: [{ id: 1, name: "test tag" }],
        error: null,
        status: 200,
      });

      const result = await AssetActionUtils.findOrCreateAssetTag("Test Tag");
      expect(result).toBe(1);
    });

    it("should return null on creation failure", async () => {
      mockGetServerSession.mockResolvedValue({
        accessToken: "token",
      } as { accessToken: string });
      mockServerApiGet.mockResolvedValue({
        data: [],
        error: null,
        status: 200,
      });
      mockServerApiPost.mockResolvedValue({
        data: null,
        error: "Creation failed",
        status: 400,
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const result = await AssetActionUtils.findOrCreateAssetTag("New Tag");
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it("should handle errors gracefully", async () => {
      mockGetServerSession.mockResolvedValue({
        accessToken: "token",
      } as { accessToken: string });
      mockServerApiGet.mockRejectedValue(new Error("Network error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const result = await AssetActionUtils.findOrCreateAssetTag("Test Tag");
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });
});



