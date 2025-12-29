/**
 * Tests for api-client/asset.ts
 */

import { AssetsApiClient } from "@/lib/api-client/asset";
import { BaseApiClient } from "@/lib/api-client";

// Create shared mocks
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();
const mockBuildQueryString = jest.fn((params) => {
  if (!params || Object.keys(params).length === 0) return "";
  const query = new URLSearchParams(params).toString();
  return `?${query}`;
});

// Mock the base client
jest.mock("@/lib/api-client", () => ({
  BaseApiClient: jest.fn().mockImplementation(() => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
    buildQueryString: mockBuildQueryString,
  })),
}));

describe("AssetsApiClient", () => {
  let client: AssetsApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new AssetsApiClient();
  });

  describe("getAssets", () => {
    it("should get all assets without params", async () => {
      mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

      await client.getAssets();

      expect(mockGet).toHaveBeenCalledWith("/assets/");
    });

    it("should get all assets with params", async () => {
      mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

      await client.getAssets({ category: 1, status: "active" });

      expect(mockGet).toHaveBeenCalledWith("/assets?category=1&status=active/");
    });
  });

  describe("getAsset", () => {
    it("should get a specific asset by ID", async () => {
      mockGet.mockResolvedValue({ data: { id: 1 }, error: null, status: 200 });

      await client.getAsset(1);

      expect(mockGet).toHaveBeenCalledWith("/assets/1/");
    });

    it("should handle string IDs", async () => {
      mockGet.mockResolvedValue({ data: { id: "1" }, error: null, status: 200 });

      await client.getAsset("1");

      expect(mockGet).toHaveBeenCalledWith("/assets/1/");
    });
  });

  describe("getAssetTags", () => {
    it("should get all asset tags", async () => {
      mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

      await client.getAssetTags();

      expect(mockGet).toHaveBeenCalledWith("/assets/tags/");
    });

    it("should get asset tags with params", async () => {
      mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

      await client.getAssetTags({ search: "test" });

      expect(mockGet).toHaveBeenCalledWith("/assets/tags?search=test/");
    });
  });

  describe("getAssetTag", () => {
    it("should get a specific asset tag by ID", async () => {
      mockGet.mockResolvedValue({ data: { id: 1 }, error: null, status: 200 });

      await client.getAssetTag(1);

      expect(mockGet).toHaveBeenCalledWith("/assets/tags/1/");
    });
  });

  describe("getLifecycles", () => {
    it("should get all custom lifecycles", async () => {
      mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

      await client.getLifecycles();

      expect(mockGet).toHaveBeenCalledWith("/assets/lifecycles/");
    });
  });

  describe("getLifecycle", () => {
    it("should get a specific lifecycle by ID", async () => {
      mockGet.mockResolvedValue({ data: { id: 1 }, error: null, status: 200 });

      await client.getLifecycle(1);

      expect(mockGet).toHaveBeenCalledWith("/assets/lifecycles/1/");
    });
  });

  describe("getVendors", () => {
    it("should get all vendors", async () => {
      mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

      await client.getVendors();

      expect(mockGet).toHaveBeenCalledWith("/assets/vendors/");
    });
  });

  describe("getVendor", () => {
    it("should get a specific vendor by ID", async () => {
      mockGet.mockResolvedValue({ data: { id: 1 }, error: null, status: 200 });

      await client.getVendor(1);

      expect(mockGet).toHaveBeenCalledWith("/assets/vendors/1/");
    });
  });

  describe("getTechSpecs", () => {
    it("should get all tech specs", async () => {
      mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

      await client.getTechSpecs();

      expect(mockGet).toHaveBeenCalledWith("/assets/tech-specs/");
    });
  });

  describe("getTechSpec", () => {
    it("should get a specific tech spec by ID", async () => {
      mockGet.mockResolvedValue({ data: { id: 1 }, error: null, status: 200 });

      await client.getTechSpec(1);

      expect(mockGet).toHaveBeenCalledWith("/assets/tech-specs/1/");
    });
  });
});

