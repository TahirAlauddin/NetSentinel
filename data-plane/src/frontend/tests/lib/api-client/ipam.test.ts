/**
 * Tests for IPAM API client favorite functionality
 */

import { IpamApiClient } from '@/lib/api-client/ipam'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  getSession: jest.fn().mockResolvedValue(null),
  signOut: jest.fn(),
}))

// Mock the config
jest.mock('@/lib/config', () => ({
  apiConfig: {
    clientBaseUrl: 'http://localhost:8000/api',
  },
}))

describe('IpamApiClient - Favorite Methods', () => {
  let apiClient: IpamApiClient
  let mockPost: jest.SpyInstance
  let mockDelete: jest.SpyInstance

  beforeEach(() => {
    apiClient = new IpamApiClient()
    // Spy on the methods from the base class
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPost = jest.spyOn(apiClient as any, 'post').mockResolvedValue({ data: null, error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockDelete = jest.spyOn(apiClient as any, 'delete').mockResolvedValue({ data: null, error: null })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('addSubnetToFavorites', () => {
    it('should call POST with correct endpoint', async () => {
      const mockResponse = {
        data: { id: 1, network: '192.168.1.0/24', is_favorite: true },
        error: null,
      }
      mockPost.mockResolvedValue(mockResponse)

      const result = await apiClient.addSubnetToFavorites(1)

      expect(mockPost).toHaveBeenCalledWith('/ipam/subnets/1/favorite/', {})
      expect(result).toEqual(mockResponse)
    })

    it('should handle string ID', async () => {
      const mockResponse = {
        data: { id: 1, network: '192.168.1.0/24', is_favorite: true },
        error: null,
      }
      mockPost.mockResolvedValue(mockResponse)

      await apiClient.addSubnetToFavorites('1')

      expect(mockPost).toHaveBeenCalledWith('/ipam/subnets/1/favorite/', {})
    })
  })

  describe('removeSubnetFromFavorites', () => {
    it('should call DELETE with correct endpoint', async () => {
      const mockResponse = {
        data: { id: 1, network: '192.168.1.0/24', is_favorite: false },
        error: null,
      }
      mockDelete.mockResolvedValue(mockResponse)

      const result = await apiClient.removeSubnetFromFavorites(1)

      expect(mockDelete).toHaveBeenCalledWith('/ipam/subnets/1/favorite/')
      expect(result).toEqual(mockResponse)
    })

    it('should handle string ID', async () => {
      const mockResponse = {
        data: { id: 1, network: '192.168.1.0/24', is_favorite: false },
        error: null,
      }
      mockDelete.mockResolvedValue(mockResponse)

      await apiClient.removeSubnetFromFavorites('1')

      expect(mockDelete).toHaveBeenCalledWith('/ipam/subnets/1/favorite/')
    })
  })

  describe('toggleSubnetFavorite', () => {
    it('should call addSubnetToFavorites when isFavorite is true', async () => {
      const mockResponse = {
        data: { id: 1, network: '192.168.1.0/24', is_favorite: true },
        error: null,
      }
      mockPost.mockResolvedValue(mockResponse)

      const result = await apiClient.toggleSubnetFavorite(1, true)

      expect(mockPost).toHaveBeenCalledWith('/ipam/subnets/1/favorite/', {})
      expect(mockDelete).not.toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should call removeSubnetFromFavorites when isFavorite is false', async () => {
      const mockResponse = {
        data: { id: 1, network: '192.168.1.0/24', is_favorite: false },
        error: null,
      }
      mockDelete.mockResolvedValue(mockResponse)

      const result = await apiClient.toggleSubnetFavorite(1, false)

      expect(mockDelete).toHaveBeenCalledWith('/ipam/subnets/1/favorite/')
      expect(mockPost).not.toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })
  })
})
