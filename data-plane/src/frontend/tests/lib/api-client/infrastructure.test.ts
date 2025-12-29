/**
 * Tests for api-client/infrastructure.ts
 */

import { InfrastructureApiClient } from "@/lib/api-client/infrastructure";
import { BaseApiClient } from "@/lib/api-client";

// Create shared mocks
const mockGet = jest.fn();
const mockPost = jest.fn();
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
    buildQueryString: mockBuildQueryString,
  })),
}));

describe("InfrastructureApiClient", () => {
  let client: InfrastructureApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new InfrastructureApiClient();
  });

  describe("Locations", () => {
    describe("getLocations", () => {
      it("should get all locations without params", async () => {
        mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

        await client.getLocations();

        expect(mockGet).toHaveBeenCalledWith("/infrastructure/locations/");
      });

      it("should get all locations with params", async () => {
        mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

        await client.getLocations({ city: "New York" });

        expect(mockGet).toHaveBeenCalledWith("/infrastructure/locations?city=New+York/");
      });
    });

    describe("getLocation", () => {
      it("should get a specific location by ID", async () => {
        mockGet.mockResolvedValue({ data: { id: 1 }, error: null, status: 200 });

        await client.getLocation(1);

        expect(mockGet).toHaveBeenCalledWith("/infrastructure/locations/1/");
      });

      it("should handle string IDs", async () => {
        mockGet.mockResolvedValue({ data: { id: "1" }, error: null, status: 200 });

        await client.getLocation("1");

        expect(mockGet).toHaveBeenCalledWith("/infrastructure/locations/1/");
      });
    });

    describe("createLocation", () => {
      it("should create a new location", async () => {
        const locationData = {
          name: "Test Location",
          address1: "123 Main St",
          city: "New York",
        };

        mockPost.mockResolvedValue({ data: { id: 1, ...locationData }, error: null, status: 201 });

        await client.createLocation(locationData);

        expect(mockPost).toHaveBeenCalledWith("/infrastructure/locations/", locationData);
      });
    });
  });

  describe("Circuits", () => {
    describe("getCircuits", () => {
      it("should get all circuits", async () => {
        mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

        await client.getCircuits();

        expect(mockGet).toHaveBeenCalledWith("/infrastructure/circuits/");
      });

      it("should get circuits with params", async () => {
        mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

        await client.getCircuits({ location: 1 });

        expect(mockGet).toHaveBeenCalledWith("/infrastructure/circuits?location=1/");
      });
    });

    describe("getCircuit", () => {
      it("should get a specific circuit by ID", async () => {
        mockGet.mockResolvedValue({ data: { id: 1 }, error: null, status: 200 });

        await client.getCircuit(1);

        expect(mockGet).toHaveBeenCalledWith("/infrastructure/circuits/1/");
      });
    });
  });

  describe("Points of Contact", () => {
    describe("getPointsOfContact", () => {
      it("should get all points of contact", async () => {
        mockGet.mockResolvedValue({ data: [], error: null, status: 200 });

        await client.getPointsOfContact();

        expect(mockGet).toHaveBeenCalledWith("/infrastructure/points-of-contact/");
      });
    });

    describe("getPointOfContact", () => {
      it("should get a specific point of contact by ID", async () => {
        mockGet.mockResolvedValue({ data: { id: 1 }, error: null, status: 200 });

        await client.getPointOfContact(1);

        expect(mockGet).toHaveBeenCalledWith("/infrastructure/points-of-contact/1/");
      });
    });
  });
});

