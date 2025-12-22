/**
 * Unit tests for lib/api-client/error-parser.ts
 */

import { parseApiError, formatFieldErrors } from '@/lib/api-client/error-parser'

describe('error-parser', () => {
  describe('parseApiError', () => {
    it('should parse simple detail error', () => {
      const error = { detail: 'Something went wrong' }
      const result = parseApiError(error)
      expect(result.message).toBe('Something went wrong')
    })

    it('should parse message field', () => {
      const error = { message: 'Error message' }
      const result = parseApiError(error)
      expect(result.message).toBe('Error message')
    })

    it('should parse field errors', () => {
      const error = {
        name: ['This field is required.'],
        asset_tag: ['This field may not be blank.'],
      }
      const result = parseApiError(error)
      expect(result.fieldErrors).toEqual({
        name: ['This field is required.'],
        asset_tag: ['This field may not be blank.'],
      })
      expect(result.message).toContain('Name: This field is required.')
      expect(result.message).toContain('Asset Tag: This field may not be blank.')
    })

    it('should parse non-field errors', () => {
      const error = {
        non_field_errors: ['End date must be after start date.'],
      }
      const result = parseApiError(error)
      expect(result.nonFieldErrors).toEqual(['End date must be after start date.'])
      expect(result.message).toContain('End date must be after start date.')
    })

    it('should combine field and non-field errors', () => {
      const error = {
        non_field_errors: ['End date must be after start date.'],
        name: ['This field is required.'],
      }
      const result = parseApiError(error)
      expect(result.message).toContain('End date must be after start date.')
      expect(result.message).toContain('Name: This field is required.')
    })

    it('should handle invalid input', () => {
      const result = parseApiError(null)
      expect(result.message).toBe('Request failed')
    })

    it('should handle string input', () => {
      const result = parseApiError('string error')
      expect(result.message).toBe('Request failed')
    })
  })

  describe('formatFieldErrors', () => {
    it('should format field errors correctly', () => {
      const fieldErrors = {
        name: ['This field is required.'],
        asset_tag: ['This field may not be blank.'],
      }
      const result = formatFieldErrors(fieldErrors)
      expect(result).toContain('Name: This field is required.')
      expect(result).toContain('Asset Tag: This field may not be blank.')
    })

    it('should handle multiple errors per field', () => {
      const fieldErrors = {
        name: ['This field is required.', 'This field must be unique.'],
      }
      const result = formatFieldErrors(fieldErrors)
      expect(result).toBe('Name: This field is required., This field must be unique.')
    })
  })
})

