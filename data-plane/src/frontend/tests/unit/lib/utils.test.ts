/**
 * Unit tests for lib/utils.ts
 */

import { cn, handleApiResponse, safeApiResponse } from '@/lib/utils'
import type { BaseApiResponse } from '@/lib/api-client'

describe('lib/utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should merge Tailwind classes', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })
  })

  describe('handleApiResponse', () => {
    it('should return data for successful response', () => {
      const response: BaseApiResponse<{ id: number }> = {
        data: { id: 1 },
        status: 200,
      }
      expect(handleApiResponse(response)).toEqual({ id: 1 })
    })

    it('should throw error for failed response', () => {
      const response: BaseApiResponse = {
        error: 'Something went wrong',
        status: 400,
      }
      expect(() => handleApiResponse(response)).toThrow('Something went wrong')
    })
  })

  describe('safeApiResponse', () => {
    it('should return success object for successful response', () => {
      const response: BaseApiResponse<{ id: number }> = {
        data: { id: 1 },
        status: 200,
      }
      expect(safeApiResponse(response)).toEqual({
        success: true,
        data: { id: 1 },
      })
    })

    it('should return error object for failed response', () => {
      const response: BaseApiResponse = {
        error: 'Something went wrong',
        status: 400,
      }
      expect(safeApiResponse(response)).toEqual({
        success: false,
        error: 'Something went wrong',
      })
    })
  })
})

