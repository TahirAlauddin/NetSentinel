/**
 * Tests for api-client/user.ts
 */

import { UserApiClient } from "@/lib/api-client/user";
import { BaseApiClient } from "@/lib/api-client";

// Create shared mocks
const mockGet = jest.fn();
const mockBuildQueryString = jest.fn((params) => {
  if (!params || Object.keys(params).length === 0) return "";
  const query = new URLSearchParams(params).toString();
  return `?${query}`;
});

// Mock the base client
jest.mock("@/lib/api-client", () => ({
  BaseApiClient: jest.fn().mockImplementation(() => ({
    get: mockGet,
    buildQueryString: mockBuildQueryString,
  })),
}));

describe("UserApiClient", () => {
  let client: UserApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new UserApiClient();
  });

  describe("getUsers", () => {
    it("should get all users without params", async () => {
      mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

      await client.getUsers();

      expect(mockGet).toHaveBeenCalledWith("/users/users/");
    });

    it("should get all users with params", async () => {
      mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

      await client.getUsers({ is_active: true });

      expect(mockGet).toHaveBeenCalledWith("/users/users?is_active=true/");
    });
  });

  describe("getUser", () => {
    it("should get a specific user by ID", async () => {
      mockGet.mockResolvedValue({ data: { id: 1 }, error: null, status: 200 });

      await client.getUser(1);

      expect(mockGet).toHaveBeenCalledWith("/users/users/1/");
    });

    it("should handle string IDs", async () => {
      mockGet.mockResolvedValue({ data: { id: "1" }, error: null, status: 200 });

      await client.getUser("1");

      expect(mockGet).toHaveBeenCalledWith("/users/users/1/");
    });
  });
});

